from dynamic_agent import DynamicAgent
from user_data import UserData

from dotenv import load_dotenv
import os
from motor.motor_asyncio import AsyncIOMotorClient
import logging
import json

from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions, RoomOutputOptions
from livekit.plugins import (
    openai,
    noise_cancellation,
    silero,
)
from livekit.plugins.turn_detector.multilingual import MultilingualModel

load_dotenv()

# Create a named logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)  # Set level for this logger

# Azure configuration
AZURE_OPENAI_DEPLOYMENT = os.getenv(
    "AZURE_OPENAI_DEPLOYMENT", "gpt-4o-mini-realtime-preview")
AZURE_OPENAI_API_VERSION = os.getenv(
    "OPENAI_API_VERSION", "2024-10-01-preview")
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")

PYTHON_ENV = os.getenv("PYTHON_ENV", "development") # or staging/production
if (PYTHON_ENV not in ["local", "development", "staging", "production"]):
    logger.info(f"Unknown PYTHON_ENV: {PYTHON_ENV}. Using 'development'")
    PYTHON_ENV = "development"

LIVEKIT_URL = os.getenv(
    "LIVEKIT_URL", "not set")
LIVEKIT_API_KEY = os.getenv(
    "LIVEKIT_API_KEY", "not set")

# MongoDB connection
MONGODB_CONNECTION_STRING = os.getenv(
    "MONGODB_CONNECTION_STRING", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGODB_CONNECTION_STRING)
db = client["voice_assistant_" + PYTHON_ENV]

# Create a handler (e.g., console output)
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)

# Attach the handler to your logger
logger.addHandler(console_handler)


async def load_agent_config_from_db():
    """
    Load agent configuration from MongoDB.
    """
    cursor = db.agents.find().sort("order", 1)
    agents = await cursor.to_list(None)
    logger.debug("===================== AGENTS =========================")
    logger.debug(f"agents from db: {agents}")
    logger.debug("======================================================")

    return agents

async def entrypoint(ctx: agents.JobContext):
    """
    Entry point for the agent system.

    Sets up the agent session with all necessary components and starts
    the conversation in the greeting state.

    Args:
        ctx: The job context
    """

    metadata = json.loads(ctx.job.metadata)
    variant = metadata["variant"]
    isAvatar = variant == "avatar"

    # Load agents from database
    agents = await load_agent_config_from_db()

    userdata = UserData(agents=agents)
    agent = DynamicAgent()
    # session = AgentSession(
    session = AgentSession[UserData](
        userdata=userdata,
        llm=openai.realtime.RealtimeModel.with_azure(
            azure_deployment=AZURE_OPENAI_DEPLOYMENT,
            api_version=AZURE_OPENAI_API_VERSION
        ),
        vad=silero.VAD.load(),
        turn_detection=MultilingualModel(),
    )

    logger.debug("===================== CTX =========================")
    logger.debug(f"context: {ctx}")
    logger.debug("===================================================")

    await session.start(
        room=ctx.room,
        agent=DynamicAgent(),
        room_input_options=RoomInputOptions(
            # LiveKit Cloud enhanced noise cancellation
            # - If self-hosting, omit this parameter
            # - For telephony applications, use `BVCTelephony` for best results
            noise_cancellation=noise_cancellation.BVC(),
        ),
        room_output_options=RoomOutputOptions(
            audio_enabled=isAvatar # disable audio output if chat variant
        )
    )

    await ctx.connect()

    # await session.generate_reply(
    #     instructions="Greet the user and offer your assistance."
    # )


if __name__ == "__main__":
    # Log (not sensitive) environment variables
    logger.info("===================== ENV =========================")
    logger.info(f"PYTHON_ENV: {PYTHON_ENV}")
    logger.info(f"OPENAI_DEPLOYMENT: {AZURE_OPENAI_DEPLOYMENT}")
    logger.info(f"OPENAI_ENDPOINT: {AZURE_OPENAI_ENDPOINT}")
    logger.info(f"OPENAI_API_VERSION: {AZURE_OPENAI_API_VERSION}")
    logger.info(f"LIVEKIT_URL: {LIVEKIT_URL}")
    logger.info(f"LIVEKIT_API_KEY: {LIVEKIT_API_KEY}")
    logger.info("===================================================")

    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint, agent_name=(f"kisee-agent-{PYTHON_ENV}")))
