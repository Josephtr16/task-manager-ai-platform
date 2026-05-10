from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from services.groq_client import ask_groq
from datetime import date, timedelta

router = APIRouter()


class ProjectBreakdownRequest(BaseModel):
    name: str
    description: str
    project_type: Optional[str] = "general"
    team: Optional[str] = "solo"
    scope: Optional[str] = "auto"
    task_count: Optional[int] = 12
    project_deadline: Optional[str] = None


class SubtasksRequest(BaseModel):
    project_context: str
    task_title: str
    task_description: Optional[str] = ""
    category: Optional[str] = ""
    phase: Optional[str] = "development"
    estimated_minutes: Optional[int] = 480


class ProjectEnhanceRequest(BaseModel):
    name: str
    description: Optional[str] = ""


# ---------------------------------------------------------------------------
# Scope & task count
# ---------------------------------------------------------------------------

SCOPE_TASK_RANGES = {
    "school":       (6,  12),
    "basic":        (10, 16),
    "professional": (16, 26),
    "advanced":     (24, 40),
}

SCOPE_HOUR_RANGES = {
    "school":       "50–120h total",
    "basic":        "100–250h total",
    "professional": "300–600h total",
    "advanced":     "700h+ total",
}


def _calculate_task_count(scope: str, requested: int) -> int:
    min_tasks, max_tasks = SCOPE_TASK_RANGES.get(scope, (10, 18))
    if requested == 12:
        return (min_tasks + max_tasks) // 2
    return max(min_tasks, min(requested, max_tasks))


def _simple_classify(name: str, description: str, scope_hint: str) -> tuple[str, str]:
    """
    Fast keyword-based classification — no extra Groq call needed.
    Used during testing to avoid rate limits.
    """
    text = (name + " " + description).lower()

    # Domain detection
    software_kw = {"app", "api", "software", "website", "backend", "frontend",
                   "database", "saas", "platform", "mobile", "web", "code",
                   "deploy", "server", "cloud", "microservice", "flutter", "react"}
    research_kw = {"research", "study", "survey", "thesis", "analysis", "experiment",
                   "publication", "data collection", "hypothesis", "academic"}
    business_kw = {"startup", "business", "revenue", "market", "sales", "pitch",
                   "product launch", "partnership", "b2b", "b2c", "monetize"}
    community_kw = {"community", "outreach", "ngo", "awareness", "volunteer",
                    "campaign", "environment", "social", "nonprofit"}
    event_kw = {"event", "conference", "festival", "wedding", "concert",
                "hackathon", "ceremony", "exhibition"}
    creative_kw = {"film", "music", "design", "brand", "content", "photography",
                   "animation", "video", "podcast", "writing"}
    education_kw = {"curriculum", "course", "lesson", "training", "e-learning",
                    "bootcamp", "teach", "education", "tutoring"}

    def score(keywords):
        return sum(1 for kw in keywords if kw in text)

    scores = {
        "software":  score(software_kw),
        "research":  score(research_kw),
        "business":  score(business_kw),
        "community": score(community_kw),
        "event":     score(event_kw),
        "creative":  score(creative_kw),
        "education": score(education_kw),
    }
    domain = max(scores, key=scores.get)
    if scores[domain] == 0:
        domain = "general"

    # Scope detection
    if scope_hint != "auto":
        resolved_scope = scope_hint
    else:
        school_kw = {"student", "thesis", "homework", "assignment", "class project", "academic"}
        advanced_kw = {"enterprise", "large-scale", "government", "multi-team", "international"}
        professional_kw = {"client", "startup", "production", "commercial", "company"}

        if score(school_kw) > 0:
            resolved_scope = "school"
        elif score(advanced_kw) > 0:
            resolved_scope = "advanced"
        elif score(professional_kw) > 0:
            resolved_scope = "professional"
        else:
            resolved_scope = "basic"

    return domain, resolved_scope


# ---------------------------------------------------------------------------
# Deadline redistribution
# ---------------------------------------------------------------------------

