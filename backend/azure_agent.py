from livekit.agents import (
    function_tool,
    RunContext,
    Agent,
    AgentSession,
    RoomInputOptions,
    get_job_context,
)
from dotenv import load_dotenv
import os
import json

from livekit import agents
from livekit.plugins import (
    openai,
    noise_cancellation,
    silero,
    azure,
)
from livekit.plugins.turn_detector.multilingual import MultilingualModel

load_dotenv()

AZURE_API_KEY = os.getenv("AZURE_API_KEY")
AZURE_OPENAI_REGION = os.getenv("AZURE_OPENAI_REGION")
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_DEPLOYMENT_NAME = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
AZURE_STT_API_KEY = os.getenv("AZURE_STT_API_KEY")
AZURE_STT_REGION = os.getenv("AZURE_STT_REGION")
AZURE_TTS_API_KEY = os.getenv("AZURE_TTS_API_KEY")
AZURE_TTS_REGION = os.getenv("AZURE_TTS_REGION")
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION")
AZURE_OPENAI_TTS_API_KEY = os.getenv("AZURE_OPENAI_TTS_API_KEY")
AZURE_OPENAI_TTS_MODEL = os.getenv("AZURE_OPENAI_TTS_MODEL")
AZURE_OPENAI_STT_API_KEY = os.getenv("AZURE_OPENAI_STT_API_KEY")
AZURE_OPENAI_STT_MODEL = os.getenv("AZURE_OPENAI_STT_MODEL")


@function_tool
async def console_logger(
    context: RunContext,
    text: str,
) -> dict:
    """
    Logs a message to the console.
    """
    message = f"The bot logged: {text}."
    print(message)
    return {"status": "success", "message": message}


@function_tool
async def show_notification(
    context: RunContext,
    text: str,
) -> dict:
    """
    Shows a notification to the user via a Material UI Snackbar.
    """
    try:
        room = get_job_context().room
        participant_identity = next(iter(room.remote_participants))
        result = await room.local_participant.perform_rpc(
            destination_identity=participant_identity,
            method="showNotification",
            payload=text
        )

        # Handle the response
        if isinstance(result, str):
            try:
                result = json.loads(result)
            except json.JSONDecodeError:
                result = {"message": result}

        return {
            "status": "success",
            "message": f"Notification shown: {text}",
            "result": result
        }
    except Exception as e:
        print(f"Failed to show notification: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to show notification: {str(e)}"
        }


@function_tool
async def show_rating_event(
    context: RunContext,
    description: str,
    items: list[str],
) -> dict:
    """
    Shows a rating event to the user where they can rate
    multiple items on a scale of 1-10.
    The user will be presented with each item one
    at a time and can rate them.
    Returns a list of ratings for each item.
    """
    try:
        room = get_job_context().room
        participant_identity = next(iter(room.remote_participants))
        result = await room.local_participant.perform_rpc(
            destination_identity=participant_identity,
            method="showNotification",
            payload=json.dumps({
                "type": "rating",
                "description": description,
                "items": items
            })
        )

        print("Rating event raw result:", result)
        print("Rating event result type:", type(result))

        # Handle the response
        if isinstance(result, str):
            try:
                result = json.loads(result)
            except json.JSONDecodeError:
                print(f"Failed to parse JSON result: {result}")
                result = {"error": "Failed to parse result",
                          "raw_result": result}

        # Extract just the ratings from the result
        ratings = result.get("results", [])
        response = {
            "status": "success",
            "message": f"Rating event finished for {len(items)} items",
            "results": ratings,
            "raw_result": result  # Include raw result for debugging
        }
        print("Rating event processed response:", response)

        return response
    except Exception as e:
        print(f"Failed to show rating event: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to show rating event: {str(e)}"
        }


