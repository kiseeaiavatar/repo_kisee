from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from pydantic.functional_validators import BeforeValidator

from typing_extensions import Annotated

# Represents an ObjectId field in the database.
# It will be represented as a `str` on the model so that it can be serialized to JSON.
PyObjectId = Annotated[str, BeforeValidator(str)]


class EventType(str, Enum):
    SWIPE = "swipe"
    RATING = "rating"
    LIFELINE= "lifeline"


class EventInput(BaseModel):
    description: str
    items: List[str]


class Agent(BaseModel):
    # The primary key for the StudentModel, stored as a `str` on the instance.
    # This will be aliased to `_id` when sent to MongoDB,
    # but provided as `id` in the API requests and responses.
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    chapter_id: str
    user_instruction: str
    end_requirement: Optional[str] = None
    order: int
    event_type: Optional[EventType] = None
    event_input: Optional[EventInput] = None
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())

class ReorderAgentsRequest(BaseModel):
    agent_ids: List[str]
