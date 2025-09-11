from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import AsyncGenerator,List,Optional
import json
import asyncio 
from services.vision_service import get_summary_from_image
from services.imagekit_service import upload_image_to_imagekit
from chatbot import ConversationState
# Import the LangGraph app and the LLM instance from your chatbot file
from chatbot import app as langgraph_app
from fastapi import UploadFile, File, Form
# --- Pydantic Models for API validation ---
class ChatRequest(BaseModel):
    message: str
    user_id: str
    conversation_history: List[str] = []
    model_id: int = 3
    salary: Optional[float] = None

    # conversation_id: str | None = None # Optional: for session management

# --- FastAPI App Initialization ---
app = FastAPI(
    title="Conversational Expense AI Backend",
    description="API for the conversational expense tracking chatbot.",
    version="1.0.0"
)

# --- CORS Middleware ---
# Allows your React frontend to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your frontend's domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Streaming Generator for Analytics ---
# --- Streaming Generator for LangGraph ---
async def stream_langgraph_events(request: ChatRequest) -> AsyncGenerator[str, None]:
    """
    Runs the LangGraph app and yields each new token in Server-Sent Events (SSE) format.
    """
    # This is the initial state for a brand new conversation
    initial_state = ConversationState(
        user_id=request.user_id,
        model_id=request.model_id,
        conversation_history=request.conversation_history + [request.message],
        salary=request.salary,  # Pass the salary from the request
        
        # --- Add all default values to ensure the state is always valid ---
        last_intent="",
        current_entities={},
        response={},
        user_question="",
        query_plan={},
        query_results=[],
        feedback_message="",
        iteration_count=0,
        critique_feedback="",
        advice_iteration_count=0,
    )

    full_response_message = ""
    
    # .astream() is the asynchronous streaming method for the graph
    async for event in langgraph_app.astream(initial_state):
        for node_name, node_output in event.items():
            if "response" in node_output and node_output["response"]:
                current_message = node_output["response"].get("message", "")
                
                # Calculate the new part of the message
                new_part = current_message[len(full_response_message):]
                
                if new_part:
                    # SSE format: "data: {your_data}\n\n"
                    # We send a JSON string for easier parsing on the frontend
                    data_to_send = json.dumps({"token": new_part})
                    yield f"data: {data_to_send}\n\n"
                    full_response_message = current_message
                    
    # Signal the end of the stream
    yield f"data: {json.dumps({'event': 'end'})}\n\n"

# --- Streaming Chat Endpoint ---
@app.post("/chat-stream")
async def chat_stream_endpoint(request: ChatRequest):
    """
    Receives a message, runs it through the LangGraph, and streams the response.
    """
    return StreamingResponse(
        stream_langgraph_events(request), 
        media_type="text/event-stream"
    )
@app.post("/upload-receipt")
async def handle_receipt_upload(user_id: str = Form(...),file: UploadFile = File(...)):
    """
    Receives an image receipt, extracts expense data using an AI model,
    saves the image to ImageKit, and adds the expense to the database via LangGraph.
    """
    # --- START: CRITICAL CHANGE ---
    # Read the file content into memory immediately.
    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Received empty image file.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {e}")

    # 1. Get the text summary from the vision model using the bytes.
    # IMPORTANT: You must modify get_summary_from_image to accept bytes instead of UploadFile.
    # Example: summary_text = await get_summary_from_image(image_bytes)
    # If you absolutely cannot change get_summary_from_image, keep the original call,
    # but this pattern is less reliable. For now, let's assume you'll pass bytes:
    
    # --- TEMPORARY WORKAROUND (if you can't change get_summary_from_image yet) ---
    # If get_summary_from_image MUST take the file object, do this:
    await file.seek(0) # Reset pointer for get_summary_from_image
    summary_text = await get_summary_from_image(file) # Original call
    # The image_bytes variable read earlier is still valid for ImageKit.
    # --- End of workaround ---

    # --- PREFERRED METHOD (assuming you change get_summary_from_image) ---
    # summary_text = await get_summary_from_image(image_bytes) 

    # 2. Upload the original image bytes to ImageKit for persistence.
    #    Pass bytes and filename instead of the whole file object.
    try:
        image_url = await upload_image_to_imagekit(
            image_bytes=image_bytes,
            filename=file.filename,
            user_id=user_id
        )
    except Exception as e:
        # Catch errors specifically from the upload service
        raise HTTPException(status_code=500, detail=f"Image upload service failed: {e}")
    # --- END: CRITICAL CHANGE ---

    # 3. Directly invoke your LangGraph logic with the summary
    print(f"Extracted summary: '{summary_text}'. Processing with LangGraph.")
    
    initial_state = {
        "user_id": user_id,
        "conversation_history": [summary_text],
        "model_id": 2,
        "last_intent": "",
        "current_entities": {"image_url": image_url},
        "response": {},
        "user_question": "",
        "query_plan": {},
        "query_results": [],
        "feedback_message": "",
        "iteration_count": 0,
    }

    # 4. Invoke the LangGraph app to process and save the expense
    final_state = await langgraph_app.ainvoke(initial_state)

    # 5. Return the result to the user
    response_obj = final_state.get("response", {"message": "Sorry, an error occurred while processing the receipt."})
    return {
        "status": "success",
        "extracted_text": summary_text,
        "reply": response_obj.get("message"),
        "image_url": image_url
    }
# --- Main Chat Endpoint ---
@app.post("/chat")
async def handle_chat(request: ChatRequest):
    """
    Receives a message, runs it through the LangGraph, and returns a response.
    Handles both normal and streaming responses.
    """
    # Initial state for the LangGraph. In a real app, you'd load this from a DB
    # using a conversation_id.
    initial_state = {
        "user_id": request.user_id,
        "conversation_history": [request.message],
        "last_intent": "",
        "current_entities": {},
        "response": {},
        "user_question": "",
        "query_plan": {},
        "query_results": [],
        "feedback_message": "",
        "iteration_count": 0,
    }

    # Invoke the LangGraph to process the request
    final_state = langgraph_app.invoke(initial_state)
    # # Invoke the LangGraph asynchronously to process the request
    # final_state = await langgraph_app.ainvoke(initial_state)

    # Check the intent determined by the graph to decide on the response type
    intent = final_state.get("last_intent")

    if intent == "analytics":
        # For analytics, we stream the final summary
        print("Analytics intent detected. Starting stream.")
        question = final_state["user_question"]
        results = final_state["query_results"]
        return StreamingResponse(
            stream_final_answer(question, results), 
            media_type="text/event-stream"
        )
    else:
        # For adding expenses or chit-chat, return a simple JSON response
        print(f"'{intent}' intent detected. Returning JSON.")
        response_obj = final_state.get("response", {"message": "Sorry, an error occurred."})
        return JSONResponse(content={"reply": response_obj.get("message")})


# --- Streaming Chat Endpoint ---
@app.post("/chat-stream")
async def chat_stream_endpoint(request: ChatRequest):
    """
    Receives a message, runs it through the LangGraph, and streams the response.
    """
    return StreamingResponse(
        stream_langgraph_events(request), 
        media_type="text/event-stream"
    )


# --- Health Check Endpoint ---
@app.get("/")
def read_root():
    return {"status": "ok", "message": "Expense Chatbot API is running"}