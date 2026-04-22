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
    dependencies: Optional[List[str]] = []

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


def _normalize_schedule_time(value: Optional[str], default_minutes: int) -> int:
    if not value:
        return default_minutes

    raw = str(value).strip()
    if not raw:
        return default_minutes

    # Try 24-hour format first (HH:MM)
    parsed_24h = _parse_time_to_minutes(raw, -1)
    if parsed_24h >= 0:
        return parsed_24h

    # Fall back to common 12-hour formats (e.g., 9:00 AM, 9:00AM)
    compact = raw.replace(' ', '').upper()
    for fmt in ("%I:%M%p",):
        try:
            dt = datetime.strptime(compact, fmt)
            return dt.hour * 60 + dt.minute
        except ValueError:
            continue

    return default_minutes


def _minutes_to_hhmm(total_minutes: int) -> str:
    safe_minutes = max(0, min((24 * 60) - 1, int(total_minutes)))
    hour = safe_minutes // 60
    minute = safe_minutes % 60
    return f"{hour:02d}:{minute:02d}"


def _normalize_and_sort_schedule(schedule: Optional[List[dict]], work_start: Optional[str]) -> List[dict]:
    if not isinstance(schedule, list):
        return []

    default_start = _parse_time_to_minutes(work_start, 9 * 60)
    normalized_items = []

    for index, item in enumerate(schedule):
        if not isinstance(item, dict):
            continue

        fallback_minutes = default_start + (index * 30)
        start_minutes = _normalize_schedule_time(item.get("suggested_start"), fallback_minutes)
        normalized_item = {**item, "suggested_start": _minutes_to_hhmm(start_minutes)}
        normalized_items.append((start_minutes, index, normalized_item))

    normalized_items.sort(key=lambda entry: (entry[0], entry[1]))
    return [entry[2] for entry in normalized_items]


def _is_completed_status(status: Optional[str]) -> bool:
    normalized = (status or '').strip().lower()
    return normalized in {'done', 'completed', 'complete'}


def _parse_deadline(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None

    raw = str(value).strip()
    if not raw:
        return None

    try:
        # Accept ISO timestamps that may contain trailing Z.
        return datetime.fromisoformat(raw.replace('Z', '+00:00')).replace(tzinfo=None)
    except ValueError:
        pass

    for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%d-%m-%Y"):
        try:
            return datetime.strptime(raw, fmt)
        except ValueError:
            continue

    return None


def _task_importance_score(task: Task, planning_date) -> int:
    priority_weights = {
        'urgent': 400,
        'high': 300,
        'medium': 200,
        'low': 100,
    }
    status_weights = {
        'in-progress': 40,
        'review': 25,
        'todo': 15,
        'pending': 15,
    }
    category_focus_weights = {
        # Work and learning tasks usually require sustained cognitive focus.
        'work': 70,
        'learning': 60,
        # Personal/health/family/shopping tasks can still be important,
        # but are often less deep-focus by default.
        'personal': 10,
        'health': 5,
        'family': 10,
        'shopping': 0,
    }

    priority = (task.priority or 'medium').strip().lower()
    status = (task.status or '').strip().lower()
    category = (task.category or '').strip().lower()
    score = priority_weights.get(priority, 180) + status_weights.get(status, 0)

    # Estimated effort is a proxy for cognitive depth.
    estimated_minutes = task.estimated_minutes if isinstance(task.estimated_minutes, int) else 60
    if estimated_minutes >= 240:
        score += 70
    elif estimated_minutes >= 120:
        score += 45
    elif estimated_minutes >= 60:
        score += 25
    else:
        score += 5

    score += category_focus_weights.get(category, 20)

    # Routine wellness tasks are usually not the single top focus item unless urgent.
    title = (task.title or '').strip().lower()
    routine_keywords = ('gym', 'workout', 'exercise', 'walk', 'jog', 'run', 'stretch')
    if any(keyword in title for keyword in routine_keywords):
        score -= 120

    deadline_dt = _parse_deadline(task.deadline)
    if deadline_dt:
        days_until = (deadline_dt.date() - planning_date).days
        if days_until < 0:
            score += 260
        elif days_until == 0:
            score += 220
        elif days_until == 1:
            score += 170
        elif days_until <= 3:
            score += 110
        elif days_until <= 7:
            score += 60
        else:
            score += 10

    return score


def _select_focus_task(tasks: List[Task], planning_date) -> Optional[Task]:
    if not tasks:
        return None

    return max(tasks, key=lambda task: _task_importance_score(task, planning_date))

@router.post("/plan-day")
async def plan_day(req: PlanDayRequest):
    now = datetime.now()
    now_minutes = now.hour * 60 + now.minute
    work_end_minutes = _parse_time_to_minutes(req.work_end, 18 * 60)
    # Treat the final 4 hours of the workday as "tomorrow" planning time.
    tomorrow_threshold_minutes = max(0, work_end_minutes - (4 * 60))
    after_work_hours = now_minutes >= tomorrow_threshold_minutes

    target_date_obj = (now + timedelta(days=1)).date() if after_work_hours else now.date()
    target_date = target_date_obj.isoformat()
    planning_scope = "tomorrow" if after_work_hours else "today"

    # Include only active tasks and compute deterministic focus task by importance.
    schedulable_tasks = [
        task for task in req.tasks 
        if not _is_completed_status(task.status)
    ]
    focus_task = _select_focus_task(schedulable_tasks, target_date_obj)
    focus_task_id = focus_task.id if focus_task else None
    
    prefs = {"work_start": req.work_start, "work_end": req.work_end}
    prompt = (
        f"Pending tasks:\n{json.dumps([t.dict() for t in schedulable_tasks], indent=2)}\n\n"
        f"User preferences:\n{json.dumps(prefs)}\n\n"
        f"Focus task rule: choose this task id as focus_task because it is the most important by priority/deadline: {focus_task_id}.\n"
        f"Create a {planning_scope} plan for date {target_date}. "
        f"Schedule items must fit within working hours ({req.work_start} to {req.work_end})."
    )
    result = ask_groq(SYSTEM, prompt)

    if isinstance(result, dict):
        if focus_task_id:
            result["focus_task"] = focus_task_id
        result["schedule"] = _normalize_and_sort_schedule(result.get("schedule"), req.work_start)
        result["target_date"] = target_date
        result["planning_scope"] = planning_scope

    return result