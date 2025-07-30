from fastapi import APIRouter, HTTPException, Request, status
from typing import List
from models.agent import Agent, ReorderAgentsRequest
from datetime import datetime
from bson import ObjectId

router = APIRouter()


@router.post("/agents", response_model=Agent, response_model_by_alias=False, status_code=status.HTTP_201_CREATED)
async def create_agent(
    agent: Agent,
    request: Request
):
    db = request.app.mongodb_agents
    result = await db.insert_one(agent.dict())
    created_agent = await db.find_one({"_id": ObjectId(result.inserted_id)})
    return Agent(**created_agent)


@router.get("/agents", response_model=List[Agent], response_model_by_alias=False)
async def get_agents(request: Request):
    db = request.app.mongodb_agents
    agents = await db.find().sort("order", 1).to_list(None)
    return [Agent(**agent) for agent in agents]


@router.put("/agents/{id}", response_model=Agent, response_model_by_alias=False)
async def update_agent(
    id: str,
    agent: Agent,
    request: Request
):
    db = request.app.mongodb_agents
    agent.updated_at = datetime.now().isoformat()
    result = await db.update_one(
        {"_id": ObjectId(id)},
        {"$set": agent.dict()}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Agent not found")
    updated_agent = await db.find_one({"_id": ObjectId(id)})
    return Agent(**updated_agent)


@router.delete("/agents/{id}")
async def delete_agent(id: str, request: Request):
    db = request.app.mongodb_agents
    result = await db.delete_one({"_id": ObjectId(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"message": "Agent deleted successfully"}


@router.post("/agents/reorder")
async def reorder_agents(
    request_data: ReorderAgentsRequest,
    request: Request
):
    db = request.app.mongodb_agents
    for index, id in enumerate(request_data.agent_ids):
        await db.update_one(
            {"_id": ObjectId(id)},
            {"$set": {"order": index + 1}}
        )
    return {"message": "Agents reordered successfully"}
