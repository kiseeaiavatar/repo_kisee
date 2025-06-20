from user_data import UserData

import json
import logging
from livekit.agents import (
    function_tool,
    RunContext,
    Agent,
    get_job_context,
)

# Type alias for RunContext with UserData
RunContext_T = RunContext[UserData]

# FIXME to ENV var
TOOL_TIMEOUT = 300  # 5 minutes timeout for tool responses

# Create a named logger
logger = logging.getLogger("DynamicAgent")
logger.setLevel(logging.DEBUG)  # Set level for this logger

# Create a handler (e.g., console output)
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)

# Attach the handler to your logger
logger.addHandler(console_handler)


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
    logger.info(message)
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
        logger.error(f"Failed to show notification: {str(e)}")
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
        logger.error(f"Failed to show rating event: {str(e)}")
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
        logger.error(f"Failed to show swipe event: {str(e)}")
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
            logger.error(f"Failed to send stage update: {str(e)}")

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
        logger.debug("__init__")

    async def on_enter(self) -> None:
        """
        Called when entering a new state.

        Updates the agent's instructions based on the current state and
        prepares the chat context for the new state.
        """
        logger.debug("on_enter")
        userdata: UserData = self.session.userdata
        logger.debug("===================== USER_DATA =========================")
        logger.debug(f"Userdata: {userdata}\n\n")
        logger.debug("=========================================================")
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

            logger.debug("===================== TRANSITION =========================")
            logger.debug(f"Userdata: {userdata}")
            logger.debug(f"Agent config: {agent_config}")
            logger.debug(f"Event prompt: {event_prompt}")
            logger.debug(f"End requirement prompt: {end_requirement_prompt}")
            logger.debug(f"Full instructions: {full_instructions}")
            logger.debug("==========================================================")

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

            logger.debug("===================== CHAT CTX =========================")
            logger.debug(f"Chat ctx: {chat_ctx.to_dict()}")
            logger.debug("========================================================")

            await self.update_chat_ctx(chat_ctx)
            self.session.generate_reply(tool_choice="none")
