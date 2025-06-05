"""
LiveKit Kisee - A conversational agent system for collecting user preferences.

This module implements a dynamic state machine using a single agent that can
handle different conversation states and collect user preferences through
various interaction methods (rating and swipe events).
"""

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
from dataclasses import dataclass, field
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient

from livekit import agents
from livekit.plugins import (
    openai,
    noise_cancellation,
    silero,
    azure,
)
from livekit.plugins.turn_detector.multilingual import MultilingualModel

# Load environment variables
load_dotenv()

# Azure configuration
AZURE_OPENAI_DEPLOYMENT = os.getenv(
    "AZURE_OPENAI_DEPLOYMENT", "gpt-4o-mini-realtime-preview")
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_API_VERSION = os.getenv(
    "AZURE_OPENAI_API_VERSION", "2024-10-01-preview")

# Configuration paths and constants
AGENT_CONFIG_PATH = "./agent_config.json"
TOOL_TIMEOUT = 300  # 5 minutes timeout for tool responses

# MongoDB connection
MONGODB_CONNECTION_STRING = os.getenv(
    "MONGODB_CONNECTION_STRING", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGODB_CONNECTION_STRING)
db = client.voice_assistant


async def load_agent_config_from_db():
    """
    Load agent configuration from MongoDB.
    """
    cursor = db.agents.find().sort("order", 1)
    agents = await cursor.to_list(None)

    return agents


@dataclass
class UserData:
    """
    Stores user preferences and conversation state.

    Attributes:
        preferences: Dictionary storing all user preferences
        current_state: Current state of the conversation
        prev_state: Previous state of the conversation
        agents: List of all agents from database
        state_transitions: Dictionary storing state transitions
    """
    preferences: Dict[str, Any] = field(default_factory=dict)
    prev_state: Optional[str] = None
    agents: list = field(default_factory=list)
    current_state: str = "Begrüßung"
    state_transitions: Dict[str, str] = field(default_factory=dict)

    def __init__(self, agents: list):
        """
        Initialize UserData with agents and set up state transitions.

        Args:
            agents: List of agent configurations from database
        """
        # Initialize all dataclass fields
        self.preferences = {}
        self.prev_state = None
        self.agents = agents
        self.state_transitions = {}

        if agents:
            self.current_state = agents[0]["chapter_id"]
            self.state_transitions = self._create_state_transitions()

    def _create_state_transitions(self) -> Dict[str, str]:
        """Create state transitions based on agent order"""
        transitions = {}
        if not self.agents:
            return transitions

        # Create transitions based on order
        for i in range(len(self.agents) - 1):
            current_state = self.agents[i]["chapter_id"]
            next_state = self.agents[i + 1]["chapter_id"]
            transitions[current_state] = next_state

        # Add transition from last state to final
        if self.agents:
            last_state = self.agents[-1]["chapter_id"]
            transitions[last_state] = "final"

        return transitions

    def summarize(self) -> str:
        """Returns a JSON string of all user preferences."""
        return json.dumps(self.preferences)

    def get_current_agent(self) -> Optional[Dict]:
        """Get the current agent configuration"""
        return next(
            (agent for agent in self.agents if agent["chapter_id"]
             == self.current_state),
            None
        )

    def get_state_transitions(self) -> Dict[str, str]:
        """Get state transitions"""
        return self.state_transitions


# Type alias for RunContext with UserData
RunContext_T = RunContext[UserData]


