from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from dotenv import dotenv_values

# --- Configuration ---
# Load variables from .env file into a dictionary
config = dotenv_values(".env")
MONGO_URI = config.get("MONGO_URI")

# !!! IMPORTANT: Change these to your actual database and collection names !!!
DB_NAME = "expense_db"
COLLECTION_NAME = "expenses"
# ---------------------

def view_all_documents():
    """
    Connects to MongoDB and prints all documents from a specified collection.
    """
    if not MONGO_URI:
        print("❌ Error: MONGO_URI not found in .env file.")
        return

    client = None  # Initialize client to None for the finally block
    try:
        # Establish a connection to the MongoDB server
        print("Connecting to MongoDB...")
        client = MongoClient(MONGO_URI)
        
        # The ismaster command is cheap and does not require auth.
        client.admin.command('ismaster')
        print("✅ Connection successful.")

        # Select your database and collection
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]

        # Find all documents in the collection
        documents = list(collection.find({}))
        
        if not documents:
            print(f"\nNo documents found in '{DB_NAME}.{COLLECTION_NAME}'.")
        else:
            print(f"\n--- Found {len(documents)} documents in '{DB_NAME}.{COLLECTION_NAME}' ---")
            # Loop through the cursor and print each document
            for i, doc in enumerate(documents, 1):
                print(f"[{i}] {doc}")
            print("----------------------------------------------------")

    except ConnectionFailure as e:
        print(f"❌ Connection Failed: Could not connect to MongoDB. Details: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
    finally:
        # Ensure the connection is closed
        if client:
            client.close()
            print("\nConnection closed.")

if __name__ == "__main__":
    view_all_documents()