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
Given task productivity stats, generate a smart report.
IMPORTANT FOR DAILY REPORTS: The 'completed' count refers to YESTERDAY's completions, 'due_today' is TODAY's tasks.
Return ONLY valid JSON — no explanation, no markdown:
{
  "summary": "<2-3 sentence overall summary. For daily: praise yesterday's work, then address today's tasks>",
  "completion_rate_label": "<e.g. 'Great day — 67% completion' (refer to yesterday for daily period)>",
  "insights": ["<insight 1>", "<insight 2>", "<insight 3>"],
  "best_day": "<day of week with most completions>",
  "best_period": "<morning | afternoon | evening>",
  "recommendation": "<one actionable improvement tip>"
}"""


def _period_brief(period: str) -> str:
    normalized = (period or '').strip().lower()

    if normalized.startswith('daily'):
        return (
            "Period context: DAILY STANDUP. The 'completed' stat represents yesterday's completed tasks. "
            "In your summary, praise yesterday's accomplishments FIRST, then preview today's tasks. "
            "Use 'yesterday' and 'today' wording. "
            "Do not mention week, weekly, month, or monthly in summary, label, insights, or recommendation."
        )

    if normalized.startswith('weekly'):
        return "Period context: WEEKLY. Use week/weekly wording where relevant."

    if normalized.startswith('monthly'):
        return "Period context: MONTHLY. Use month/monthly wording where relevant."

    return "Period context: CUSTOM. Use neutral wording and avoid assuming week/month unless explicit in the input."

@router.post("/reports")
async def generate_report(req: ReportRequest):
    period_hint = _period_brief(req.period)
    prompt = (
        f"{period_hint}\n"
        "Generate a productivity report from these stats:\n"
        f"{json.dumps(req.dict(), indent=2)}"
    )
    result = ask_groq(SYSTEM, prompt)
    return result