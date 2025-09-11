"""from langchain_google_genai import ChatGoogleGenerativeAI"""
from langgraph.graph import StateGraph, END
from langchain.prompts import ChatPromptTemplate
from pymongo import MongoClient
from dotenv import load_dotenv
import os
import json
import traceback
from datetime import datetime, timedelta
from typing import TypedDict, List
from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace
from langsmith import traceable # <-- 1. IMPORT TRACEABLE
import asyncio
from langchain_google_genai import ChatGoogleGenerativeAI
from typing import TypedDict, List, AsyncGenerator,Optional
from langchain_core.language_models.chat_models import BaseChatModel
# -------------------- CONFIG --------------------
load_dotenv()
DEV_USER_ID = "abc13"
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY")
MONGO_URI = os.getenv("MONGO_URI")
HF_TOKEN = os.getenv("HUGGINGFACEHUB_API_TOKEN")
if not GEMINI_API_KEY:
    raise ValueError("❌ GOOGLE_API_KEY not found in .env")
if not MONGO_URI:
    raise ValueError("❌ MONGO_URI not found in .env")

def get_llm(model_id: int) -> BaseChatModel:
    """
    Returns a specific LLM instance based on the provided ID.
    1: Gemini 1.5 Flash
    2: Gemini 1.5 Pro
    3: Qwen 7B Instruct (HuggingFace)
    4: Mistral 7B Instruct (HuggingFace)
    """
    print(f"🔄 Selecting LLM for model_id: {model_id}")
    if model_id == 1:
        # Fast and cost-effective
        return ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.1)
    elif model_id == 2:
        # More powerful, for complex tasks
        return ChatGoogleGenerativeAI(model="gemini-1.5-pro", temperature=0.1)
    elif model_id == 3:
        # Qwen model from HuggingFace
        client = HuggingFaceEndpoint(
            repo_id="Qwen/Qwen2.5-7B-Instruct",
            task="conversational",
            huggingfacehub_api_token=HF_TOKEN,
            temperature=0.1,
            max_new_tokens=512,
        )
        return ChatHuggingFace(llm=client)
    elif model_id == 4:
        # Mistral model from HuggingFace
        client = HuggingFaceEndpoint(
            repo_id="mistralai/Mistral-7B-Instruct-v0.2",
            task="conversational",
            huggingfacehub_api_token=HF_TOKEN,
            temperature=0.1,
            max_new_tokens=512,
        )
        return ChatHuggingFace(llm=client)
    else:
        # Default to Gemini Flash if ID is invalid
        print(f"⚠️ Invalid model_id '{model_id}'. Defaulting to 1 (Gemini Flash).")
        return ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.1)




client = MongoClient(MONGO_URI)
db = client["expense_db"]
expenses_collection = db["expenses"]
user_profiles_collection = db["user_profiles"]

# -------------------- STATE --------------------
class ConversationState(TypedDict):
    user_id: str
    conversation_history: List[str]
    model_id: int
    last_intent: str
    current_entities: dict
    response: dict
    user_question: str
    query_plan: dict
    query_results: List[dict]
    feedback_message: str
    iteration_count: int
    # --- New fields below ---
    salary: Optional[float]
    critique_feedback: str
    advice_iteration_count: int

# -------------------- TOOLS --------------------
# --- NEW: Tools for managing user salary ---
@traceable
def get_user_salary(user_id: str) -> Optional[float]:
    """Fetches the user's monthly salary from the user_profiles collection."""
    profile = user_profiles_collection.find_one({"user_id": user_id})
    return profile.get("monthly_salary") if profile else None

@traceable
def update_user_salary(user_id: str, salary: float) -> dict:
    """Updates or creates a user's profile with their monthly salary."""
    try:
        user_profiles_collection.update_one(
            {"user_id": user_id},
            {"$set": {"monthly_salary": salary, "last_updated": datetime.now()}},
            upsert=True,
        )
        return {"status": "ok"}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@traceable # <-- Decorate your function
