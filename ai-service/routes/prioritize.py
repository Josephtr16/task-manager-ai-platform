from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from services.groq_client import ask_groq
from datetime import date
import random
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

def normalize_category(category: Optional[str]) -> str:
    return (category or "").strip().lower()

def calculate_deadline_pressure(days_remaining: Optional[int]) -> int:
    if days_remaining is None:
        return 0
    if days_remaining < 0:
        return 100
    if days_remaining == 0:
        return 98

    return max(10, int(round(97 - (days_remaining * 3))))

def calculate_effort_bonus(effort_ratio: Optional[float]) -> int:
    if effort_ratio is None:
        return 0
    if effort_ratio >= 4:
        return 6
    if effort_ratio >= 2:
        return 5
    if effort_ratio >= 1:
        return 4
    if effort_ratio >= 0.5:
        return 3
    return 2

def calculate_priority_bonus(priority: Optional[str]) -> int:
    lookup = {
        "urgent": 4,
        "high": 3,
        "medium": 2,
        "low": 1,
    }
    return lookup.get((priority or "medium").strip().lower(), 2)

def calculate_category_bonus(category: Optional[str]) -> int:
    normalized = normalize_category(category)
    if normalized in {"work", "health"}:
        return 2
    if normalized in {"personal", "family", "learning", "education"}:
        return 1
    return 0

def calculate_task_score(task_meta: dict) -> int:
    deadline_pressure = int(task_meta.get("deadline_pressure") or 0)
    effort_bonus = calculate_effort_bonus(task_meta.get("effort_ratio"))
    priority_bonus = calculate_priority_bonus(task_meta.get("priority"))
    category_bonus = calculate_category_bonus(task_meta.get("category"))

    score = deadline_pressure + effort_bonus + priority_bonus + category_bonus
    return min(100, score)

def derive_priority_label(score: int) -> str:
    if score >= 85:
        return "critical"
    if score >= 70:
        return "high"
    if score >= 45:
        return "medium"
    return "low"

def build_reason(task_meta: dict, score: int) -> str:
    days_remaining = task_meta.get("days_remaining")
    effort_ratio = task_meta.get("effort_ratio")

    if days_remaining is None:
        return "No deadline is set, so the score is driven mainly by task priority and effort."
    if days_remaining < 0:
        return "This task is overdue and needs immediate attention."
    if days_remaining == 0:
        return "This task is due today, so it should be handled immediately."

    if effort_ratio is not None and effort_ratio >= 2:
        return f"The deadline is close and the workload is heavy for the time left, so it needs attention now."
    if score >= 80:
        return f"The deadline is approaching soon, so this task should stay near the top of the list."
    if days_remaining <= 7:
        return f"This task is due within a week, so it should be planned ahead of later work."

    return f"This task is still several days away, so it ranks below tighter deadlines."

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
            t["deadline_pressure"] = calculate_deadline_pressure(days_remaining)
        except ValueError:
            t["days_remaining"] = None
            t["is_overdue"] = False
            t["effort_ratio"] = None
            t["deadline_pressure"] = None
    else:
        t["days_remaining"] = None
        t["is_overdue"] = False
        t["effort_ratio"] = None
        t["deadline_pressure"] = 0

    return t

