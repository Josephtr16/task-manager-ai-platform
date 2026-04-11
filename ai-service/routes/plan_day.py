from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from services.groq_client import ask_groq
import json
from datetime import datetime, timedelta

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


def _parse_time_to_minutes(value: Optional[str], default_minutes: int) -> int:
    try:
        if not value or ':' not in value:
            return default_minutes
        hour_str, minute_str = value.split(':', 1)
        hour = int(hour_str)
        minute = int(minute_str)
        if hour < 0 or hour > 23 or minute < 0 or minute > 59:
            return default_minutes
        return hour * 60 + minute
    except (ValueError, TypeError):
        return default_minutes

@router.post("/plan-day")
async def plan_day(req: PlanDayRequest):
    now = datetime.now()
    now_minutes = now.hour * 60 + now.minute
    work_end_minutes = _parse_time_to_minutes(req.work_end, 18 * 60)
    after_work_hours = now_minutes >= work_end_minutes

    target_date_obj = (now + timedelta(days=1)).date() if after_work_hours else now.date()
    target_date = target_date_obj.isoformat()
    planning_scope = "tomorrow" if after_work_hours else "today"

    prefs = {"work_start": req.work_start, "work_end": req.work_end}
    prompt = (
        f"Pending tasks:\n{json.dumps([t.dict() for t in req.tasks], indent=2)}\n\n"
        f"User preferences:\n{json.dumps(prefs)}\n\n"
        f"Create a {planning_scope} plan for date {target_date}. "
        f"Schedule items must fit within working hours ({req.work_start} to {req.work_end})."
    )
    result = ask_groq(SYSTEM, prompt)

    if isinstance(result, dict):
        result["target_date"] = target_date
        result["planning_scope"] = planning_scope

    return result