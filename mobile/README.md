# TaskFlow AI - Mobile (Flutter)

Mobile companion to the TaskFlow AI web platform.
Connects to the same Node.js backend (port 5000) and
Python/FastAPI AI microservice (port 8000).
No backend changes required.

## Setup
flutter pub get
flutter run

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