@function_tool
async def console_logger(
    context: RunContext,
    text: str,
) -> dict:
    """
    Logs a message to the console.

    Args:
        context: The run context
        text: The message to log

    Returns:
        dict: Status and message
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

    Args:
        context: The run context
        text: The notification text

    Returns:
        dict: Status and result of the notification
    """
    try:
        room = get_job_context().room
        participant_identity = next(iter(room.remote_participants))
        result = await room.local_participant.perform_rpc(
            destination_identity=participant_identity,
            method="showNotification",
            payload=text
        )

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
    context: RunContext_T,
    description: str,
    items: list[str],
) -> dict:
    """
    Shows a rating event to the user where they can rate multiple items.

    Args:
        context: The run context with user data
        description: Description of what to rate
        items: List of items to rate

    Returns:
        dict: Status and results of the rating event
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
            }),
            response_timeout=TOOL_TIMEOUT
        )

        if isinstance(result, str):
            try:
                result = json.loads(result)
            except json.JSONDecodeError:
                result = {
                    "error": "Failed to parse result",
                    "raw_result": result
                }

        ratings = result.get("results", [])
        # Store the ratings in the user's preferences
        context.userdata.preferences[f"{context.userdata.current_state}_ratings"] = ratings  # noqa: E501

        response = {
            "status": "success",
            "message": f"Rating event finished for {len(items)} items",
            "results": ratings,
            "raw_result": result
        }
        return response
    except Exception as e:
        print(f"Failed to show rating event: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to show rating event: {str(e)}"
        }


@function_tool
async def show_swipe_event(
    context: RunContext_T,
    description: str,
    items: list[str],
) -> dict:
    """
    Shows a swipe event to the user where they can swipe right(like)
    or left(dislike).

    Args:
        context: The run context with user data
        description: Description of what to swipe
        items: List of items to swipe

    Returns:
        dict: Status and results of the swipe event
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
            }),
            response_timeout=TOOL_TIMEOUT
        )

        if isinstance(result, str):
            try:
                result = json.loads(result)
            except json.JSONDecodeError:
                result = {
                    "error": "Failed to parse result",
                    "raw_result": result
                }

        preferences = result.get("results", [])
        # Store the preferences in the user's preferences
        context.userdata.preferences[f"{context.userdata.current_state}_preferences"] = preferences  # noqa: E501

        response = {
            "status": "success",
            "message": f"Swipe event finished for {len(items)} items",
            "results": preferences,
            "raw_result": result
        }
        return response
    except Exception as e:
        print(f"Failed to show swipe event: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to show swipe event: {str(e)}"
        }


@function_tool
async def update_name(
    name: str,
    context: RunContext_T,
) -> str:
    """
    Updates the user's name in their preferences.

    Args:
        name: The user's name
        context: The run context with user data

    Returns:
        str: Confirmation message
    """
    context.userdata.preferences["name"] = name
    return f"The name is updated to {name}"


@function_tool
async def transfer_to_next_state(
    context: RunContext_T,
) -> tuple[Agent, str]:
    """
    Transfers to the next state based on the current state.

    Args:
        context: The run context with user data

    Returns:
        tuple: The current agent and a transition message
    """
    userdata = context.userdata
    current_state = userdata.current_state

    # Get next state from transitions
    state_transitions = userdata.get_state_transitions()
    next_state = state_transitions.get(current_state, "final")
    userdata.prev_state = current_state
    userdata.current_state = next_state

    # Send stage update to frontend
    room = get_job_context().room
    if room:
        try:
            await room.local_participant.publish_data(
                json.dumps({
                    "type": "stage_update",
                    "stage": next_state
                }).encode()
            )
        except Exception as e:
            print(f"Failed to send stage update: {str(e)}")

    return context.session.current_agent, f"Transferring to {next_state}."


