from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Optional
from services.groq_client import ask_groq
import json

router = APIRouter()

class ReportRequest(BaseModel):
    period: str
    total_tasks: int
    completed: int
    overdue: int
    average_completion_minutes: int
    tasks_by_day: Optional[Dict[str, int]] = {}
    tasks_by_period: Optional[Dict[str, int]] = {}

SYSTEM = """You are a productivity analyst for a task management app.
Given weekly stats about a user's completed tasks, generate a smart report.
Return ONLY valid JSON — no explanation, no markdown:
{
  "summary": "<2-3 sentence overall summary>",
  "completion_rate_label": "<e.g. 'Great week — 85% completion'>",
  "insights": ["<insight 1>", "<insight 2>", "<insight 3>"],
  "best_day": "<day of week with most completions>",
  "best_period": "<morning | afternoon | evening>",
  "recommendation": "<one actionable improvement tip>"
}"""

@router.post("/reports")
async def generate_report(req: ReportRequest):
    result = ask_groq(SYSTEM, f"Generate a productivity report from these weekly stats:\n{json.dumps(req.dict(), indent=2)}")
    return result