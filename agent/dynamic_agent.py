from user_data import UserData

import os
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

# TODO to ENV var
TOOL_TIMEOUT = 900  # 15 minutes timeout for tool responses

# Create a named logger
logger = logging.getLogger("DynamicAgent")
logger.setLevel(logging.DEBUG)  # Set level for this logger

# Create a handler (e.g., console output)
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)

# Attach the handler to your logger
logger.addHandler(console_handler)

logging.getLogger("pymongo").setLevel(logging.INFO)

@function_tool
async def transfer_to_next_agent(
    context: RunContext_T,
) -> tuple[Agent, str]:
    """
    Transfers to the next agent once the end requirement is reached.
    """
    userdata = context.userdata
    current_agent = context.session.current_agent
    current_agent_idx = userdata.current_agent_idx
    next_agent_idx = current_agent_idx + 1
    print(f"next id {next_agent_idx}, len {len(userdata.dynamic_agents)}")
    if next_agent_idx >= len(userdata.dynamic_agents):
        await context.session.generate_reply(tool_choice="none", instructions="Informiere den Nutzer, dass wir am Ende der Beratung angelangt sind")
        return "Wir sind fertig für heute"

    next_agent = userdata.dynamic_agents[next_agent_idx]
    userdata.prev_agent = current_agent
    userdata.current_agent_idx = next_agent_idx

    # return next_agent, f"Transferring to agent {next_agent_idx}"
    return next_agent

COMMON_INSTRUCTIONS_DEFAULT = (
    "Du bist ein digitaler Berufsberater (Avatar) und führst Sprachinteraktionen mit Nutzer:innen durch, die sich beruflich orientieren möchten. "
    "Deine Aufgabe ist es, sie freundlich, empathisch und klar bei ihrer Berufsfindung zu unterstützen. "
    "\n\n"
    "Hilf den Nutzer:innen dabei, ihre Interessen, Stärken und realistische Berufs- oder Ausbildungswege zu erkennen. "
    "Unterstütze sie bei der Entscheidungsfindung – ob Studium, Ausbildung oder beruflicher Einstieg – und fördere ihre Motivation, "
    "selbst aktiv zu werden. Gib gezielte Informationen zu Berufsbildern, Voraussetzungen und Möglichkeiten, wenn es passt. "
    "\n\n"
    "Die Zielgruppe umfasst: "
    "Schüler:innen ab Klasse 8, die Orientierung suchen. "
    "Studierende, die über einen Fachwechsel oder Abbruch nachdenken. "
    "Menschen, die eine Ausbildung beginnen möchten. "
    "Berufseinsteiger:innen oder Wiedereinsteiger:innen nach z. B. Krankheit oder Elternzeit. "
    "Personen in beruflicher Neuorientierung. "
    "Menschen mit Migrationshintergrund, die in den Arbeitsmarkt einsteigen möchten. "
    "\n\n"
    "Sprich in einem freundlichen, unterstützenden und respektvollen Ton. "
    "Sei empathisch – höre zu, frage nach, reagiere sensibel auf Unsicherheiten. "
    "Passe deine Sprache dem Alter und Bildungsniveau der Person an. "
    "Bleibe neutral – bewerte keine Entscheidungen und dränge niemanden in eine Richtung. "
    "Motiviere – zeige Chancen auf, betone Stärken und ermutige zur Selbstreflexion. "
    "Sprich klar und verständlich – vermeide Fachbegriffe oder erkläre sie bei Bedarf. "
    "Führe ein echtes Gespräch – stelle offene Fragen, höre aktiv zu und reagiere individuell. "
    "\n\n"
    "Wenn du den Nutzer zu einem anderen Agent weiterleitest sei still und sage **NICHT** 'Ich leite dich nun weiter'."
)

COMMON_INSTRUCTIONS = os.getenv(
    "COMMON_INSTRUCTIONS", COMMON_INSTRUCTIONS_DEFAULT)

