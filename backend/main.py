from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from routes import admin
import os
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

app = FastAPI()
logger = logging.getLogger('uvicorn.error')

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(" ")
logger.info(f"ALLOWED_ORIGINS: {allowed_origins}")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


python_env = os.getenv("PYTHON_ENV", "development") # or staging/production
logger.info(f"PYTHON_ENV: {python_env}")

if (python_env not in ["local", "development", "staging", "production"]):
    logger.info(f"Unknown PYTHON_ENV: {python_env}. Using 'development'")
    python_env = "development"


# MongoDB connection
@app.on_event("startup")
async def startup_db_client():
    mongodb_connection_string = os.getenv(
        "MONGODB_CONNECTION_STRING", "mongodb://localhost:27017")
    app.mongodb = AsyncIOMotorClient(mongodb_connection_string)
    app.mongodb_db = app.mongodb["voice_assistant_" + python_env]
    app.mongodb_agents = app.mongodb_db.agents

    # Create index on order field
    await app.mongodb_agents.create_index("order")


@app.on_event("shutdown")
async def shutdown_db_client():
    app.mongodb.close()

# Include routers
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
