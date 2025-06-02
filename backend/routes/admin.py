from fastapi import APIRouter, HTTPException, Request
from typing import List
from models.agent import Agent, ReorderAgentsRequest
from datetime import datetime

router = APIRouter()


@router.post("/agents", response_model=Agent)
async def create_agent(
    agent: Agent,
    request: Request
):
    db = request.app.mongodb_agents
    result = await db.insert_one(agent.dict())
    created_agent = await db.find_one({"_id": result.inserted_id})
    return Agent(**created_agent)


@router.get("/agents", response_model=List[Agent])
async def get_agents(request: Request):
    db = request.app.mongodb_agents
    agents = await db.find().sort("order", 1).to_list(None)
    return [Agent(**agent) for agent in agents]


@router.put("/agents/{chapter_id}", response_model=Agent)
async def update_agent(
    chapter_id: str,
    agent: Agent,
    request: Request
):
    db = request.app.mongodb_agents
    agent.updated_at = datetime.now().isoformat()
    result = await db.update_one(
        {"chapter_id": chapter_id},
        {"$set": agent.dict()}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Agent not found")
    updated_agent = await db.find_one({"chapter_id": chapter_id})
    return Agent(**updated_agent)


@router.delete("/agents/{chapter_id}")
async def delete_agent(chapter_id: str, request: Request):
    db = request.app.mongodb_agents
    result = await db.delete_one({"chapter_id": chapter_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"message": "Agent deleted successfully"}


@router.post("/agents/reorder")
async def reorder_agents(
    request_data: ReorderAgentsRequest,
    request: Request
):
    db = request.app.mongodb_agents
    for index, chapter_id in enumerate(request_data.agent_ids):
        await db.update_one(
            {"chapter_id": chapter_id},
            {"$set": {"order": index + 1}}
        )
    return {"message": "Agents reordered successfully"}
