import json
from dataclasses import dataclass, field
from typing import Optional, Dict, Any
from livekit.agents import Agent

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
    dynamic_agents: list[Agent] = field(default_factory=list)
    prev_agent: Optional[Agent] = None
    current_agent_idx: int = 0
    age: int = 25

    current_state: str = "Begrüßung"
    state_transitions: Dict[str, str] = field(default_factory=dict)

    def __init__(self, agents: list, dynamic_agents: list):
        """
        Initialize UserData with agents and set up state transitions.

        Args:
            agents: List of agent configurations from database
        """
        # Initialize all dataclass fields
        self.preferences = {}
        self.prev_state = None
        self.agents = agents
        self.dynamic_agents = dynamic_agents
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

    def to_dict(self) -> dict:
        """Returns a dictionary of the user data"""
        return {
            # "agents": self.agents,
            "preferences": self.preferences,
        }

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
