from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from services.groq_client import ask_groq
import json

router = APIRouter()

class Task(BaseModel):
    id: str
    title: str
    priority: Optional[str] = "medium"
    status: Optional[str] = "pending"
    deadline: Optional[str] = None
    estimated_minutes: Optional[int] = 60
    category: Optional[str] = ""

class DetectRisksRequest(BaseModel):
    tasks: List[Task]


def _is_completed_status(status: Optional[str]) -> bool:
    normalized = (status or '').strip().lower()
    return normalized in {'done', 'completed', 'complete'}

SYSTEM = """You are a workload risk analyzer for a productivity app.
Scan the list of tasks and identify problems the user might not notice.
Ignore completed tasks (status done/completed/complete) and assess risks only for active tasks.
Return ONLY valid JSON — no explanation, no markdown:
{
  "alerts": [
    {
      "type": "<overload | conflict | dependency | deadline_risk>",
      "severity": "<low | medium | high>",
      "message": "<clear description of the problem>",
      "affected_task_ids": ["<id1>", "<id2>"]
    }
  ],
  "overall_status": "<ok | warning | critical>",
  "summary": "<one sentence overview of the workload health>"
}"""

@router.post("/detect-risks")
async def detect_risks(req: DetectRisksRequest):
    active_tasks = [t.dict() for t in req.tasks if not _is_completed_status(t.status)]

    if not active_tasks:
        return {
            "alerts": [],
            "overall_status": "ok",
            "summary": "No active tasks to analyze for risk.",
        }

    result = ask_groq(SYSTEM, f"Analyze these tasks for risks:\n{json.dumps(active_tasks, indent=2)}")
    return result