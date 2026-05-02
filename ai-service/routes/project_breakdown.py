from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from services.groq_client import ask_groq
import json

router = APIRouter()

class ProjectBreakdownRequest(BaseModel):
    name: str
    description: str
    project_type: Optional[str] = "web"
    team: Optional[str] = "solo"
    scope: Optional[str] = "auto"
    task_count: Optional[int] = 12
    project_deadline: Optional[str] = None  # format: YYYY-MM-DD

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

BREAKDOWN_SYSTEM = """You are a senior project manager with 15 years of experience across software, research, environmental, social, business, and academic projects.
Break down the given project into specific, actionable tasks with ACCURATE time estimates and deadlines.
The project may be a software product, a research study, a community program, a business initiative, or any other domain — detect the domain from the description and adapt all tasks and categories accordingly.

DOMAIN DETECTION RULES:
  - If the description mentions apps, APIs, databases, frontend, backend, deployment → it is a SOFTWARE project
  - If it mentions communities, environment, awareness, outreach, campaigns, recycling → it is a COMMUNITY/ENVIRONMENTAL project
  - If it mentions research, data collection, surveys, analysis, publications → it is a RESEARCH/ACADEMIC project
  - If it mentions sales, revenue, market, customers, partnerships, strategy → it is a BUSINESS project
  - Mixed projects (e.g. a platform for a community program) → treat as SOFTWARE for technical tasks, but do NOT force pure software patterns onto non-technical deliverables

CRITICAL TIME ESTIMATION RULES:
Scope reference points:
  - School/academic project: 50-120 hours TOTAL
  - Basic/MVP: 100-250 hours TOTAL
  - Professional/production: 300-600 hours TOTAL
  - Advanced/enterprise: 700+ hours TOTAL

Per-task minimums by domain:
  SOFTWARE:
    - Any UI component or page: minimum 8h (480 min)
    - Full frontend module: 15-30h
    - Backend API endpoint group: 8-20h
    - Database design + implementation: 10-25h
    - Authentication system: 15-25h
    - Payment integration: 20-40h
    - Testing: 15-30h
    - Deployment + CI/CD: 8-20h
    - Documentation: 5-15h
  RESEARCH/ACADEMIC:
    - Literature review: 10-20h
    - Data collection or surveys: 15-40h
    - Data analysis: 10-30h
    - Report or thesis writing: 10-20h
    - Presentation preparation: 5-10h
  COMMUNITY/ENVIRONMENTAL:
    - Stakeholder outreach and engagement: 8-20h
    - Educational material production: 10-25h
    - Event planning and coordination: 10-30h
    - Partnership negotiation: 10-25h
    - Impact assessment and reporting: 8-20h
    - Campaign design: 8-20h
  BUSINESS:
    - Market research: 8-20h
    - Strategy document: 6-15h
    - Partnership development: 10-25h
    - Financial planning: 8-20h
    - Pitch or presentation: 5-15h
  NEVER set estimated_minutes below 240.
  NEVER generate software-specific tasks (authentication systems, CI/CD pipelines, unit tests, API endpoints, database schemas) for purely non-software projects.

DEADLINE DISTRIBUTION RULES:
  - Tasks are divided across phases in this order: planning → design → development → testing → deployment
  - Distribute deadlines evenly between today and the project_deadline
  - Planning tasks get the earliest deadlines (first 10% of the timeline)
  - Design tasks get the next 15% of the timeline
  - Development tasks are spread across the middle 50% of the timeline
  - Testing tasks get the next 15% of the timeline
  - Deployment tasks get the last 10% of the timeline
  - All deadlines must be between today and project_deadline
  - Format all deadlines as YYYY-MM-DD

Return ONLY valid JSON, no markdown:
{
  "project_summary": "<2 sentences>",
  "scope_level": "school|basic|professional|advanced",
  "recommended_team_size": <int>,
  "tasks": [
    {
      "title": "<specific actionable title>",
      "description": "<what needs to be done, 1-2 sentences>",
      "estimated_minutes": <int, MINIMUM 240>,
      "priority": "low|medium|high|urgent",
      "category": "<for SOFTWARE use: Frontend|Backend|Database|Design|Testing|DevOps|Documentation — for other domains pick a fitting label such as: Research|Outreach|Planning|Content|Logistics|Analysis|Communication|Fundraising|Partnerships>",
      "phase": "planning|design|development|testing|deployment",
      "deadline": "<YYYY-MM-DD>"
    }
  ],
  "phases": [
    {"name": "<phase>", "tasks": ["<title>"]}
  ]
}"""

SUBTASKS_SYSTEM = """You are a project manager. Given a task from any type of project (software, research, community, business, etc.), generate specific and domain-appropriate subtasks.
Return ONLY valid JSON:
{
  "subtasks": [
    {
      "title": "<subtask title>",
      "description": "<what exactly to do>",
      "estimated_minutes": <int, min 30>
    }
  ]
}
Rules:
- Generate 3 to 6 subtasks
- Each subtask must be concrete and actionable
- Total subtask time should approximately equal the parent task time
- Subtasks must be specific to the exact task and appropriate to its domain
- Do NOT apply software development patterns (unit tests, deployments, API calls) to non-software tasks"""

@router.post("/project-breakdown")
async def project_breakdown(req: ProjectBreakdownRequest):
    from datetime import date
    today = date.today().isoformat()
    deadline_info = (
        f"Project start date: {today}\nProject deadline: {req.project_deadline}\n"
        f"Distribute task deadlines evenly across phases between these two dates."
        if req.project_deadline
        else f"Project start date: {today}\nNo deadline set — suggest reasonable deadlines starting from today based on task complexity and phase order."
    )
    scope_hint = (
        "Detect from description — student projects are school scope, freelance is basic/professional"
        if req.scope == "auto" else req.scope
    )
    prompt = f"""Project Name: {req.name}
Description: {req.description}
Type: {req.project_type}
Team: {req.team}
Scope: {scope_hint}
{deadline_info}
Generate exactly {req.task_count} tasks. Each must be specific to THIS project and appropriate to its actual domain."""
    result = ask_groq(BREAKDOWN_SYSTEM, prompt, max_tokens=3000, temperature=0.1)
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

ENHANCE_SYSTEM = """You are a project planning assistant.
Given a project name and optional description, return an enhanced version.
Return ONLY valid JSON with no extra text:
{
  "description": "<2-3 clear sentences describing what the project is and what it will achieve>",
  "estimated_hours": <realistic total project hours as integer>,
  "scope_level": "school|basic|professional|advanced",
  "category": "Work|Personal|Health|Study|Shopping"
}
Hour estimation rules:
  - Simple portfolio site: 40-80h
  - E-commerce website: 200-400h
  - Mobile app: 150-300h
  - Task manager app: 100-200h
  - School CRUD project: 40-100h
  - SaaS platform: 300-600h
  - Blog or landing page: 20-50h"""

@router.post("/enhance-project")
async def enhance_project(req: ProjectEnhanceRequest):
    prompt = f'Project name: "{req.name}"\nDescription hint: "{req.description}"'
    result = ask_groq(ENHANCE_SYSTEM, prompt, max_tokens=400, temperature=0.1)
    return result