class DynamicAgent(Agent):
    config: dict

    def __init__(self, config: dict) -> None:
        """Initialize the agent with all available tools."""
        instructions = (
            COMMON_INSTRUCTIONS
            + "\n\n"
            + ( config["agent_instructions"] or "" )
        )

        if config["end_requirement"] and config["end_requirement"] != "SOFORT":
            instructions += (
                "\n\n Sobald "
                + config["end_requirement"]
                + " führe das transfer_to_next_agent Tool aus ohne es dem Nutzer mitzuteilen."
            )

        super().__init__(
            instructions=instructions,
            tools=[
                transfer_to_next_agent,
            ],
        )
        self.config =config
        # logger.debug("__init__")

    async def on_enter(self) -> None:
        # agent_name = self.__class__.__name__
        # logger.info(f"entering task {agent_name}")
        chapter_id = self.config["chapter_id"]
        print(f"entering new agent {chapter_id}")

        userdata: UserData = self.session.userdata

        chat_ctx = self.chat_ctx.copy()
        print(f"current_agent_idx: {userdata.current_agent_idx}")

        # add the previous agent's chat history to the current agent
        # if isinstance(userdata.prev_agent, Agent):
        #     print("add previous chat history")
        #     print(f"prev chat ctx: {userdata.prev_agent.chat_ctx.to_dict()}")
        #     truncated_chat_ctx = userdata.prev_agent.chat_ctx.copy(
        #         exclude_instructions=True, # discard system/developer messages
        #         exclude_function_call=False,
        #     ).truncate(max_items=6)
        #     existing_ids = {item.id for item in chat_ctx.items}
        #     items_copy = [item for item in truncated_chat_ctx.items if item.id not in existing_ids]
        #     chat_ctx.items.extend(items_copy)
        #     print("chat ctx copied")

        # add the user data as assistant message
        print(f"userdata: {userdata.summarize()}")
        chat_ctx.add_message(
            role="system",  # role=system works for OpenAI's LLM and Realtime API
            content=(
                    f"Aktuelle Nutzerdaten sind {userdata.summarize()}\n"
            ),
        )
        print(f"chat ctx: {chat_ctx.to_dict()}")
        await self.update_chat_ctx(chat_ctx)
        print("chat ctx updated")

        await send_chapter(chapter_id)

        user_instruction=self.config["user_instruction"]
        if self.config["user_instruction_type"] == "dm":
            print("say first message literally")
            await self.session.say(user_instruction)
        else:
            if user_instruction:
                instructions = self.config["user_instruction"]
                print(f"generate first message: {instructions}")
                await self.session.generate_reply(instructions=instructions)
            else:
                print(f"generate first message without additional instructions")
                await self.session.generate_reply()

        print("msg generated")
        await self.show_event(self.config)
        print("event shown")

        if self.config["end_requirement"] == "SOFORT":
            print("goto next agent immediately")
            self.session.update_agent(userdata.dynamic_agents[userdata.current_agent_idx + 1])
            userdata.current_agent_idx += 1

    async def show_event(self, agent_config: Agent) -> None:
        if "event_type" in agent_config:
            event_type = agent_config["event_type"]
            event_result = ""
            try:
                if event_type == "lifeline":
                    event_result = await show_lifeline_event(agent_config, self.session.userdata.to_dict())
                    await self.session.generate_reply(
                        user_input=f"lifeline results: {event_result}",
                        instructions= ("Ignoriere die Ereignisse bei 0 und 100."
                                       "Befrage den User etwas genauer zu den Eingaben."
                                       "Jede Eingabe enthält ein Alter (item) und die "
                                       "subjektiv empfundene Stärke eines Lebensereignisses."
                                       "Runde das Alter immer ab."
                                       )
                    )
                    print(f"lifeline result {event_result}")
                elif event_type == "rating":
                    event_result = await show_rating_event(agent_config, self.session.userdata.to_dict())
                    await self.session.generate_reply(
                        user_input=f"rating results: {event_result}",
                        instructions= ("Ignoriere Ergebnisse mit Wert 0."
                                       "Wähle die drei am höchsten bewerteten Elemente aus."
                                       "Befrage den Nutzer etwas genauer zu diesen Elementen"
                                       )
                    )
                    print(f"rating event result {event_result}")
                elif event_type == "swipe":
                    event_result = await show_swipe_event(agent_config, self.session.userdata.to_dict())
                    await self.session.generate_reply(
                        user_input=f"swipe results: {event_result}",
                        instructions= ("Ignoriere Ergebnisse mit Wert 0."
                                       "Wähle die drei am höchsten bewerteten Elemente aus."
                                       "Befrage den Nutzer etwas genauer zu diesen Elementen"
                                       )
                    )
                    print(f"swipe event result {event_result}")
                elif event_type == "evaluation":
                    event_result = await show_evaluation_event(agent_config, self.session.userdata.to_dict())
                    print(f"evaluation event result {event_result}")
                else:
                    return

                self.session.userdata.preferences[f"preferences_{self.session.userdata.current_agent_idx}_{event_type}"] = event_result

            except json.JSONDecodeError as e:
                logger.error(f"Failed to show {event_type} event due to RPC issue: {str(e)}")
            except Exception as e:
                logger.error(f"Failed to show {event_type} event: {str(e)}")

