import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    DB_HOST = os.getenv("DB_HOST")
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_NAME = os.getenv("DB_NAME")

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")


    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER")
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH"))

    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    
    GOOGLE_CLIENT_ID = os.getenv("OAUTH_CLIENT_ID")
    
   