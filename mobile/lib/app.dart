import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'core/theme/app_theme.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/auth/screens/forgot_password_screen.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/auth/screens/register_screen.dart';
import 'features/auth/screens/reset_password_screen.dart';
import 'features/auth/screens/verify_email_screen.dart';
import 'features/calendar/screens/calendar_screen.dart';
import 'features/dashboard/screens/dashboard_screen.dart';
import 'features/focus/screens/focus_screen.dart';
import 'features/insights/screens/insights_screen.dart';
import 'features/kanban/screens/kanban_screen.dart';
import 'features/projects/screens/project_detail_screen.dart';
import 'features/projects/screens/projects_screen.dart';
import 'features/settings/providers/settings_provider.dart';
import 'features/settings/screens/settings_screen.dart';
import 'features/shell/main_shell.dart';
import 'features/tasks/screens/tasks_screen.dart';

final rootNavigatorKey = GlobalKey<NavigatorState>();

final appRouterProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authProvider);
  final isAuthed = auth.valueOrNull?.isAuthenticated == true;

  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: '/dashboard',
    redirect: (context, state) {
      final path = state.uri.path;
      final publicRoutes = <String>{'/login', '/register', '/verify-email', '/forgot-password', '/reset-password'};
      final isPublic = publicRoutes.contains(path);

      if (!isAuthed && !isPublic) return '/login';
      if (isAuthed && (path == '/login' || path == '/register')) return '/dashboard';
      return null;
    },
    routes: <RouteBase>[
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(
        path: '/verify-email',
        builder: (_, state) => VerifyEmailScreen(
          email: state.uri.queryParameters['email'],
          token: state.uri.queryParameters['token'],
        ),
      ),
      GoRoute(path: '/forgot-password', builder: (_, __) => const ForgotPasswordScreen()),
      GoRoute(
        path: '/reset-password',
        builder: (_, state) => ResetPasswordScreen(
          email: state.uri.queryParameters['email'],
          token: state.uri.queryParameters['token'],
        ),
      ),
      ShellRoute(
        builder: (_, __, child) => MainShell(child: child),
        routes: <RouteBase>[
          GoRoute(path: '/dashboard', builder: (_, __) => const DashboardScreen()),
          GoRoute(path: '/tasks', builder: (_, __) => const TasksScreen()),
          GoRoute(path: '/focus', builder: (_, __) => const FocusScreen()),
          GoRoute(path: '/projects', builder: (_, __) => const ProjectsScreen()),
          GoRoute(path: '/kanban', builder: (_, __) => const KanbanScreen()),
          GoRoute(path: '/calendar', builder: (_, __) => const CalendarScreen()),
          GoRoute(path: '/insights', builder: (_, __) => const InsightsScreen()),
          GoRoute(path: '/settings', builder: (_, __) => const SettingsScreen()),
        ],
      ),
      GoRoute(
        path: '/projects/:id',
        builder: (_, state) => ProjectDetailScreen(projectId: state.pathParameters['id'] ?? ''),
      ),
    ],
  );
});

class TaskFlowApp extends ConsumerWidget {
  const TaskFlowApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    final settings = ref.watch(settingsProvider);

    return MaterialApp.router(
      title: 'TaskFlow AI',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: settings.themeMode,
      routerConfig: router,
    );
  }
}
