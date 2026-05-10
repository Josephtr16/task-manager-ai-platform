from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
from collections import defaultdict
import traceback
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


def _parse_deadline(deadline: Optional[str]):
    if not deadline:
        return None
    try:
        return datetime.fromisoformat(deadline.replace('Z', '+00:00')).date()
    except Exception:
        return None


def _format_date(d) -> str:
    return d.strftime("%B %d, %Y").replace(" 0", " ")


def _compute_risk_signals(active_tasks: list) -> list:
    today = datetime.now(timezone.utc).date()
    deadline_signals = []
    overload_signals = []
    dependency_signals = []

    # --- Deadline risks (only within 3 days) ---
    for task in active_tasks:
        task_date = _parse_deadline(task.get('deadline'))
        if task_date is None:
            continue
        days_until = (task_date - today).days

        if days_until < 0:
            deadline_signals.append({
                "type": "deadline_risk",
                "severity": "high",
                "task_ids": [task['id']],
                "message": f'"{task["title"]}" was due on {_format_date(task_date)} and is now overdue.'
            })
        elif days_until == 0:
            deadline_signals.append({
                "type": "deadline_risk",
                "severity": "high",
                "task_ids": [task['id']],
                "message": f'"{task["title"]}" is due today ({_format_date(task_date)}).'
            })
        elif days_until == 1:
            deadline_signals.append({
                "type": "deadline_risk",
                "severity": "high",
                "task_ids": [task['id']],
                "message": f'"{task["title"]}" is due tomorrow ({_format_date(task_date)}).'
            })
        elif days_until <= 3:
            deadline_signals.append({
                "type": "deadline_risk",
                "severity": "medium",
                "task_ids": [task['id']],
                "message": f'"{task["title"]}" is due in {days_until} days ({_format_date(task_date)}).'
            })

    # Sort by severity (high first), cap at 3
    deadline_signals.sort(key=lambda s: 0 if s["severity"] == "high" else 1)
    deadline_signals = deadline_signals[:3]

    # --- Overload: group tasks by deadline date ---
    date_groups = defaultdict(list)
    for task in active_tasks:
        task_date = _parse_deadline(task.get('deadline'))
        if task_date is not None:
            date_groups[task_date].append(task)

    for date, grouped_tasks in date_groups.items():
        if len(grouped_tasks) >= 2:
            severity = "high" if len(grouped_tasks) >= 3 else "medium"
            titles = [t['title'] for t in grouped_tasks]
            if len(titles) == 2:
                titles_str = f'"{titles[0]}" and "{titles[1]}"'
            else:
                titles_str = ', '.join(f'"{t}"' for t in titles[:-1]) + f', and "{titles[-1]}"'
            overload_signals.append({
                "type": "overload",
                "severity": severity,
                "task_ids": [t['id'] for t in grouped_tasks],
                "message": f"Multiple tasks are due on {_format_date(date)}: {titles_str}."
            })

    # Sort by severity (high first), cap at 3
    overload_signals.sort(key=lambda s: 0 if s["severity"] == "high" else 1)
    overload_signals = overload_signals[:3]

    # --- Dependency: only flag tasks >= 960 min (16h) with no subtasks, cap at 2 ---
    for task in active_tasks:
        estimated = task.get('estimated_minutes') or 0
        subtasks = task.get('subtasks') or []
        if estimated >= 960 and not subtasks:
            hours = round(estimated / 60)
            dependency_signals.append({
                "type": "dependency",
                "severity": "medium",
                "task_ids": [task['id']],
                "message": f'"{task["title"]}" is estimated at {hours}h with no subtasks — consider breaking it into smaller pieces.'
            })

    dependency_signals = dependency_signals[:2]

    return deadline_signals + overload_signals + dependency_signals


@router.post("/detect-risks")
async def detect_risks(req: DetectRisksRequest):
    try:
        active_tasks = [t.dict() for t in req.tasks if not _is_completed_status(t.status)]

        if not active_tasks:
            return {
                "alerts": [],
                "overall_status": "ok",
                "summary": "No active tasks to analyze for risk.",
            }

        signals = _compute_risk_signals(active_tasks)

        if not signals:
            return {
                "alerts": [],
                "overall_status": "ok",
                "summary": "No significant risks detected in your current workload.",
            }

        alerts = [
            {
                "type": s["type"],
                "severity": s["severity"],
                "message": s["message"],
                "affected_task_ids": s["task_ids"],
            }
            for s in signals
        ]

        high_count = sum(1 for s in signals if s["severity"] == "high")
        overall_status = "critical" if high_count >= 2 else "warning" if signals else "ok"

        overload = [s for s in signals if s["type"] == "overload"]
        deadline = [s for s in signals if s["type"] == "deadline_risk"]
        summary_parts = []
        if deadline:
            summary_parts.append(f"{len(deadline)} task(s) with urgent deadlines")
        if overload:
            summary_parts.append(f"{len(overload)} overloaded day(s)")
        summary = "Workload has " + " and ".join(summary_parts) + "." if summary_parts else "Workload looks manageable."

        return {
            "alerts": alerts,
            "overall_status": overall_status,
            "summary": summary,
        }

    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}