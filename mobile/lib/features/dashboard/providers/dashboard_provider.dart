import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../services/task_service.dart';

class DashboardState {
  const DashboardState({
    this.tasks = const <Map<String, dynamic>>[],
    this.upcomingTasks = const <Map<String, dynamic>>[],
    this.stats = const <String, dynamic>{},
    this.dailyPlan,
    this.standupReport,
  });

  final List<Map<String, dynamic>> tasks;
  final List<Map<String, dynamic>> upcomingTasks;
  final Map<String, dynamic> stats;
  final Map<String, dynamic>? dailyPlan;
  final Map<String, dynamic>? standupReport;
}

final dashboardProvider =
    AsyncNotifierProvider<DashboardNotifier, DashboardState>(
        DashboardNotifier.new);

class DashboardNotifier extends AsyncNotifier<DashboardState> {
  final TaskService _taskService = TaskService();

  @override
  Future<DashboardState> build() async => _load();

  Future<DashboardState> _load() async {
    final results = await Future.wait([
      _taskService.getTasks(),
      _taskService.getStatistics(),
      _taskService.getUpcoming(),
    ]);

    final tasks = ((results[0]['tasks'] as List?) ?? const <dynamic>[])
        .map((e) => Map<String, dynamic>.from(e as Map))
        .toList();
    final upcoming = ((results[2]['tasks'] as List?) ?? const <dynamic>[])
        .map((e) => Map<String, dynamic>.from(e as Map))
        .toList();
    final statsRaw = results[1]['stats'] is Map
        ? Map<String, dynamic>.from(results[1]['stats'] as Map)
        : Map<String, dynamic>.from(results[1]);

    return DashboardState(
      tasks: tasks,
      stats: statsRaw,
      upcomingTasks: upcoming,
    );
  }

  Future<void> refresh() async {
    state = AsyncData(await _load());
  }
}