class DynamicAgent(Agent):
    """
    A dynamic agent that handles all conversation states.

    The agent updates its instructions based on the current state and
    manages the transition between states.
    """

    def __init__(self) -> None:
        """Initialize the agent with all available tools."""
        super().__init__(
            instructions="",  # Will be updated based on state
            tools=[
                show_rating_event,
                show_swipe_event,
                update_name,
                transfer_to_next_state,
                console_logger,
                show_notification
            ],
        )

    async def on_enter(self) -> None:
        """
        Called when entering a new state.

        Updates the agent's instructions based on the current state and
        prepares the chat context for the new state.
        """
        userdata: UserData = self.session.userdata
        print(f"Userdata: {userdata}\n\n")
        current_state = userdata.current_state

        # Get current agent configuration
        agent_config = userdata.get_current_agent()

        if agent_config:
            # Create event prompt addition if event configuration exists
            event_prompt = ""
            if "event_type" in agent_config and "event_input" in agent_config:
                event_type = agent_config["event_type"]
                event_input = agent_config["event_input"]

                if event_type == "rating":
                    event_prompt = (
                        "\n\nWICHTIG: Starte sofort mit dem Rating-Event! "
                        f"Führe das show_rating_event Tool aus mit:\n"
                        f"- description: '{event_input['description']}'\n"
                        f"- items: {event_input['items']}\n"
                        "Warte auf die Bewertungen, bevor du weitere Fragen stellst."  # noqa: E501
                        "Wenn du die Bewertungen erhalten hast, frage den User "  # noqa: E501
                        "etwas genauer nach seinen Präferenzen."
                    )
                elif event_type == "swipe":
                    event_prompt = (
                        "\n\nWICHTIG: Starte sofort mit dem Swipe-Event! "
                        f"Führe das show_swipe_event Tool aus mit:\n"
                        f"- description: '{event_input['description']}'\n"
                        f"- items: {event_input['items']}\n"
                        "Warte auf die Präferenzen, bevor du weitere Fragen stellst."  # noqa: E501
                        "Wenn du die Präferenzen erhalten hast, frage den User "  # noqa: E501
                        "etwas genauer nach seinen Präferenzen."
                    )

            # Create end requirement prompt
            end_requirement_prompt = (
                f"\n\nWICHTIG: Sobald {agent_config['end_requirement']}, "
                f"führe das transfer_to_next_state Tool aus."
            )

            # Update instructions based on current state
            full_instructions = (
                agent_config["user_instruction"] +
                event_prompt +
                end_requirement_prompt
            )

            print("------------TRANSITION--------------\n")
            print(f"Agent config: {agent_config}\n")
            print(f"Event prompt: {event_prompt}\n")
            print(f"End requirement prompt: {end_requirement_prompt}\n")
            print(f"Full instructions: {full_instructions}\n")
            print("--------------------------------\n\n")

            await self.update_instructions(full_instructions)

            chat_ctx = self.chat_ctx.copy()

            if userdata.prev_state:
                truncated_chat_ctx = self.chat_ctx.copy(
                    exclude_instructions=True,
                    exclude_function_call=False
                ).truncate(max_items=6)
                existing_ids = {item.id for item in chat_ctx.items}
                items_copy = [
                    item for item in truncated_chat_ctx.items
                    if item.id not in existing_ids
                ]
                chat_ctx.items.extend(items_copy)

            chat_ctx.add_message(
                role="system",
                content=(
                    "Du bist ein Assistent. Deine Aufgabe ist es die Nutzerin "
                    "zu unterstützen. "
                    f"Du bist im {current_state} Zustand. "
                    f"Aktuelle Nutzerdaten sind {userdata.summarize()}\n"
                    "Benutze keine Emojis oder Sonderzeichen. "
                    "Bilde klare kurze Antworten.\n"
                    "Wenn du an einen anderen Zustand übertragen wirst, "
                    "dann sage etwas passendes in die Richtung wie "
                    "'Okay, das ist spannend, "
                    "sollen wir mit dem nächsten Thema weitermachen?' "
                    "(gerne variiere die Antwort)"
                    "Wenn der User nicht zustimmt, dann frage nochmal nach."
                    "Wenn der User zustimmt, führe das "
                    "transfer_to_next_state Tool aus."
                ),
            )

            print("------------CHAT CTX--------------\n")
            print(f"Chat ctx: {chat_ctx.to_dict()}\n")
            print("--------------------------------\n\n")

            await self.update_chat_ctx(chat_ctx)
            self.session.generate_reply(tool_choice="none")


@dataclass
class AzureAgent:
    """Azure Agent for handling voice interactions"""

    def __init__(self):
        self.config = None
        self.current_agent = None
        self.agent_index = 0
        self.initialized = False

    async def initialize(self):
        """Initialize the agent by loading configuration from MongoDB"""
        if not self.initialized:
            self.config = await load_agent_config_from_db()
            if not self.config["agents"]:
                raise ValueError("No agents found in the database")
            self.current_agent = self.config["agents"][0]
            self.initialized = True

    async def get_next_agent(self) -> Optional[Dict]:
        """Get the next agent in the sequence based on order"""
        if not self.initialized:
            await self.initialize()

        if not self.current_agent:
            return None

        current_order = self.current_agent.get("order")
        if current_order is None:
            return None

        # Find the next agent with the next order number
        next_agent = next(
            (agent for agent in self.config["agents"]
             if agent["order"] == current_order + 1),
            None
        )

        if next_agent:
            self.current_agent = next_agent
            return next_agent
        return None

    async def get_current_agent(self) -> Optional[Dict]:
        """Get the current agent configuration"""
        if not self.initialized:
            await self.initialize()
        return self.current_agent

    async def reset(self):
        """Reset the agent to the first configuration"""
        if not self.initialized:
            await self.initialize()
        self.current_agent = self.config["agents"][0]
        self.agent_index = 0


async def entrypoint(ctx: agents.JobContext):
    """
    Entry point for the agent system.

    Sets up the agent session with all necessary components and starts
    the conversation in the greeting state.

    Args:
        ctx: The job context
    """
    # Load agents from database
    agents = await load_agent_config_from_db()

    userdata = UserData(agents=agents)
    agent = DynamicAgent()

    session = AgentSession[UserData](
        userdata=userdata,
        llm=openai.realtime.RealtimeModel.with_azure(
            azure_deployment=AZURE_OPENAI_DEPLOYMENT,
            azure_endpoint=AZURE_OPENAI_ENDPOINT,
            api_key=AZURE_OPENAI_API_KEY,
            api_version=AZURE_OPENAI_API_VERSION,
        ),
        vad=silero.VAD.load(),
        turn_detection=MultilingualModel(),
    )

    await session.start(
        room=ctx.room,
        agent=agent,
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )

    await ctx.connect()


if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))