def extract_expense_entities(user_input: str, llm: BaseChatModel) -> dict:
    """
    Uses an LLM to extract structured expense data from a user's natural language query.
    """
    today = datetime.now().strftime("%Y-%m-%d")
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

    prompt = ChatPromptTemplate.from_template(
        """
        Context:
        - Today's date is {date}.
        - Yesterday's date is {yesterday}.
You are an expert entity-extraction system for a personal expense tracker.
## Goal
Given a natural-language user message describing an expense, extract structured fields and return **one single valid JSON object** that conforms to the schema below. Do **not** include any extra text, explanations, or markdown—output the JSON object only.
Here is the query by user but before doing anything first read the rules-
 UserQuery: "{query}" (You need to work on this by reading the rules below)
## Hard requirements
- You **must** infer three fields for sure: "amount", "category", and "date".
- When information is missing in the text, apply the default rules below—never omit required fields.
- Output **exactly one** JSON object per input.
## Fixed categories (choose exactly one)
Use these 9 categories; if none fit, use "other" as the 10th.
1. "food" — restaurants, cafes, bars, takeaway, delivery, snacks.
2. "groceries" — supermarket, kirana, produce, daily essentials (not eaten on-premise).
3. "transport" — local commute: taxi/auto/ride-hail, bus, metro, local train, fuel, parking, tolls.
4. "travel" — intercity/long-distance travel & lodging: flights, intercity trains/buses, hotels, visas.
5. "shopping" — apparel, electronics, home goods, personal items, gifts.
6. "utilities" — electricity, water, gas cylinder/piped gas, mobile/landline, internet, DTH.
7. "rent_housing" — house/office rent, maintenance, HOA/society dues, repairs.
8. "healthcare" — doctor, hospital, diagnostics, pharmacy/medication, insurance co-pay.
9. "entertainment" — movies, concerts, events, subscriptions, games, books.
10. "other" — anything not covered above.
## Output schema (and formats)
```json
{{
  "amount": <number>,                  // REQUIRED. Numeric value only; remove commas. Include tips/fees if they are part of what the user paid.
  "category": <string>,                // REQUIRED. One of the fixed categories above.
  "description": <string>,             // REQUIRED. Brief 2–6 word summary (e.g., "Dinner at KFC").
  "people": [                          // OPTIONAL. People involved besides the user.
    {{ "name": <string> }}              // Person’s name only; one object per person.
  ],
  "vendor": <string>,                  // OPTIONAL. Merchant/app/brand/place if mentioned (e.g., "Swiggy", "Uber", "Big Bazaar", "PVR").
  "date": <string>                     // REQUIRED. "YYYY-MM-DD" (ISO), resolved in Asia/Kolkata timezone.
}}
Date rules: use only DD/MM/YYYY format
Today’s date is {date} (Asia/Kolkata). Resolve relative dates accordingly:
"today" → {date}
Weekday words ("last Friday", "this Monday") → resolve to the most recent matching calendar date relative to {date}.
If a specific calendar date is given (e.g., 15 Aug, 15/08/2025, Aug 15), convert to "YYYY-MM-DD".
If no date is mentioned, use {date}.
Amount rules
Extract the amount the user paid. If the text says it’s split, use the user’s share; otherwise assume the total mentioned is what the user paid.
Include tips, delivery, taxes, and fees if they are part of what the user paid.
Accept formats like "Rs 2,500", "₹2500", "$30", "12k", "2.5k". Interpret "k" as ×1000.
Output number only in "amount" (no currency symbols or commas). Optionally set "currency".
People & vendor
"people" includes named companions (friends, family, colleagues). Do not include generic words ("friends", "team") unless names are provided.
"vendor" is the merchant/service/app or venue name when present.
Disambiguation & ties
If multiple amounts are present (e.g., base + tip), prefer the sum if both are clearly paid by the user; else prefer the most explicit "paid/charged/billed" amount.
If multiple categories fit, pick the most specific (e.g., groceries vs. food: supermarket → groceries; restaurant/cafe → food).
Never invent names or vendors; omit those fields if not stated.
Output constraints
Return only the JSON object.
Ensure valid JSON (double quotes, no trailing commas).
Strings should be concise and informative.
Examples
Query: "flight tickets to delhi cost 12000"
Output:
{{"amount": 12000, "currency": "INR", "category": "travel", "description": "Flight tickets to Delhi", "people": [], "vendor": "", "date": "{date}"}}
Query: "Paid ₹320 for Uber to office with Riya"
Output:
{{"amount": 320, "currency": "INR", "category": "transport", "description": "Uber ride to office", "people": [{{"name": "Riya"}}], "vendor": "Uber", "date": "{date}"}}
Query: "Last Friday, Netflix yearly renewal 4999"
Output:
{{"amount": 4999, "currency": "INR", "category": "entertainment", "description": "Netflix annual subscription", "people": [], "vendor": "Netflix", "date": "{{resolved_last_friday}}"}}
Query: "Bought veggies and milk at Reliance Fresh for 1.2k"
Output:
{{"amount": 1200, "currency": "INR", "category": "groceries", "description": "Groceries at Reliance Fresh", "people": [], "vendor": "Reliance Fresh", "date": "{date}"}}
Query: "Rent paid 18,000 for August"
Output:
{{"amount": 18000, "currency": "INR", "category": "rent_housing", "description": "Monthly rent", "people": [], "vendor": "", "date": "{date}"}}
Query: "Electricity bill ₹2,150 on Tata Power"
Output:
{{"amount": 2150, "currency": "INR", "category": "utilities", "description": "Electricity bill payment", "people": [], "vendor": "Tata Power", "date": "{date}"}}
User Query: "{query}"
"""
    )
    chain = prompt | llm
    try:
        response = chain.invoke({"date": today, "yesterday": yesterday, "query": user_input})
        content = getattr(response, "content", str(response))
        cleaned_content = content.strip().replace("```json", "").replace("```", "").strip()
        entities = json.loads(cleaned_content)
        entities["raw_text"] = user_input
        return entities
    except (json.JSONDecodeError, Exception) as e:
        # Errors will be automatically logged by LangSmith
        return {
            "amount": None, "category": "uncategorized", "description": "Failed to parse details",
            "people": [], "date": today, "raw_text": user_input, "error": str(e)
        }

