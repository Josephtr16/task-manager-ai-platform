from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from services.groq_client import ask_groq

router = APIRouter()

class Task(BaseModel):
    id: str
    title: str
    priority: Optional[str] = "medium"
    status: Optional[str] = "pending"
    deadline: Optional[str] = None
    estimated_minutes: Optional[int] = 60
    category: Optional[str] = ""

class PrioritizeRequest(BaseModel):
    tasks: List[Task]

SYSTEM = """You are a task prioritization engine for a productivity app.
Analyze each task's deadline, importance, complexity and dependencies.
Return ONLY valid JSON — no explanation, no markdown:
{
  "tasks": [
    {"id": "<id>", "title": "<title>", "score": <0-100>, "reason": "<one short sentence>"}
  ],
  "top_task": "<id of highest priority task>"
}"""

@router.post("/prioritize")
async def prioritize(req: PrioritizeRequest):
    import json
    result = ask_groq(SYSTEM, f"Prioritize these tasks:\n{json.dumps([t.dict() for t in req.tasks], indent=2)}")
    return result