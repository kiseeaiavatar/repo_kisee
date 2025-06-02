from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class EventType(str, Enum):
    SWIPE = "swipe"
    RATING = "rating"


class EventInput(BaseModel):
    description: str
    items: List[str]


class Agent(BaseModel):
    chapter_id: str
    user_instruction: str
    end_requirement: str
    order: int
    event_type: Optional[EventType] = None
    event_input: Optional[EventInput] = None
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class ReorderAgentsRequest(BaseModel):
    agent_ids: List[str]
