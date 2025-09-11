import os
import io
from imagekitio import ImageKit
from fastapi import HTTPException
from dotenv import load_dotenv
import json
load_dotenv()

# Initialize ImageKit
try:
    imagekit = ImageKit(
        private_key=os.environ['IMAGEKIT_PRIVATE_KEY'],
        public_key=os.environ['IMAGEKIT_PUBLIC_KEY'],
        url_endpoint=os.environ['IMAGEKIT_URL_ENDPOINT']
    )
except KeyError as e:
    raise RuntimeError(f"{e} not found in environment variables. ImageKit credentials are required.")
async def upload_image_to_imagekit(image_bytes: bytes, filename: str, user_id: str) -> str:
    """
    Uploads image bytes to ImageKit using an in-memory file buffer (BytesIO)
    for improved reliability.
    """
    print(f"[DEBUG] Preparing upload of {len(image_bytes)} bytes for user {user_id}, filename {filename}.")

    if not image_bytes:
        raise ValueError("Image bytes are empty, cannot upload.")

    try:
        # --- START: FIX FOR DATA CORRUPTION ---
        # 2. Wrap the bytes in an io.BytesIO object. This presents the data as a file-like object.
        file_buffer = io.BytesIO(image_bytes)
        file_buffer.name = filename  # Set a name attribute, which some libraries read.
        # --- END: FIX FOR DATA CORRUPTION ---

        upload_info = imagekit.upload(
            file=file_buffer,  # Pass the BytesIO buffer instead of raw bytes
            file_name=filename,
            options={
                "folder": f"/expense_receipts/{user_id}/",
                "is_private_file": False,
            }
        )

        print(f"[DEBUG] ImageKit API Response: {json.dumps(upload_info, indent=2)}")

        # --- START: FIX FOR LOGIC ERROR ---
        # 3. Access the URL from the nested "response" dictionary.
        response_data = upload_info.get("response", {})
        url = response_data.get("url")
        # --- END: FIX FOR LOGIC ERROR ---

        if url:
            file_size = response_data.get("size", 0)
            print(f"[DEBUG] Upload successful. File size reported by ImageKit: {file_size} bytes. URL: {url}")
            return url
        else:
            raise Exception(f"ImageKit response missing 'url' key in response object or indicates failure.")

    except Exception as e:
        print(f"Error during ImageKit upload processing: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save image: {e}")