@traceable
def classify_intent(user_input: str, llm: BaseChatModel) -> str:
    """Classify intent into add_expense, analytics, chit_chat, update_salary, or financial_advice"""
    prompt = ChatPromptTemplate.from_template(
        "Classify this user query: {query}. "
        "Return only one label exactly: add_expense | analytics | chit_chat | update_salary | financial_advice"
    )
    try:
        response = llm.invoke(prompt.format(query=user_input))
        content = getattr(response, "content", str(response)).strip().lower()
        if content not in ["add_expense", "analytics", "chit_chat", "update_salary", "financial_advice"]:
            return "chit_chat"
        return content
    except Exception:
        return "chit_chat"

@traceable
def add_expense_tool(entities: dict) -> dict:
    """Insert parsed expense into MongoDB"""
    try:
        res = expenses_collection.insert_one(entities)
        return {"status": "ok", "inserted_id": str(res.inserted_id), "entities": entities}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@traceable
def chit_chat_tool(user_input: str, llm: BaseChatModel) -> dict:
    """General chit chat handled by the LLM"""
    try:
        response = llm.invoke(user_input)
        content = getattr(response, "content", str(response))
        return {"status": "ok", "reply": content}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@traceable
def create_analytics_plan(question: str, history: List[str], feedback: str, llm: BaseChatModel) -> dict:
    """Uses an LLM to create a structured MongoDB query plan from a user's question."""
    context = "\n".join(history[-5:])
    today = datetime.now().strftime("%Y-%m-%d")
    prompt = ChatPromptTemplate.from_template(
        """
        **Context of the conversation:**
        {context}
        **Previous attempt feedback (if any):**
        {feedback}
        You are an expert entity-extraction system for a personal expense tracker analytics engine.
## Goal Given a natural-language query about expenses, extract filters that can be applied to query the database. 
User Query: "{question}" First read the rules given below then work on this query 
You must return **one single valid JSON object** conforming to the schema below.  
Do **not** include any extra text, explanations, or markdown outside the JSON.
## Database Schema
Each expense record in the database is stored in this structure:
{{
  "amount": <number>,              // Numeric, amount of money spent
  "category": <string>,            // One of the fixed categories listed below
  "description": <string>,         // Short description of the expense
  "people": [{{ "name": <string> }}], // List of people involved
  "vendor": <string>,              // Merchant, app, or vendor name if available
  "date": <string>                 // ISO date in "YYYY-MM-DD" format
}}
## Expected Analytics Filter Schema
When analyzing, you only need to extract **filters** to apply against this data:
{{
  "year": <integer, optional>,       // Year of interest, e.g., 2023. Omit if not provided.
  "month": <integer, optional>,      // Month of interest (1–12). Omit if not provided.
  "day": <integer, optional>,        // Day of the month (1–31). Omit if not provided.
  "category": <string, optional>,    // One of the fixed categories below. Omit if not provided.
  "people": <array of strings, optional> // Names of people involved, as plain strings. Omit if not provided.
}}
## Categories
The only valid values for `"category"` are:
- "food"
- "groceries"
- "transport"
- "travel"
- "shopping"
- "utilities"
- "rent_housing"
- "healthcare"
- "entertainment"
- "other"
## Rules
- Only include fields that the user explicitly refers to or that can be unambiguously inferred.
- If the user asks about a specific **year, month, or day**, include those fields as integers.
  - "last month" → resolve into the numeric month (1–12) and include the year as well.
  - "this year" → resolve into the current year.
  - "yesterday" or a specific date ("21st September") → resolve into `year`, `month`, and `day`.
- If no time period is mentioned, omit year/month/day.
- If a category is mentioned, it must exactly match one of the valid categories above; otherwise use "other".
- If people are mentioned, return their names as strings inside the array. Do not include generic words like "friends" or "family".
- If a field is not mentioned, **omit it** from the JSON. Do not include nulls or empty values.
---
Current Date is {date}  
User Query: "{question}"
"""
    )
    chain = prompt | llm
    try:
        response = chain.invoke({"question": question, "context": context, "feedback": feedback or "None", "date": today})
        content = getattr(response, "content", str(response))
        cleaned_content = content.strip().replace("```json", "").replace("```", "").strip()
        plan = json.loads(cleaned_content)
        return plan
    except Exception as e:
        return {"error": f"Failed to generate a valid query plan: {e}"}

