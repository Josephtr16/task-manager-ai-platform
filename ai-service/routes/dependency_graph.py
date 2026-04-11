from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Dict
import json

from services.groq_client import ask_groq

router = APIRouter()


class DependencyTaskInput(BaseModel):
    id: str
    title: str
    description: Optional[str] = ""
    status: Optional[str] = "todo"
    priority: Optional[str] = "medium"
    estimated_minutes: Optional[int] = None
    deadline: Optional[str] = None


class DependencyGraphRequest(BaseModel):
    tasks: List[DependencyTaskInput]


SYSTEM_PROMPT = """You are an expert project manager.
Given a list of tasks, infer realistic prerequisite dependencies.

Rules:
- Return ONLY valid JSON.
- Use task IDs exactly as provided.
- A task can depend on zero or more other tasks.
- Avoid circular dependencies.
- Avoid self-dependencies.
- Keep dependencies minimal and practical.

Output format:
{
  "dependencies": [
    {"task_id": "<id>", "depends_on": ["<id1>", "<id2>"]}
  ]
}
"""


def _depends_on(start_id: str, target_id: str, dep_map: Dict[str, List[str]], visited=None) -> bool:
    if visited is None:
        visited = set()
    if start_id in visited:
        return False

    visited.add(start_id)
    for dep_id in dep_map.get(start_id, []):
        if dep_id == target_id:
            return True
        if _depends_on(dep_id, target_id, dep_map, visited):
            return True
    return False


@router.post("/generate-dependencies")
async def generate_dependencies(req: DependencyGraphRequest):
    tasks = req.tasks or []
    if len(tasks) < 2:
        return {"dependencies": []}

    prompt_payload = [
        {
            "id": task.id,
            "title": task.title,
            "description": task.description or "",
            "status": task.status or "todo",
            "priority": task.priority or "medium",
            "estimated_minutes": task.estimated_minutes,
            "deadline": task.deadline,
        }
        for task in tasks
    ]

    user_prompt = f"Tasks:\n{json.dumps(prompt_payload, ensure_ascii=True)}"
    result = ask_groq(SYSTEM_PROMPT, user_prompt, max_tokens=1600, temperature=0.1)

    raw_dependencies = result.get("dependencies", []) if isinstance(result, dict) else []
    valid_ids = {task.id for task in tasks}

    normalized = {}
    for entry in raw_dependencies if isinstance(raw_dependencies, list) else []:
        if not isinstance(entry, dict):
            continue

        task_id = entry.get("task_id")
        if task_id not in valid_ids:
            continue

        depends_on = entry.get("depends_on", [])
        if not isinstance(depends_on, list):
            depends_on = []

        dedup = []
        seen = set()
        for dep_id in depends_on:
            if dep_id in valid_ids and dep_id != task_id and dep_id not in seen:
                dedup.append(dep_id)
                seen.add(dep_id)

        normalized[task_id] = dedup

    # Remove circular edges defensively even if model produced some.
    acyclic_map = {task.id: [] for task in tasks}
    for task in tasks:
        task_id = task.id
        for dep_id in normalized.get(task_id, []):
            # Adding dep_id as prerequisite of task_id is invalid if dep_id already depends on task_id.
            if _depends_on(dep_id, task_id, acyclic_map):
                continue
            acyclic_map[task_id].append(dep_id)

    dependencies = [
        {"task_id": task_id, "depends_on": dep_ids}
        for task_id, dep_ids in acyclic_map.items()
        if dep_ids
    ]

    return {
        "dependencies": dependencies,
        "suggested_links": sum(len(item["depends_on"]) for item in dependencies),
    }
