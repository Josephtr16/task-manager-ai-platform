import 'dart:async';

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

  Timer? _debounceTimer;

  @override
  Future<TasksState> build() async {
    ref.onDispose(() => _debounceTimer?.cancel());
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

  /// Debounced auto-reprioritize — fires 1.5s after the last mutation,
  /// matching the web app's triggerAutoReprioritize behavior.
  void _triggerAutoReprioritize() {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 1500), () {
      aiPrioritize(silent: true);
    });
  }

  Future<void> loadTasks() async {
    final current = state.valueOrNull ?? const TasksState();
    state = const AsyncLoading();
    state = AsyncData(await _loadTasks(current.copyWith(page: 1)));
  }

  Future<void> loadMore() async {
    final current = state.valueOrNull ?? const TasksState();
    if (current.page >= current.totalPages) return;
    state = AsyncData(
        await _loadTasks(current.copyWith(page: current.page + 1), append: true));
  }

  Future<void> setFilter(String key, dynamic value) async {
    final current = state.valueOrNull ?? const TasksState();
    final next = Map<String, dynamic>.from(current.filters)..[key] = value;
    state = AsyncData(await _loadTasks(current.copyWith(filters: next, page: 1)));
  }

  Future<void> createTask(Map<String, dynamic> payload) async {
    await _taskService.createTask(payload);
    await loadTasks();
    _triggerAutoReprioritize();
  }

  Future<void> updateTask(String id, Map<String, dynamic> payload) async {
    await _taskService.updateTask(id, payload);
    await loadTasks();
    _triggerAutoReprioritize();
  }

  Future<void> deleteTask(String id) async {
    await _taskService.deleteTask(id);
    await loadTasks();
    _triggerAutoReprioritize();
  }

  Future<void> toggleComplete(TaskModel task) async {
    final nextStatus = task.status == 'done' ? 'todo' : 'done';
    await _taskService.updateTask(task.id, <String, dynamic>{'status': nextStatus});
    await loadTasks();
    _triggerAutoReprioritize();
  }

  /// [silent] = true → called automatically after mutations (no loading flash).
  /// [silent] = false → called manually by tapping "AI Prioritize".
  Future<void> aiPrioritize({bool silent = false}) async {
    final current = state.valueOrNull ?? const TasksState();

    final activeTasks = current.tasks
        .where((t) => t.status.toLowerCase() != 'done')
        .toList();

    if (activeTasks.isEmpty) return;

    // Send the same fields the web app sends to prioritize.py
    final payload = current.tasks
        .map((t) => <String, dynamic>{
              'id': t.id,
              'title': t.title,
              'priority': t.priority,
              'status': t.status,
              'deadline': t.deadline?.toIso8601String(),
              'estimated_minutes': t.estimatedDuration,
              'category': t.category,
            })
        .toList();

    final result = await _aiService.prioritize(payload);

    // Build scoreMap from response (same as web app)
    final rankedTasks = (result['tasks'] as List?) ?? [];
    final scoreMap = <String, int>{};
    for (final item in rankedTasks) {
      if (item is Map) {
        final id = item['id']?.toString() ?? '';
        final score = item['score'];
        if (id.isNotEmpty && score != null) {
          scoreMap[id] = (score is num) ? score.round() : int.tryParse('$score') ?? 0;
        }
      }
    }

    if (scoreMap.isEmpty) {
      if (!silent) await loadTasks();
      return;
    }

    // Apply scores to tasks
    final scoredTasks = current.tasks.map((t) {
      final score = scoreMap[t.id];
      if (score == null) return t;
      return TaskModel(
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        category: t.category,
        deadline: t.deadline,
        estimatedDuration: t.estimatedDuration,
        aiPriorityScore: score,
        projectName: t.projectName,
        totalSubtasks: t.totalSubtasks,
        completedSubtasks: t.completedSubtasks,
        attachments: t.attachments,
        comments: t.comments,
        subtasks: t.subtasks,
      );
    }).toList();

    // Sort active by descending AI score, completed stay at the bottom
    final active = scoredTasks.where((t) => t.status.toLowerCase() != 'done').toList();
    final completed = scoredTasks.where((t) => t.status.toLowerCase() == 'done').toList();

    active.sort((a, b) {
      final aScore = a.aiPriorityScore ?? -1;
      final bScore = b.aiPriorityScore ?? -1;
      return bScore.compareTo(aScore);
    });

    // Re-fetch latest state in case it changed during the async gap
    final latest = state.valueOrNull ?? current;
    state = AsyncData(latest.copyWith(tasks: [...active, ...completed]));
  }

  Future<void> detectRisks() async {
    final current = state.valueOrNull ?? const TasksState();
    final payload = current.tasks
        .map((t) => <String, dynamic>{
              'id': t.id,
              'title': t.title,
              'priority': t.priority,
              'status': t.status,
              'deadline': t.deadline?.toIso8601String(),
              'estimated_minutes': t.estimatedDuration,
              'category': t.category,
            })
        .toList();
    final risks = await _aiService.detectRisks(payload);
    state = AsyncData(current.copyWith(riskAlerts: risks));
  }
}