@traceable
def execute_mongo_pipeline(plan: dict,user_id: str) -> dict:
    """Dynamically builds and executes a MongoDB aggregation pipeline from a plan."""
    if "error" in plan:
        return {"status": "error", "error": "Invalid plan received."}
    
    try:
        match_stage = {"user_id": user_id}
        if "year" in plan and "month" in plan and "day" in plan:
            date_str = f"{plan['year']}-{plan['month']:02d}-{plan['day']:02d}"
            match_stage["date"] = date_str
        
        filters = plan.get("filters", {})
        if filters.get("category"):
            match_stage["category"] = filters["category"]
        if filters.get("date_range"):
            match_stage["date"] = {
                "$gte": filters["date_range"]["start"],
                "$lte": filters["date_range"]["end"]
            }
        
        pipeline = [{"$match": match_stage}] if match_stage else []

        query_type = plan.get("query_type")
        if query_type == "SUM":
            pipeline.append({"$group": {"_id": None, "total": {"$sum": "$amount"}}})
        elif query_type == "GROUP_BY":
            group_field = plan.get("group_by_field")
            if not group_field:
                return {"status": "error", "error": "GROUP_BY requires a group_by_field."}
            pipeline.append({"$group": {"_id": f"${group_field}", "total": {"$sum": "$amount"}}})
            pipeline.append({"$project": {"name": "$_id", "total": 1, "_id": 0}})
        
        results = list(expenses_collection.aggregate(pipeline))
        for r in results:
            if "_id" in r:
                r["_id"] = str(r["_id"])
        return {"status": "ok", "results": results, "pipeline_executed": pipeline}

    except Exception as e:
        return {"status": "error", "error": str(e)}

