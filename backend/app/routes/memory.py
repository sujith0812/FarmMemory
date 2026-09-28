from fastapi import APIRouter
from pydantic import BaseModel

from app.hindsight_client import client, BANK_ID


router = APIRouter(prefix="/api/memory", tags=["Memory"])


class RememberRequest(BaseModel):
    content: str


class RecallRequest(BaseModel):
    query: str


@router.post("/remember")
def remember(request: RememberRequest):
    client.retain(
        bank_id=BANK_ID,
        content=request.content,
    )

    return {
        "success": True,
        "message": "Farm memory stored successfully."
    }


@router.post("/recall")
def recall(request: RecallRequest):
    result = client.recall(
        bank_id=BANK_ID,
        query=request.query,
    )

    memories = []

    for memory in result.results:
        memories.append({
            "type": memory.type,
            "text": memory.text,
        })

    return {
        "success": True,
        "memories": memories,
    }