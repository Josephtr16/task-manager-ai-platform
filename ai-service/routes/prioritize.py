from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from services.groq_client import ask_groq
from datetime import date
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

class PrioritizeRequest(BaseModel):
    tasks: List[Task]

def compute_task_meta(task: Task) -> dict:
    today = date.today()
    t = task.dict()

    if task.deadline:
        try:
            dl = date.fromisoformat(task.deadline[:10])
            days_remaining = (dl - today).days  # negative = overdue
            estimated_hours = (task.estimated_minutes or 60) / 60
            ratio = round(estimated_hours / max(abs(days_remaining), 1), 2)
            t["days_remaining"] = days_remaining
            t["is_overdue"] = days_remaining < 0
            t["effort_ratio"] = ratio  # pre-computed, model just looks up the bracket
        except ValueError:
            t["days_remaining"] = None
            t["is_overdue"] = False
            t["effort_ratio"] = None
    else:
        t["days_remaining"] = None
        t["is_overdue"] = False
        t["effort_ratio"] = None

    return t

SYSTEM = """You are an expert productivity coach and task prioritization engine.
Today's date is {today}. All tasks include pre-computed fields: days_remaining, is_overdue, and effort_ratio.

Your job is to score each task from 0 to 100 based on genuine prioritization logic.

SCORING COMPONENTS — total is out of 100:

1. URGENCY (0–45 pts) — most important factor.
   How close is the deadline? The closer the deadline, the higher this score.
   Overdue tasks get the maximum. A task due tomorrow is near-maximum.
   A task due in 2 months gets very few points here.

2. TIME PRESSURE (0–35 pts) — second most important factor.
   Use effort_ratio = estimated_hours / days_remaining.
   A high ratio means the task needs a lot of work relative to the time left — it must be started immediately.
   A task with 8h of work and 2 days left (ratio=4.0) should score near maximum here.
   A task with 16h of work and 30 days left (ratio=0.53) should score much lower.
   This is what separates tasks with similar deadlines — always favor the one with more work to do.

3. PRIORITY LABEL (0–15 pts) — minor factor.
   The user's own priority flag (critical/high/medium/low) gives a small boost.
   It should never override the urgency and time pressure signals.

4. CATEGORY (0–5 pts) — least important.
   Work and health tasks get a small edge over leisure tasks.
   This should almost never change a task's ranking on its own. or priority must differ in score — never give the same score to two different tasks

LABELS:
Derive the priority_label from your score naturally:
- Very high scores → critical
- High scores → high  
- Mid scores → medium
- Low scores → low

Return ONLY valid JSON:
{
  "tasks": [
    {
      "id": "<id>",
      "title": "<title>",
      "score": <0-100>,
      "priority_label": "<critical|high|medium|low>",
      "overdue": <true|false>,
      "reason": "<2 sentences max, natural language, explain why this task needs attention now>"
    }
  ],
  "top_task": "<id of highest score task>"
}"""

@router.post("/prioritize")
async def prioritize(req: PrioritizeRequest):
    active_tasks = [
        compute_task_meta(t)
        for t in req.tasks
        if t.status not in ("completed", "done")
    ]

    result = ask_groq(
        SYSTEM,
        f"Prioritize these tasks:\n{json.dumps(active_tasks, indent=2)}",
        max_tokens=3000,
        temperature=0.1
    )
    return result