# -------------------- NODES --------------------
@traceable
def intent_classifier(state: ConversationState):
    llm = get_llm(state["model_id"])
    user_input = state["conversation_history"][-1]
    intent = classify_intent(user_input,llm)
    state["last_intent"] = intent
    return state

# In the add_expense_node function, change:
# THIS IS THE NEW, MODIFIED CODE

# --- NEW: Node to update the user's salary in the DB ---
@traceable
def update_salary_node(state: ConversationState):
    """Extracts salary from message and updates the database."""
    llm = get_llm(state["model_id"])
    user_input = state["conversation_history"][-1]
    
    extraction_prompt = ChatPromptTemplate.from_template(
        "Extract only the numerical value of a monthly salary from this text: '{query}'. Respond with just the number, no commas."
    )
    chain = extraction_prompt | llm
    response = chain.invoke({"query": user_input})
    salary_str = getattr(response, "content", "0").strip()

    try:
        salary = float(salary_str)
        update_user_salary(state["user_id"], salary)
        message = f"Got it! I've updated your monthly salary to {salary}."
    except (ValueError, Exception):
        message = "I couldn't understand that number. Please state your salary clearly, for example: 'my salary is 50000'."

    state["response"] = {"message": message}
    return state

# --- NEW: Node to check if salary exists before proceeding ---
@traceable
def get_salary_node(state: ConversationState):
    """Checks if salary exists in DB. This determines the next step."""
    salary = get_user_salary(state["user_id"])
    if salary:
        state["salary"] = salary
    else:
        # If no salary, we will route to a different node that asks the user
        state["salary"] = None
    return state

# --- NEW: A simple node that just asks the user for their salary ---
@traceable
def ask_for_salary_node(state: ConversationState):
    """If salary is unknown, this node provides the response to ask the user."""
    state["response"] = {"message": "To give you personalized financial advice, I need to know your monthly salary. What is it?"}
    return state

# --- NEW: The main advice generation node ---
@traceable
async def advice_generator_node(state: ConversationState) -> AsyncGenerator[ConversationState, None]:
    """Generates financial advice based on salary, expenses, and critique feedback."""
    print("--- ADVICE GENERATOR ---")
    llm = get_llm(3) # Use a powerful model for reasoning
    state["advice_iteration_count"] += 1
    
    prompt = ChatPromptTemplate.from_template(
        """
        You are a pragmatic financial advisor. Your goal is to give actionable advice.
        
        CONTEXT:
        - User's Monthly Salary: {salary}
        - User's recent spending summary: {data}
        - Previous Attempt Feedback (if any): {critique_feedback}
        
        TASK:
        Generate a concise, personalized financial plan. If you received feedback, address it directly and improve your advice.
        1.  Start with a brief summary of their spending.
        2.  Provide 2-3 specific, actionable tips to save money based on their actual spending data.
        3.  Suggest one simple, beginner-friendly investment option.
        
        Your advice should be encouraging, not generic. AVOID phrases like "spend less money".
        """
    )
    chain = prompt | llm
    
    stream = chain.astream({
        "salary": state["salary"],
        "data": json.dumps(state["query_results"]),
        "critique_feedback": state["critique_feedback"] or "None"
    })
    
    full_message = ""
    async for chunk in stream:
        chunk_content = getattr(chunk, "content", "")
        full_message += chunk_content
        yield {"response": {"message": full_message}}