def _validate_and_fix_deadlines(tasks: list, today: str, deadline: str) -> list:
    today_dt = date.fromisoformat(today)
    deadline_dt = date.fromisoformat(deadline)
    total_days = max((deadline_dt - today_dt).days, 1)

    phase_order = ["planning", "design", "development", "testing", "deployment"]
    phase_windows = {
        "planning":    (0.00, 0.10),
        "design":      (0.10, 0.25),
        "development": (0.25, 0.75),
        "testing":     (0.75, 0.90),
        "deployment":  (0.90, 1.00),
    }

    by_phase = {p: [] for p in phase_order}
    for task in tasks:
        phase = task.get("phase", "development")
        if phase not in by_phase:
            phase = "development"
        by_phase[phase].append(task)

    result = []
    for phase in phase_order:
        phase_tasks = by_phase[phase]
        if not phase_tasks:
            continue

        start_pct, end_pct = phase_windows[phase]
        phase_start = today_dt + timedelta(days=int(total_days * start_pct))
        phase_end = today_dt + timedelta(days=max(int(total_days * end_pct), 1))
        phase_days = max((phase_end - phase_start).days, len(phase_tasks))

        for i, task in enumerate(phase_tasks):
            offset = (
                phase_days // 2
                if len(phase_tasks) == 1
                else int(i * phase_days / (len(phase_tasks) - 1))
            )
            task_date = min(phase_start + timedelta(days=offset), deadline_dt)
            task["deadline"] = task_date.isoformat()
            result.append(task)

    return result


# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------

BREAKDOWN_SYSTEM = """You are a senior project manager with 15 years of experience spanning ALL domains: software, research, community programs, business, education, health, creative production, construction, events, and more.

Your job is to break down ANY type of project into specific, actionable tasks with realistic time estimates and well-distributed deadlines.

═══════════════════════════════════════
TASK APPROPRIATENESS
═══════════════════════════════════════
You will be told the detected domain. Generate tasks natural to that domain:

  software     → UI components, API endpoints, database design, auth, testing, deployment, docs
  research     → literature review, data collection, survey design, analysis, writing, peer review
  community    → stakeholder mapping, outreach, educational materials, event coordination, impact measurement
  business     → market research, business model, financial planning, pitch deck, partnerships, go-to-market
  education    → curriculum design, lesson planning, content creation, assessment design, pilot testing
  health       → needs assessment, protocol design, patient materials, staff training, compliance
  creative     → concept development, scripting, production planning, asset creation, editing, distribution
  construction → site assessment, architectural planning, permitting, procurement, construction phases, inspection
  event        → venue research, logistics, vendor coordination, promotion, registration, on-day coordination, post-event review
  general      → break into logical phases appropriate to what the project actually is

NEVER mix domains. Never add personal tasks unrelated to the project.

═══════════════════════════════════════
REALISTIC TIME ESTIMATION
═══════════════════════════════════════
Estimates must vary realistically per task. Never use flat identical hours.

  software:     240–480 min simple tasks | 600–1500 min complex features | 1200–2400 min integrations
  research:     300–600 min design tasks | 600–1800 min collection/analysis | 600–1200 min writing
  community:    480–900 min planning | 480–1200 min outreach | 600–1800 min events
  business:     300–600 min documents | 480–1200 min research/strategy | 600–1500 min partnerships
  education:    300–600 min lesson plans | 480–1200 min content | 600–1200 min curriculum design
  health:       480–960 min assessments | 600–1200 min protocols | 300–600 min materials
  creative:     300–600 min concept | 480–1200 min scripting | 900–2400 min production | 600–1800 min editing
  construction: 480–960 min assessment | 1200–3000 min design | 480–1200 min permitting | 1200–4800 min construction phases
  event:        300–600 min research | 480–900 min logistics | 480–1200 min promotion | 480–960 min on-day
  general:      240–480 min small | 480–960 min medium | 960–1800 min large

HARD RULE: NEVER set estimated_minutes below 240.

═══════════════════════════════════════
PHASES
═══════════════════════════════════════
Use these phase values in the JSON:
  planning | design | development | testing | deployment

═══════════════════════════════════════
OUTPUT — ONLY valid JSON, no markdown
═══════════════════════════════════════
{
  "project_summary": "<2 sentences specific to this exact project>",
  "scope_level": "school|basic|professional|advanced",
  "recommended_team_size": <int>,
  "tasks": [
    {
      "title": "<specific actionable title>",
      "description": "<1-2 sentences on what exactly to do>",
      "estimated_minutes": <int, min 240, must vary per task>,
      "priority": "low|medium|high|urgent",
      "category": "<domain-appropriate label>",
      "phase": "planning|design|development|testing|deployment",
      "deadline": "<YYYY-MM-DD>"
    }
  ],
  "phases": [
    {"name": "<phase>", "tasks": ["<task title>"]}
  ]
}"""


