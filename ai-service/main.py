from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import prioritize, assist_write, predict_time, plan_day, detect_risks, reports, project_breakdown

app = FastAPI(title="Task Manager AI Service", version="1.0.0")

# Allow requests from React frontend and Node.js backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(prioritize.router,        prefix="/ai", tags=["AI"])
app.include_router(assist_write.router,      prefix="/ai", tags=["AI"])
app.include_router(predict_time.router,      prefix="/ai", tags=["AI"])
app.include_router(plan_day.router,          prefix="/ai", tags=["AI"])
app.include_router(detect_risks.router,      prefix="/ai", tags=["AI"])
app.include_router(reports.router,           prefix="/ai", tags=["AI"])
app.include_router(project_breakdown.router, prefix="/ai", tags=["AI"])

@app.get("/")
def root():
    return {"status": "AI Service running", "endpoints": [
        "POST /ai/prioritize",
        "POST /ai/assist-write",
        "POST /ai/predict-time",
        "POST /ai/plan-day",
        "POST /ai/detect-risks",
        "POST /ai/reports",
        "POST /ai/project-breakdown",
        "POST /ai/generate-subtasks",
    ]}

@app.get("/health")
def health():
    return {"status": "ok"}