SYSTEM = """You are an expert productivity coach and task prioritization engine.
Today's date is {today}. All tasks include pre-computed fields: days_remaining, is_overdue, effort_ratio, and deadline_pressure.

Your job is to score each task from 0 to 100 based on genuine prioritization logic.

IMPORTANT: deadline_pressure must be the primary driver of the score. Use it as the backbone of the ranking and only let effort_ratio and priority label make smaller adjustments.

SCORING COMPONENTS — total is out of 100:

1. DEADLINE URGENCY (0–60 pts) — dominant factor.
    deadline_pressure is the strongest signal and should drive the ordering.
    Overdue tasks get the maximum. Tasks due today or tomorrow should almost always outrank later tasks.
    Tasks due in 2 months get very few points here.
    If two tasks are only 1 day apart, their urgency scores should usually be close unless one is overdue or dramatically more complex.

2. TIME PRESSURE (0–25 pts) — second most important factor.
   Use effort_ratio = estimated_hours / days_remaining.
    A high ratio means the task needs a lot of work relative to the time left — it must be started immediately.
    A task with 8h of work and 2 days left (ratio=4.0) should score near maximum here.
    A task with 16h of work and 30 days left (ratio=0.53) should score much lower.
    This should amplify deadline urgency, not replace it.
    Effort can break ties, but it should not create a huge score gap between tasks with almost the same deadline.

3. PRIORITY LABEL (0–10 pts) — minor factor.
    The user's own priority flag (critical/high/medium/low) gives only a small boost.
    It must never outrank a tighter deadline.
    A high priority label cannot justify a lower-deadline task outranking a closer-deadline task.

4. CATEGORY (0–5 pts) — least important.
   Work and health tasks get a small edge over leisure tasks.
    This should almost never change a task's ranking on its own.

STRICT DEADLINE RULES:
- Earlier deadlines should rank above later deadlines by default.
- If two tasks have similar effort, the earlier deadline must win.
- Overdue tasks must be clearly separated from future-dated tasks.
- Never give the same score to two different tasks.
- Use deadline_pressure as the primary signal when tasks are close in priority.
- For tasks with deadlines one day apart, avoid score gaps larger than about 10 points unless one task is overdue or has much higher effort_ratio.
- For tasks with deadlines two days apart, avoid score gaps larger than about 15 points unless the effort difference is large.
- If two tasks have the same deadline, score the one with the larger effort_ratio higher, but keep the gap reasonable.
- Do not let the task title or wording overpower the deadline signal.

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

REASON_STYLES = [
        "direct and concise",
        "slightly warm and coaching-oriented",
        "practical and no-nonsense",
        "brief and analytical",
        "encouraging but specific",
]

def get_tie_break_order_with_llm(tasks_with_same_score: List[dict]) -> List[str]:
    if len(tasks_with_same_score) <= 1:
        return [str(task["id"]) for task in tasks_with_same_score]

    tie_payload = [
        {
            "id": str(task["id"]),
            "title": task.get("title"),
            "priority": task.get("priority"),
            "days_remaining": task.get("days_remaining"),
            "effort_ratio": task.get("effort_ratio"),
            "deadline_pressure": task.get("deadline_pressure"),
            "estimated_minutes": task.get("estimated_minutes"),
            "category": task.get("category"),
        }
        for task in tasks_with_same_score
    ]

    try:
        result = ask_groq(
            "You are a strict priority tie-breaker. You are given tasks that currently share the same numeric score. "
            "Return a ranking from most important to least important using deadline proximity first, then effort_ratio, then user priority, then category. "
            "Return only JSON like {\"ordered_ids\": [\"id1\", \"id2\"]}.",
            f"Rank these tied tasks from highest importance to lowest:\n{json.dumps(tie_payload, indent=2)}",
            max_tokens=500,
            temperature=0.1,
        )

        ordered_ids = [str(item) for item in (result.get("ordered_ids") or [])]
        valid_ids = {str(task["id"]) for task in tasks_with_same_score}
        ordered_ids = [task_id for task_id in ordered_ids if task_id in valid_ids]

        # Ensure all IDs are present exactly once.
        missing_ids = [task_id for task_id in valid_ids if task_id not in ordered_ids]
        return ordered_ids + missing_ids
    except Exception:
        # Fallback: deterministic local tie-breaker if LLM tie-break fails.
        ordered = sorted(
            tasks_with_same_score,
            key=lambda task: (
                task.get("days_remaining") if task.get("days_remaining") is not None else float("inf"),
                -(task.get("effort_ratio") or 0),
                -calculate_priority_bonus(task.get("priority")),
            )
        )
        return [str(task["id"]) for task in ordered]

def enforce_unique_scores(prioritized_tasks: List[dict]) -> List[dict]:
    # 1) Get LLM tie-break ordering for each base-score group.
    groups = {}
    for task in prioritized_tasks:
        groups.setdefault(task["score"], []).append(task)

    tie_rank = {}
    for score_value, group in groups.items():
        if len(group) == 1:
            tie_rank[str(group[0]["id"])] = 0
            continue

        ordered_ids = get_tie_break_order_with_llm(group)
        for rank, task_id in enumerate(ordered_ids):
            tie_rank[str(task_id)] = rank

        # Assign fallback rank for any missed item.
        for task in group:
            task_id = str(task["id"])
            if task_id not in tie_rank:
                tie_rank[task_id] = len(group)

    # 2) Sort by base score + tie rank.
    ordered_tasks = sorted(
        prioritized_tasks,
        key=lambda task: (
            -task["score"],
            tie_rank.get(str(task["id"]), 0),
            task.get("days_remaining") if task.get("days_remaining") is not None else float("inf"),
        )
    )

    # 3) Force globally unique integer scores while keeping order stable.
    used_scores = set()
    for task in ordered_tasks:
        candidate = int(task["score"])
        while candidate in used_scores and candidate > 0:
            candidate -= 1
        if candidate in used_scores:
            candidate = 0

        task["score"] = candidate
        task["priority_label"] = derive_priority_label(candidate)
        used_scores.add(candidate)

    return ordered_tasks

@router.post("/prioritize")
async def prioritize(req: PrioritizeRequest):
    active_tasks = [
        compute_task_meta(t)
        for t in req.tasks
        if t.status not in ("completed", "done")
    ]

    prioritized_tasks = []
    for task in active_tasks:
        score = calculate_task_score(task)
        prioritized_tasks.append({
            **task,
            "score": score,
            "priority_label": derive_priority_label(score),
            "overdue": bool(task.get("is_overdue")),
            "reason": build_reason(task, score),
        })

    prioritized_tasks = enforce_unique_scores(prioritized_tasks)

    if prioritized_tasks:
        try:
            style = random.choice(REASON_STYLES)
            reason_prompt_tasks = [
                {
                    "id": task["id"],
                    "title": task["title"],
                    "score": task["score"],
                    "priority_label": task["priority_label"],
                    "days_remaining": task.get("days_remaining"),
                    "effort_ratio": task.get("effort_ratio"),
                    "deadline_pressure": task.get("deadline_pressure"),
                    "current_reason": task["reason"],
                }
                for task in prioritized_tasks
            ]

            reason_result = ask_groq(
                f"You write short, varied task-priority explanations in a {style} style.\n"
                f"Do not reuse the same opening phrase across tasks.\n"
                f"Each reason must be 1 sentence, natural, and not sound templated.\n"
                f"Return only valid JSON of the form {{\"reasons\": [{{\"id\": \"<id>\", \"reason\": \"<text>\"}}]}}.",
                f"Generate fresh reasons for these prioritized tasks:\n{json.dumps(reason_prompt_tasks, indent=2)}",
                max_tokens=2000,
                temperature=0.9,
            )

            reason_map = {
                str(item.get("id")): item.get("reason")
                for item in (reason_result.get("reasons") if isinstance(reason_result, dict) else []) or []
                if item.get("id") is not None and item.get("reason")
            }

            for task in prioritized_tasks:
                task_id = str(task["id"])
                task["reason"] = reason_map.get(task_id, task["reason"])
        except Exception as exc:
            # Keep deterministic fallback reasons instead of failing the endpoint.
            print(f"[prioritize] reason generation fallback: {exc}")

    return {
        "tasks": prioritized_tasks,
        "top_task": prioritized_tasks[0]["id"] if prioritized_tasks else None,
    }