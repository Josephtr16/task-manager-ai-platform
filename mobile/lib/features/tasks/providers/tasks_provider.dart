import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../services/ai_service.dart';
import '../../../services/task_service.dart';
import '../models/task_model.dart';

class TasksState {
  const TasksState({
    this.tasks = const <TaskModel>[],
    this.loading = false,
    this.page = 1,
    this.totalPages = 1,
    this.filters = const <String, dynamic>{
      'status': 'all',
      'priority': 'all',
      'category': 'all',
      'projectFilter': 'all',
      'sortBy': 'aiPriorityScore',
      'searchQuery': '',
    },
    this.riskAlerts,
  });

  final List<TaskModel> tasks;
  final bool loading;
  final int page;
  final int totalPages;
  final Map<String, dynamic> filters;
  final Map<String, dynamic>? riskAlerts;

  TasksState copyWith({
    List<TaskModel>? tasks,
    bool? loading,
    int? page,
    int? totalPages,
    Map<String, dynamic>? filters,
    Map<String, dynamic>? riskAlerts,
  }) {
    return TasksState(
      tasks: tasks ?? this.tasks,
      loading: loading ?? this.loading,
      page: page ?? this.page,
      totalPages: totalPages ?? this.totalPages,
      filters: filters ?? this.filters,
      riskAlerts: riskAlerts ?? this.riskAlerts,
    );
  }
}

final tasksProvider = AsyncNotifierProvider<TasksNotifier, TasksState>(TasksNotifier.new);

class TasksNotifier extends AsyncNotifier<TasksState> {
  final TaskService _taskService = TaskService();
  final AiService _aiService = AiService();

  @override
  Future<TasksState> build() async {
    final base = const TasksState();
    return _loadTasks(base);
  }

  Future<TasksState> _loadTasks(TasksState base, {bool append = false}) async {
    final map = <String, dynamic>{
      'page': base.page,
      'sortBy': base.filters['sortBy'],
      'search': base.filters['searchQuery'],
    };

    final response = await _taskService.getTasks(map);
    final list = ((response['tasks'] as List?) ?? const <dynamic>[])
        .map((e) => TaskModel.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
    final totalPages = int.tryParse('${response['pagination']?['totalPages'] ?? 1}') ?? 1;

    return base.copyWith(
      tasks: append ? <TaskModel>[...base.tasks, ...list] : list,
      totalPages: totalPages,
      loading: false,
    );
  }

  Future<void> loadTasks() async {
    final current = state.valueOrNull ?? const TasksState();
    state = AsyncData(await _loadTasks(current.copyWith(page: 1)));
  }

  Future<void> loadMore() async {
    final current = state.valueOrNull ?? const TasksState();
    if (current.page >= current.totalPages) return;
    state = AsyncData(await _loadTasks(current.copyWith(page: current.page + 1), append: true));
  }

  Future<void> setFilter(String key, dynamic value) async {
    final current = state.valueOrNull ?? const TasksState();
    final next = Map<String, dynamic>.from(current.filters)..[key] = value;
    state = AsyncData(await _loadTasks(current.copyWith(filters: next, page: 1)));
  }

  Future<void> aiPrioritize() async {
    final current = state.valueOrNull ?? const TasksState();
    final payload = current.tasks.map((t) => <String, dynamic>{'id': t.id, 'title': t.title}).toList();
    await _aiService.prioritize(payload);
  }

  Future<void> detectRisks() async {
    final current = state.valueOrNull ?? const TasksState();
    final payload = current.tasks.map((t) => <String, dynamic>{'id': t.id, 'title': t.title}).toList();
    final risks = await _aiService.detectRisks(payload);
    state = AsyncData(current.copyWith(riskAlerts: risks));
  }
}
