from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from services.groq_client import ask_groq
import json

router = APIRouter()

class TaskInput(BaseModel):
    title: str
    description: Optional[str] = ""
    priority: Optional[str] = "medium"
    category: Optional[str] = "Work"

class HistoryItem(BaseModel):
    title: str
    actual_minutes: int
    category: Optional[str] = "Work"

class PredictTimeRequest(BaseModel):
    task: TaskInput
    history: Optional[List[HistoryItem]] = []
    accuracy_summary: Optional[dict] = {}

SYSTEM = """You are a time estimation engine for a productivity app.
Analyze the task details and the user's history of completed tasks to estimate duration.
The accuracy_summary shows how this user typically estimates. If overrun_ratio > 1.2, the user consistently underestimates, adjust predictions upward accordingly.
Return ONLY valid JSON — no explanation, no markdown:
{
  "estimated_minutes": <integer>,
  "estimated_label": "<e.g. '~30 min' or '~2 hours'>",
  "confidence": "<low | medium | high>",
  "reason": "<one sentence explaining the estimate>"
}"""

@router.post("/predict-time")
async def predict_time(req: PredictTimeRequest):
    prompt_parts = [
        f"New task:\n{json.dumps(req.task.dict(), indent=2)}",
        f"User's recent completed tasks (for reference):\n{json.dumps([h.dict() for h in req.history[-10:]], indent=2)}",
    ]

    if req.accuracy_summary:
        prompt_parts.append(
            f"User accuracy summary:\n{json.dumps(req.accuracy_summary, indent=2)}"
        )

    prompt = (
        "\n\n".join(prompt_parts)
    )
    result = ask_groq(SYSTEM, prompt)
    return result