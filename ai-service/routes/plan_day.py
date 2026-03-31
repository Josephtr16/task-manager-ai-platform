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

class PlanDayRequest(BaseModel):
    tasks: List[Task]
    work_start: Optional[str] = "09:00"
    work_end: Optional[str] = "18:00"

SYSTEM = """You are a daily planning assistant for a productivity app.
Given a list of pending tasks and the user's working hours, create an optimal schedule.
Return ONLY valid JSON — no explanation, no markdown:
{
  "focus_task": "<id of the single most important task for today>",
  "schedule": [
    {
      "task_id": "<id>",
      "title": "<title>",
      "suggested_start": "<HH:MM>",
      "duration_minutes": <integer>,
      "reason": "<why at this time>"
    }
  ],
  "advice": "<one motivational or practical tip for the day>"
}"""

@router.post("/plan-day")
async def plan_day(req: PlanDayRequest):
    prefs = {"work_start": req.work_start, "work_end": req.work_end}
    prompt = (
        f"Pending tasks:\n{json.dumps([t.dict() for t in req.tasks], indent=2)}\n\n"
        f"User preferences:\n{json.dumps(prefs)}"
    )
    result = ask_groq(SYSTEM, prompt)
    return result