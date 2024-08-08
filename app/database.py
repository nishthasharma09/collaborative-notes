from motor.motor_asyncio import AsyncIOMotorClient
from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    MONGO_URI: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    SECRET_KEY: str
    ALGORITHM: str
    class Config:
        env_file = ".env"
        extra='allow'

settings = Settings()

client = AsyncIOMotorClient(settings.MONGO_URI)
db = client["user_db"]
users_collection = db["users"]
notes_collection = db["notes"]