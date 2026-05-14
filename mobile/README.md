# TaskFlow AI - Mobile (Flutter)

Mobile companion to the TaskFlow AI web platform.
Connects to the same Node.js backend (port 5000) and
Python/FastAPI AI microservice (port 8000).
No backend changes required.

## Setup
flutter pub get
flutter run

If you are running on a physical Android phone, stop the app completely and launch it again with your computer's LAN IP so the app can reach the backend:
```bash
flutter run --dart-define=TASKFLOW_ANDROID_HOST=192.168.1.14
```
If you are connected over USB debugging instead of Wi-Fi, you can also map the backend ports with ADB:
```bash
adb reverse tcp:5000 tcp:5000
adb reverse tcp:8000 tcp:8000
```

## Design
Quiet luxury editorial dark aesthetic.
Primary: #C9924A (warm copper). Fonts: Geist/Syne/Fraunces.
NO neumorphic shadows - uses subtle elevation shadows.

## Stack
State: Riverpod  |  Nav: GoRouter  |  HTTP: Dio
Storage: FlutterSecureStorage + SharedPreferences
Charts: fl_chart  |  Calendar: table_calendar

## Features
Auth (login/register/verify/reset) - Dashboard with AI standup + daily plan
Tasks (AI prioritize, risk detect, create/edit/delete) - Focus (Pomodoro + simple timer)
Projects (AI breakdown, sharing, permissions) - Kanban (drag-drop)
Calendar (month/week) - AI Insights (6 charts) - Notifications - Settings
