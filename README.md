# Task Manager AI Platform

Final Year Project - AI-Powered Task Management.

## Project Structure
- `backend/` - Node.js + Express API
- `web-app/` - React web application
- `ai-service/` - Python FastAPI AI service

## Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- MongoDB running locally (or update backend DB connection)

## Environment Variables

### Backend (`backend/.env`)
Required variables:
- `PORT=5000`
- `MONGO_URI=mongodb://localhost:27017/taskmanager`
- `JWT_SECRET=your_secret`
- `JWT_EXPIRE=7d`
- `NODE_ENV=development`

Optional email variables (if using email verification/reset features):
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_EMAIL`
- `SMTP_PASSWORD`
- `FROM_EMAIL`

### AI Service (`ai-service/.env`)
Required variables:
- `GROQ_API_KEY=your_groq_api_key`

## Install Dependencies

### 1) Backend
```bash
cd backend
npm install
```

### 2) Web App
```bash
cd web-app
npm install
```

### 3) AI Service
Windows (PowerShell):
```powershell
cd ai-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

macOS/Linux:
```bash
cd ai-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run Every Service
Start each service in a separate terminal.

### 1) Run Backend API (port 5000)
```bash
cd backend
npm run dev
```

### 2) Run AI Service (port 8000)
Windows (PowerShell):
```powershell
cd ai-service
.\.venv\Scripts\Activate.ps1
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

macOS/Linux:
```bash
cd ai-service
source .venv/bin/activate
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 3) Run Web App (port 3000)
```bash
cd web-app
npm start
```

## Service URLs
- Web App: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- AI Service: `http://127.0.0.1:8000`
- AI Service health check: `http://127.0.0.1:8000/health`

## Recommended Start Order
1. Start MongoDB
2. Start backend (`npm run dev`)
3. Start AI service (`uvicorn main:app --reload`)
4. Start web app (`npm start`)
