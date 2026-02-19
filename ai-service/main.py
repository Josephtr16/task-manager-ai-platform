from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from model_manager import model_manager

app = FastAPI(title="Task Manager AI Service", version="1.0.0")

class TaskInput(BaseModel):
    title: str
    category: str
    priority: str
    subtask_count: int = 0
    days_until_deadline: Optional[float] = None

class PredictionResponse(BaseModel):
    predicted_duration: int
    priority_score: int
    confidence: float
    reason: str

class FeedbackInput(BaseModel):
    actual_duration: int
    predicted_duration: int

@app.get("/")
def read_root():
    return {"status": "AI Service Running"}

@app.post("/predict", response_model=PredictionResponse)
def predict_task(task: TaskInput):
    try:
        # Predict duration
        duration = model_manager.predict_duration(task.dict())
        
        # Calculate priority
        priority_score = model_manager.calculate_priority_score(task.dict())
        
        return {
            "predicted_duration": duration,
            "priority_score": priority_score,
            "confidence": 0.85 if model_manager.is_trained else 0.5,
            "reason": "Based on category and complexity"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/feedback")
def submit_feedback(feedback: FeedbackInput):
    model_manager.update_metrics(feedback.actual_duration, feedback.predicted_duration)
    return {"status": "success", "new_mae": model_manager.mean_absolute_error}

@app.get("/metrics")
def get_metrics():
    return {
        "mae": model_manager.mean_absolute_error,
        "tasks_processed": model_manager.tasks_processed,
        "is_trained": model_manager.is_trained
    }
