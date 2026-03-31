from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from services.groq_client import ask_groq

router = APIRouter()


class AssistWriteRequest(BaseModel):
    title: Optional[str] = ""
    description: Optional[str] = ""
    category: Optional[str] = "Work"


ALLOWED_CATEGORIES = {"Work", "Personal", "Health", "Shopping", "Learning", "Family"}

SYSTEM = """You are a task writing assistant for a productivity app.
Given the task context, generate helpful content to fill the task form.
Return ONLY valid JSON - no explanation, no markdown:
{
  "suggested_title": "<clear and concise task title>",
  "suggested_category": "<Work | Personal | Health | Shopping | Learning | Family>",
  "description": "<clear 1-2 sentence description of what needs to be done>",
  "subtasks": ["<subtask 1>", "<subtask 2>", "<subtask 3>"],
  "estimated_complexity": "<low | medium | high>",
  "suggested_tags": ["<tag1>", "<tag2>"],
  "estimated_duration": {
    "minutes": <int>,
    "label": "<e.g. ~2 hours>",
    "reason": "<one sentence explaining the estimate>"
  }
}"""


@router.post("/assist-write")
async def assist_write(req: AssistWriteRequest):
    prompt = (
        f'Task title: "{(req.title or "").strip()}"\n'
        f'Description: "{(req.description or "").strip()}"\n'
        f'Current category: {req.category or "Work"}'
    )

    result = ask_groq(SYSTEM, prompt)

    suggested_title = str(result.get("suggested_title") or req.title or "").strip()
    suggested_category = str(result.get("suggested_category") or req.category or "Work").strip()
    if suggested_category not in ALLOWED_CATEGORIES:
        suggested_category = req.category if req.category in ALLOWED_CATEGORIES else "Work"

    description = str(result.get("description") or req.description or "").strip()

    raw_tags = result.get("suggested_tags") or result.get("tags") or []
    if isinstance(raw_tags, str):
        raw_tags = [part.strip() for part in raw_tags.split(",") if part.strip()]
    suggested_tags = [str(tag).strip() for tag in raw_tags if str(tag).strip()]

    raw_subtasks = result.get("subtasks") or []
    subtasks = []
    if isinstance(raw_subtasks, list):
        for item in raw_subtasks:
            if isinstance(item, str) and item.strip():
                subtasks.append(item.strip())
            elif isinstance(item, dict):
                title = str(item.get("title") or item.get("description") or "").strip()
                if title:
                    subtasks.append(title)

    estimated_duration = result.get("estimated_duration") or {}
    minutes = estimated_duration.get("minutes") if isinstance(estimated_duration, dict) else None
    try:
        minutes = int(minutes)
    except (TypeError, ValueError):
        minutes = 60

    sanitized = {
        "suggested_title": suggested_title,
        "suggested_category": suggested_category,
        "description": description,
        "subtasks": subtasks,
        "estimated_complexity": str(result.get("estimated_complexity") or "medium").lower(),
        "suggested_tags": suggested_tags,
        "estimated_duration": {
            "minutes": max(15, minutes),
            "label": (estimated_duration.get("label") if isinstance(estimated_duration, dict) else None) or f"~{max(15, minutes)} minutes",
            "reason": (estimated_duration.get("reason") if isinstance(estimated_duration, dict) else None) or "Estimated from scope and complexity.",
        },
    }

    return sanitized