async def show_rating_event(
    agent_config: dict,
    userdata: dict,
) -> dict:
    logger.debug("show_rating_event")
    chapter_id = agent_config["chapter_id"]

    if "event_input" not in agent_config:
        logger.error("event_input missing in agent_config")
        return

    event_input = agent_config["event_input"]
    payload={
        "type": "rating",
        "description": event_input["description"],
        "items": event_input["items"],
        "chapter_id": chapter_id,
        "userdata": userdata
    }
    result = await perform_rpc_with_payload(payload)
    return result

async def show_swipe_event(
    agent_config: dict,
    userdata: dict,
) -> dict:
    logger.debug("show_swipe_event")
    chapter_id = agent_config["chapter_id"]

    if "event_input" not in agent_config:
        logger.error("event_input missing in agent_config")
        return

    event_input = agent_config["event_input"]
    payload={
        "type": "swipe",
        "description": event_input["description"],
        "items": event_input["items"],
        "chapter_id": chapter_id,
        "userdata": userdata
    }
    result = await perform_rpc_with_payload(payload)
    return result

async def show_lifeline_event(
    agent_config: dict,
    userdata: dict,
) -> dict:
    logger.debug("show_lifeline_event")
    chapter_id = agent_config["chapter_id"]
    payload={
        "type": "lifeline",
        "chapter_id": chapter_id,
        "userdata": userdata
    }
    result = await perform_rpc_with_payload(payload)
    return result

async def show_evaluation_event(
    agent_config: dict,
    userdata: dict,
) -> dict:
    logger.debug("show_evaluation_event")
    chapter_id = agent_config["chapter_id"]
    payload={
        "type": "evaluation",
        "chapter_id": chapter_id,
        "userdata": userdata
    }
    result = await perform_rpc_with_payload(payload)
    return result

async def perform_rpc_with_payload(payload: dict):
    room = get_job_context().room
    participant_identity = next(iter(room.remote_participants))

    result = await room.local_participant.perform_rpc(
        destination_identity=participant_identity,
        method="showNotification",
        payload=json.dumps(payload),
        response_timeout=TOOL_TIMEOUT
    )

    # ensure it's a not empty string
    if isinstance(result, str) and result:
        try:
            result = json.loads(result)
            return result.get("results", [])
        except Exception as e:
            logger.error(f"Failed to parse event result: {str(e)}")
            return []

    return []

async def send_chapter(chapter_id: str):
    logger.debug(f"send_chapter: {chapter_id}")
    payload={
        "type": "chapter",
        "chapter_id": chapter_id,
    }
    try:
        await perform_rpc_with_payload(payload)
    except Exception as e:
        logger.error(f"Failed to send chapter: {str(e)}")
