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
      'sortBy': 'deadline',
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

final tasksProvider =
    AsyncNotifierProvider<TasksNotifier, TasksState>(TasksNotifier.new);

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
      'limit': 50,
      'sortBy': base.filters['sortBy'],
      'search': base.filters['searchQuery'],
      'status': base.filters['status'],
    };

    final priority = '${base.filters['priority'] ?? 'all'}';
    if (priority != 'all') {
      map['priority'] = priority;
    }

    final category = '${base.filters['category'] ?? 'all'}';
    if (category != 'all') {
      map['category'] = category;
    }

    final projectFilter = '${base.filters['projectFilter'] ?? 'all'}';
    if (projectFilter != 'all') {
      map['projectId'] = projectFilter;
    }

    final response = await _taskService.getTasks(map);
    final list = ((response['tasks'] as List?) ?? const <dynamic>[])
        .map((e) => TaskModel.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
    final sortedList = _sortTasks(list);
    final totalPages =
        int.tryParse('${response['pagination']?['totalPages'] ?? 1}') ?? 1;

    return base.copyWith(
      tasks: append ? <TaskModel>[...base.tasks, ...sortedList] : sortedList,
      totalPages: totalPages,
      loading: false,
    );
  }

  List<TaskModel> _sortTasks(List<TaskModel> tasks) {
    final active = <TaskModel>[];
    final completed = <TaskModel>[];

    for (final task in tasks) {
      if (task.status.toLowerCase() == 'done') {
        completed.add(task);
      } else {
        active.add(task);
      }
    }

    int compareByDeadline(TaskModel left, TaskModel right) {
      final leftDeadline = left.deadline;
      final rightDeadline = right.deadline;

      if (leftDeadline == null && rightDeadline == null) return 0;
      if (leftDeadline == null) return 1;
      if (rightDeadline == null) return -1;
      return leftDeadline.compareTo(rightDeadline);
    }

    active.sort(compareByDeadline);
    completed.sort(compareByDeadline);
    return <TaskModel>[...active, ...completed];
  }

  Future<void> loadTasks() async {
    final current = state.valueOrNull ?? const TasksState();
    state = const AsyncLoading();
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

  Future<void> createTask(Map<String, dynamic> payload) async {
    await _taskService.createTask(payload);
    await loadTasks();
  }

  Future<void> updateTask(String id, Map<String, dynamic> payload) async {
    await _taskService.updateTask(id, payload);
    await loadTasks();
  }

  Future<void> deleteTask(String id) async {
    await _taskService.deleteTask(id);
    await loadTasks();
  }

  Future<void> toggleComplete(TaskModel task) async {
    final nextStatus = task.status == 'done' ? 'todo' : 'done';
    await _taskService.updateTask(task.id, <String, dynamic>{'status': nextStatus});
    await loadTasks();
  }

  Future<void> aiPrioritize() async {
    final current = state.valueOrNull ?? const TasksState();
    final payload = current.tasks
        .map((t) => <String, dynamic>{
              'id': t.id,
              'title': t.title,
              'priority': t.priority,
              'deadline': t.deadline?.toIso8601String(),
            })
        .toList();
    await _aiService.prioritize(payload);
    await loadTasks();
  }

  Future<void> detectRisks() async {
    final current = state.valueOrNull ?? const TasksState();
    final payload = current.tasks
        .map((t) => <String, dynamic>{
              'id': t.id,
              'title': t.title,
              'priority': t.priority,
              'deadline': t.deadline?.toIso8601String(),
            })
        .toList();
    final risks = await _aiService.detectRisks(payload);
    state = AsyncData(current.copyWith(riskAlerts: risks));
  }
}
