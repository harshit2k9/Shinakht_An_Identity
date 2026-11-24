import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

PROJECT_ID = os.getenv("PROJECT_ID", "dementia-care-companion")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")