# --- NEW: The critique node to ensure quality ---
@traceable
def critique_node(state: ConversationState):
    """Critiques the generated advice for being too generic."""
    print("--- CRITIQUING ADVICE ---")
    llm = get_llm(3) # A fast model is fine for classification
    
    advice = state["response"]["message"]
    prompt = ChatPromptTemplate.from_template(
        """
        Critique the following financial advice. Is it generic or personalized and actionable?
        - GENERIC advice is vague, like 'spend less' or 'save more'.
        - ACTIONABLE advice is specific, referencing the user's data, like 'Your food spending is high at 3000; try meal prepping to save.'
        
        Respond with a single valid JSON object.
        If the advice is actionable, return: {{"result": "pass"}}
        If it is generic, return: {{"result": "fail", "feedback": "Your reason why it's generic."}}

        ADVICE TO CRITIQUE:
        "{advice}"
        """
    )
    chain = prompt | llm
    response = chain.invoke({"advice": advice})
    content = getattr(response, "content", "{}").strip()

    try:
        critique = json.loads(content)
        if critique.get("result") == "fail":
            state["critique_feedback"] = critique.get("feedback", "The advice was too generic, please try again.")
        else:
            state["critique_feedback"] = "" # Passed
    except json.JSONDecodeError:
        # If JSON fails, assume it passed to avoid getting stuck
        state["critique_feedback"] = ""
        
    return state

@traceable
def add_expense_node(state: ConversationState):
    llm = get_llm(state["model_id"])
    user_input = state["conversation_history"][-1]

    # --- THIS IS THE NEW LOGIC TO ADD ---
    # 1. Safely check if an image_url was passed in from the initial state (from main.py)
    image_url = state.get("current_entities", {}).get("image_url")

    # 2. Extract entities from the text message (your existing logic)
    entities = extract_expense_entities(user_input, llm)

    # 3. If an image_url exists, add it to the entities that will be saved
    if image_url:
        entities["image_url"] = image_url
    # ------------------------------------

    state["current_entities"] = entities
    entities["user_id"] = state["user_id"]

    if not entities.get("amount"):
        state["response"] = {
            "message": "I see you want to add an expense, but I couldn't determine the amount. Could you please clarify?",
            "details": entities
        }
        return state

    tool_result = add_expense_tool(entities) # 'entities' now contains image_url if it existed

    if tool_result.get('status') == 'ok':
        message = f"✅ Logged! Expense of {entities['amount']} for '{entities['description']}' in the {entities['category']} category."
    else:
        message = f"❌ Sorry, I failed to save the expense. Error: {tool_result.get('error')}"

    state["response"] = {"message": message, "details": tool_result}
    return state
@traceable
async def chit_chat_node(state: ConversationState) -> AsyncGenerator[ConversationState, None]:
    """
    Handles general chit-chat by streaming the LLM's response token by token.
    """
    llm = get_llm(state["model_id"])
    user_input = state["conversation_history"][-1]
    # Use the .stream() method to get a token stream from the LLM
    stream = llm.astream(user_input)
    full_message = ""
    # Asynchronously iterate over the stream of tokens
    async for chunk in stream:
        chunk_content = getattr(chunk, "content", "")
        full_message += chunk_content
        # Yield the partial state update with the accumulated message
        yield {"response": {"message": full_message}}

@traceable
def analytics_planner_node(state: ConversationState):
    """Generates a structured plan for how to query the database."""
    llm = get_llm(state["model_id"])
    state["iteration_count"] += 1
    
    if state["iteration_count"] == 1:
        state["user_question"] = state["conversation_history"][-1]

    plan = create_analytics_plan(
        question=state["user_question"],
        history=state["conversation_history"],
        feedback=state["feedback_message"],
        llm=llm
    )
    state["query_plan"] = plan
    return state

@traceable
def query_mongodb_node(state: ConversationState):
    """Executes the query plan against MongoDB."""
    if "error" in state["query_plan"]:
        state["feedback_message"] = f"The query planner failed with: {state['query_plan']['error']}. Retrying."
        state["query_results"] = []
        return state
        
    tool_result = execute_mongo_pipeline(state["query_plan"], user_id=state["user_id"])
    
    if tool_result["status"] == "ok" and not tool_result["results"]:
        state["feedback_message"] = "The query returned no data. The user's request might be for a time period with no expenses or for a non-existent category. Try asking for clarification."
    else:
        state["feedback_message"] = "" 
        
    state["query_results"] = tool_result.get("results", [])
    return state

