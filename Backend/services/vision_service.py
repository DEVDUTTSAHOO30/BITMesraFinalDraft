import os
import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import UploadFile, HTTPException

# Load environment variables (e.g., GOOGLE_API_KEY) from a .env file
load_dotenv()

# Configure the Gemini API key
try:
    genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
except KeyError:
    raise RuntimeError("GOOGLE_API_KEY not found in environment variables.")

# Initialize the Gemini Pro Vision model
# This is the incorrect line
vision_model = genai.GenerativeModel('gemini-1.5-flash')

async def get_summary_from_image(file: UploadFile):
    """
    Sends an image file to Gemini Pro Vision and returns a text summary.

    Args:
        file: The image file uploaded by the user.

    Returns:
        A string containing the extracted summary of the expense.
    """
    # Ensure the file pointer is at the beginning
    await file.seek(0)
    
    # Read the image content as bytes
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")

    # Prepare the image parts for the model
    image_parts = [
        {
            "mime_type": file.content_type,
            "data": image_bytes
        }
    ]

    # The prompt to guide the model
    prompt = """
    Analyze the following receipt image and extract the key financial data. 
    Provide a one-sentence summary in the format: 
    'Spent [Amount] on [Category/Items] at [Merchant] on [Date].'
    If you cannot find a piece of information, omit it.
    Example: 'Spent $45.50 on groceries at Star Market on May 26, 2024.'
    """

    try:
        # Generate content using the model
        response = await vision_model.generate_content_async([prompt, *image_parts])
        return response.text.strip()
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze image with AI model.")