SUBTASKS_SYSTEM = """You are an experienced project manager across all domains.
Given a parent task, generate specific domain-appropriate subtasks.

Rules:
- 3 to 6 subtasks
- Concrete and actionable
- Total time ≈ parent task time
- Match the domain — never apply software patterns to non-software tasks
- Never set estimated_minutes below 30

Return ONLY valid JSON:
{
  "subtasks": [
    {
      "title": "<subtask title>",
      "description": "<exactly what to do>",
      "estimated_minutes": <int, min 30>
    }
  ]
}"""


ENHANCE_SYSTEM = """You are a project planning assistant covering all domains.
Return ONLY valid JSON:
{
  "description": "<2-3 clear sentences on what the project is and will achieve>",
  "estimated_hours": <realistic integer>,
  "scope_level": "school|basic|professional|advanced",
  "category": "Work|Personal|Health|Study|Shopping"
}
Base estimates on the actual domain and scale detected from the name and description.
Be realistic — a student thesis is not 600h, a SaaS platform is not 40h."""


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/project-breakdown")
async def project_breakdown(req: ProjectBreakdownRequest):
    today = date.today().isoformat()

    # Fast keyword-based classification — no extra Groq call, avoids rate limits
    resolved_domain, resolved_scope = _simple_classify(
        req.name, req.description, req.scope
    )

    resolved_task_count = _calculate_task_count(resolved_scope, req.task_count)
    total_hour_range = SCOPE_HOUR_RANGES.get(resolved_scope, "100–300h total")

    deadline_info = (
        f"Project start date: {today}\n"
        f"Project deadline: {req.project_deadline}\n"
        f"Total timeline: {(date.fromisoformat(req.project_deadline) - date.today()).days} days\n"
        f"CRITICAL: Spread deadlines evenly — minimum 2-3 days apart within each phase. No clustering."
        if req.project_deadline
        else f"Project start date: {today}\nNo deadline — suggest realistic deadlines spaced 3-5 days apart per phase."
    )

    prompt = f"""Project Name: {req.name}
Description: {req.description}
Detected Domain: {resolved_domain}
Detected Scope: {resolved_scope}
Expected total effort: {total_hour_range}
Team: {req.team}
{deadline_info}

Generate exactly {resolved_task_count} tasks.
All tasks must be directly relevant to "{req.name}" and natural for a {resolved_domain} project.
Do not include tasks from other domains or unrelated personal activities."""

    result = ask_groq(BREAKDOWN_SYSTEM, prompt, max_tokens=2000, temperature=0.1)

    if req.project_deadline and isinstance(result, dict) and "tasks" in result:
        result["tasks"] = _validate_and_fix_deadlines(
            result["tasks"], today, req.project_deadline
        )

    if isinstance(result, dict):
        result["resolved_task_count"] = resolved_task_count
        result["resolved_scope"] = resolved_scope
        result["resolved_domain"] = resolved_domain
        result["user_requested_count"] = req.task_count

    return result


@router.post("/generate-subtasks")
async def generate_subtasks(req: SubtasksRequest):
    prompt = f"""Project context: {req.project_context}
Parent task: "{req.task_title}"
Task description: {req.task_description}
Category: {req.category}, Phase: {req.phase}
Parent estimated time: {req.estimated_minutes} minutes
Generate specific subtasks for this task."""

    result = ask_groq(SUBTASKS_SYSTEM, prompt, max_tokens=800)
    return result


@router.post("/enhance-project")
async def enhance_project(req: ProjectEnhanceRequest):
    prompt = f'Project name: "{req.name}"\nDescription hint: "{req.description}"'
    result = ask_groq(ENHANCE_SYSTEM, prompt, max_tokens=400, temperature=0.1)
    return result