@traceable
async def summarize_results_node(state: ConversationState)-> AsyncGenerator[ConversationState, None]:
    """Generates a final, user-friendly response based on the query results."""
    llm = get_llm(state["model_id"])
    prompt = ChatPromptTemplate.from_template(
        """You are a helpful financial assistant.
        The user asked: "{question}"
        The database returned the following data: {data}
        
        Please provide a concise, friendly, and clear answer to the user's question based on the data response by streaming the summary of query results.
        """
    )
    chain = prompt | llm
    # Use the .stream() method on the chain to get a token stream
    stream = chain.astream({
        "question": state["user_question"], 
        "data": json.dumps(state["query_results"])
    })
    
    full_message = ""
    # Asynchronously iterate over the stream of tokens
    async for chunk in stream:
        chunk_content = getattr(chunk, "content", "")
        full_message += chunk_content
        # Yield the partial state update with the accumulated message
        yield {"response": {"message": full_message}}

# -------------------- GRAPH --------------------
def should_continue_or_end(state: ConversationState):
    if state["iteration_count"] >= 5:
        state["response"] = {"message": "Sorry, I tried a few times but couldn't figure out how to answer that. Could you rephrase your question?"}
        return "end"
    
    if state["feedback_message"]:
        return "continue"
    
    return "summarize"

graph = StateGraph(ConversationState)

# Add all nodes to the graph instance
graph.add_node("intent_classifier", intent_classifier)
graph.add_node("add_expense", add_expense_node)
graph.add_node("chit_chat", chit_chat_node)
graph.add_node("analytics_planner", analytics_planner_node)
graph.add_node("query_mongodb", query_mongodb_node)
graph.add_node("summarize_results", summarize_results_node)
# New nodes for the advice feature
graph.add_node("update_salary", update_salary_node)
graph.add_node("get_salary", get_salary_node)
graph.add_node("ask_for_salary", ask_for_salary_node)
graph.add_node("advice_generator", advice_generator_node)
graph.add_node("critique_advice", critique_node)

graph.set_entry_point("intent_classifier")

# 1. Main router after intent classification
graph.add_conditional_edges(
    "intent_classifier",
    lambda state: state["last_intent"],
    {
        "add_expense": "add_expense",
        "analytics": "analytics_planner",
        "update_salary": "update_salary",
        "financial_advice": "get_salary",
        "chit_chat": "chit_chat",
    }
)

# 2. Path for checking if salary exists
graph.add_conditional_edges(
    "get_salary",
    lambda state: "salary_known" if state.get("salary") is not None else "salary_unknown",
    {
        "salary_known": "query_mongodb", # Salary found, now get expenses
        "salary_unknown": "ask_for_salary", # No salary, need to ask the user
    }
)

# 3. Path for standard analytics
graph.add_edge("analytics_planner", "query_mongodb")

# 4. Router after fetching data from MongoDB
def after_query_router(state: ConversationState):
    """Routes to the correct next step based on the original intent."""
    if state["last_intent"] == "analytics":
        return "summarize_results"
    elif state["last_intent"] == "financial_advice":
        # We have salary and expense data, time to generate advice
        return "advice_generator"
    return END

graph.add_conditional_edges("query_mongodb", after_query_router)

# 5. The Critique Loop
graph.add_edge("advice_generator", "critique_advice")

def after_critique_router(state: ConversationState):
    """Decides whether to end the loop or regenerate the advice."""
    if state["critique_feedback"] and state["advice_iteration_count"] < 3:
        print(f"--- CRITIQUE FAILED (Attempt {state['advice_iteration_count']}). Regenerating... ---")
        return "regenerate"
    print("--- CRITIQUE PASSED or MAX ATTEMPTS REACHED ---")
    return "end"

graph.add_conditional_edges(
    "critique_advice",
    after_critique_router,
    {
        "regenerate": "advice_generator", # Loop back to improve the advice
        "end": END,
    }
)