@function_tool
async def show_swipe_event(
    context: RunContext,
    description: str,
    items: list[str],
) -> dict:
    """
    Shows a swipe event to the user where they can swipe right
    (like) or left (dislike) for multiple items. The user will
    be presented with each item one at a time and can swipe to
    indicate their preference.
    Returns a list of swipe preferences for each item.
    """
    try:
        room = get_job_context().room
        participant_identity = next(iter(room.remote_participants))
        result = await room.local_participant.perform_rpc(
            destination_identity=participant_identity,
            method="showNotification",
            payload=json.dumps({
                "type": "swipe",
                "description": description,
                "items": items
            })
        )

        print("Swipe event raw result:", result)
        print("Swipe event result type:", type(result))

        # Handle the response
        if isinstance(result, str):
            try:
                result = json.loads(result)
            except json.JSONDecodeError:
                print(f"Failed to parse JSON result: {result}")
                result = {"error": "Failed to parse result",
                          "raw_result": result}

        # Extract just the swipe preferences from the result
        preferences = result.get("results", [])
        response = {
            "status": "success",
            "message": f"Swipe event finished for {len(items)} items",
            "results": preferences,
            "raw_result": result  # Include raw result for debugging
        }
        print("Swipe event processed response:", response)

        return response
    except Exception as e:
        print(f"Failed to show swipe event: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to show swipe event: {str(e)}"
        }

INSTUCTIONS = """
Du bist ein hilfreicher Voice AI Assistent. 
Wenn die Nutzer dich bitten, etwas zu protokollieren, verwende das console_logger Tool.
Wenn die Nutzer dich bitten, eine Benachrichtigung anzuzeigen, verwende das show_notification Tool.
Wenn die Nutzer dich bitten, Aktivitäten zu bewerten, verwende das show_rating_event Tool.
Wenn die Nutzer dich bitten, Aktivitäten durch Swipes zu bewerten, verwende das show_swipe_event Tool.
Bitte verwende keine Emojis und schreibe nur Dinge, die ausgesprochen werden können.
""".strip()  # noqa: E501


class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions=INSTUCTIONS,
            tools=[console_logger, show_notification,
                   show_rating_event, show_swipe_event]
        )


async def entrypoint(ctx: agents.JobContext):
    session = AgentSession(
        stt=azure.STT(
            speech_key=AZURE_STT_API_KEY,
            speech_region=AZURE_STT_REGION,
            language="de-DE"
        ),
        tts=azure.TTS(
            speech_key=AZURE_TTS_API_KEY,
            speech_region=AZURE_TTS_REGION,
            voice="de-DE-KatjaNeural",  # Example voice, change as needed
        ),

        # stt=openai.STT.with_azure(
        #     api_key=AZURE_OPENAI_STT_API_KEY,
        #     model=AZURE_OPENAI_STT_MODEL,
        #     api_version=AZURE_OPENAI_API_VERSION,  # or OPENAI_API_VERSION
        #     azure_endpoint=AZURE_OPENAI_ENDPOINT,
        # ),
        # tts=openai.TTS.with_azure(
        #     api_key=AZURE_OPENAI_TTS_API_KEY,
        #     model=AZURE_OPENAI_TTS_MODEL,
        #     api_version=AZURE_OPENAI_API_VERSION,  # or OPENAI_API_VERSION
        #     azure_endpoint=AZURE_OPENAI_ENDPOINT,
        #     voice="alloy",
        # ),
        llm=openai.LLM.with_azure(
            azure_deployment=AZURE_OPENAI_DEPLOYMENT_NAME,
            azure_endpoint=AZURE_OPENAI_ENDPOINT,
            api_key=AZURE_API_KEY,  # or AZURE_OPENAI_API_KEY
            api_version=AZURE_OPENAI_API_VERSION,  # or OPENAI_API_VERSION
        ),
        vad=silero.VAD.load(),
        turn_detection=MultilingualModel(),
    )

    await session.start(
        room=ctx.room,
        agent=Assistant(),
        room_input_options=RoomInputOptions(
            # LiveKit Cloud enhanced noise cancellation
            # - If self-hosting, omit this parameter
            # - For telephony applications, use `BVCTelephony` for best results
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )

    await ctx.connect()

    await session.generate_reply(
        instructions="Greet the user and offer your assistance."
    )


if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))