# 6. Define all terminal edges
graph.add_edge("add_expense", END)
graph.add_edge("chit_chat", END)
graph.add_edge("update_salary", END)
graph.add_edge("ask_for_salary", END)
graph.add_edge("summarize_results", END)

app = graph.compile()# -------------------- RUN --------------------
# if __name__ == "__main__":
#     print(f"🤖 Expense Chatbot is ready. Development session for user: '{DEV_USER_ID}'")
    
#     # Initialize the state with the hardcoded developer user ID
#     initial_state = {
#         "user_id": DEV_USER_ID, # <--- USE THE HARDCODED ID
#         "conversation_history": [], "current_entities": {}, "last_intent": "", "response": {},
#         "user_question": "", "query_plan": {}, "query_results": [], "feedback_message": "", "iteration_count": 0
#     }
#     state = initial_state.copy()
    
#     while True:
#         try:
#             user_input = input("\n👤: ")
#             if user_input.lower() == "exit":
#                 break

#             state["conversation_history"].append(user_input)
            
#             result = app.invoke(state)
            
#             response_obj = result.get("response", {"message": "No response generated"})
#             print("\n🤖:", response_obj["message"])
            
#             # Persist state for the next turn, keeping the user_id
#             state = {
#                 **result,
#                 "response": {},
#                 "iteration_count": 0,
#                 "feedback_message": "",
#                 "user_question": "",
#             }
#         except KeyboardInterrupt:
#             print("\nExiting.")
#             break
#         except Exception as e:
#             debug_print("An error occurred in the main loop:", str(e))
#             traceback.print_exc()
#             print("\n🤖: Sorry, a critical error occurred. Please restart.")
async def main():
    """The main asynchronous loop for running the chatbot."""
    print(f"🤖 Expense Chatbot is ready. Development session for user: '{DEV_USER_ID}'")
    
    # initial_state = {
    #     "user_id": DEV_USER_ID,
    #     "conversation_history": [], "current_entities": {}, "last_intent": "", "response": {},
    #     "user_question": "", "query_plan": {}, "query_results": [], "feedback_message": "", "iteration_count": 0
    # }
    initial_state = {
    "user_id": DEV_USER_ID, "model_id": 3,
    "conversation_history": [], "current_entities": {}, "last_intent": "", "response": {},
    "user_question": "", "query_plan": {}, "query_results": [], "feedback_message": "",
    "iteration_count": 0, "salary": None, "critique_feedback": "", "advice_iteration_count": 0
}
    state = initial_state.copy()
    
    while True:
        try:
            user_input = input("\n\n👤: ")
            # user_input = await asyncio.to_thread(input, "\n\n👤: ")
            if user_input.lower() == "exit":
                break

            current_input = state.copy()
            current_input["conversation_history"].append(user_input)
            
            print("\n🤖: ", end="", flush=True)
            full_response_message = ""
            
            # This variable will hold the complete, merged state after each step.
            final_state_after_run = current_input.copy()

            # Use app.astream() for asynchronous streaming.
            async for event in app.astream(current_input):
                # Manually merge the event output into our state tracker.
                for node_name, node_output in event.items():
                    # This is the key change to preserve the full state.
                    final_state_after_run.update(node_output) 

                    if "response" in node_output and node_output["response"]:
                        current_message = node_output["response"].get("message", "")
                        # Calculate and print only the new part of the message.
                        new_part = current_message[len(full_response_message):]
                        print(new_part, end="", flush=True)
                        full_response_message = current_message
            
            # Persist the fully accumulated state for the next turn.
            state = {
                **final_state_after_run,
                "response": {},
                "iteration_count": 0,
                "feedback_message": "",
                "user_question": "",
            }

        except KeyboardInterrupt:
            print("\nExiting.")
            break
        except Exception:
            print(f"\n🤖: Sorry, a critical error occurred. Please restart.")
            traceback.print_exc()

if __name__ == "__main__":
    # This part runs the main asynchronous function.
    asyncio.run(main())