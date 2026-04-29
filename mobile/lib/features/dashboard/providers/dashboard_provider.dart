import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../services/ai_service.dart';
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
    final results = await Future.wait<Map<String, dynamic>?>([
      _taskService.getTasks(),
      _taskService.getDailyPlan(),
      _taskService.getStatistics(),
      _taskService.getUpcoming(),
    ]);

    final tasksPayload = results[0] ?? const <String, dynamic>{};
    final dailyPlanRaw = results[1];
    final statsPayload = results[2] ?? const <String, dynamic>{};
    final upcomingPayload = results[3] ?? const <String, dynamic>{};

    final tasks = ((tasksPayload['tasks'] as List?) ?? const <dynamic>[])
        .map((e) => Map<String, dynamic>.from(e as Map))
        .toList();
    final upcoming = ((upcomingPayload['tasks'] as List?) ?? const <dynamic>[])
        .map((e) => Map<String, dynamic>.from(e as Map))
        .toList();
    final statsRaw = statsPayload['stats'] is Map
        ? Map<String, dynamic>.from(statsPayload['stats'] as Map)
        : Map<String, dynamic>.from(statsPayload);

    return DashboardState(
      tasks: tasks,
      stats: statsRaw,
      upcomingTasks: upcoming,
      dailyPlan: dailyPlanRaw,
    );
  }

  Future<void> refresh() async {
    state = AsyncData(await _load());
  }

  Future<void> generateDailyPlan({
    String workStart = '09:00',
    String workEnd = '18:00',
  }) async {
    final current = state.valueOrNull;
    if (current == null) {
      throw Exception('Dashboard data is still loading.');
    }

    final activeTasks = current.tasks
        .where((task) => '${task['status'] ?? ''}'.toLowerCase() != 'done')
        .map((task) => <String, dynamic>{
              'id': '${task['_id'] ?? task['id'] ?? ''}',
              'title': '${task['title'] ?? ''}',
              'priority': '${task['priority'] ?? 'medium'}',
              'status': '${task['status'] ?? 'todo'}',
              'deadline': task['deadline'],
              'estimated_minutes': task['estimatedDuration'] ?? 60,
              'category': '${task['category'] ?? ''}',
              'dependencies':
                  ((task['dependencies'] as List?) ?? const <dynamic>[])
                      .map((dep) {
                if (dep is Map) {
                  return '${dep['_id'] ?? dep['id'] ?? dep}';
                }
                return '$dep';
              }).toList(),
            })
        .where((task) => task['id'].toString().isNotEmpty)
        .toList();

    if (activeTasks.isEmpty) {
      throw Exception('Add at least one active task before planning your day.');
    }

    final plan = await AiService().planDay(activeTasks, workStart, workEnd);
    final focusTaskId = '${plan['focus_task'] ?? ''}';
    final focusTaskTitle = _resolveTaskTitle(current.tasks, focusTaskId);
    final schedule = _attachScheduleMetadata(plan['schedule'], current.tasks);
    state = AsyncData(
      DashboardState(
        tasks: current.tasks,
        upcomingTasks: current.upcomingTasks,
        stats: current.stats,
        standupReport: current.standupReport,
        dailyPlan: <String, dynamic>{
          ...plan,
          if (focusTaskTitle != null) 'focus_task_title': focusTaskTitle,
          if (schedule != null) 'schedule': schedule,
        },
      ),
    );
    try {
      // Persist generated plan so other clients (web/mobile) can see it.
      await _taskService.saveDailyPlan(state.value!.dailyPlan!);
    } catch (e) {
      // Non-fatal: keep UI state even if persistence fails.
      // Log for diagnostics if needed.
      // ignore: avoid_print
      print('Failed to persist daily plan: $e');
    }
  }

  Future<void> clearDailyPlan() async {
    final current = state.valueOrNull;
    if (current == null) return;

    state = AsyncData(
      DashboardState(
        tasks: current.tasks,
        upcomingTasks: current.upcomingTasks,
        stats: current.stats,
        standupReport: current.standupReport,
        dailyPlan: null,
      ),
    );
    try {
      await _taskService.deleteDailyPlan();
    } catch (e) {
      // ignore persistence errors
      // ignore: avoid_print
      print('Failed to delete persisted daily plan: $e');
    }
  }

  String? _resolveTaskTitle(List<Map<String, dynamic>> tasks, String taskId) {
    if (taskId.isEmpty) return null;

    for (final task in tasks) {
      final id = '${task['_id'] ?? task['id'] ?? ''}';
      if (id == taskId) {
        final title = '${task['title'] ?? ''}'.trim();
        return title.isEmpty ? null : title;
      }
    }

    return null;
  }

  List<Map<String, dynamic>>? _attachScheduleMetadata(
    Object? rawSchedule,
    List<Map<String, dynamic>> tasks,
  ) {
    if (rawSchedule is! List) return null;

    final taskDataById = <String, Map<String, dynamic>>{
      for (final task in tasks)
        if ('${task['_id'] ?? task['id'] ?? ''}'.isNotEmpty)
          '${task['_id'] ?? task['id'] ?? ''}': task,
    };

    return rawSchedule.map((entry) {
      if (entry is! Map) {
        return <String, dynamic>{};
      }

      final item = Map<String, dynamic>.from(entry as Map);

      // Try to resolve the task by multiple candidate id fields
      final taskIdCandidates = <dynamic>[
        item['task_id'],
        item['taskId'],
        item['task'],
        item['id'],
      ];

      String resolvedTaskId = '';
      Map<String, dynamic>? task;

      for (final cand in taskIdCandidates) {
        if (cand == null) continue;
        final candText = cand.toString().trim();
        if (candText.isEmpty) continue;
        if (taskDataById.containsKey(candText)) {
          resolvedTaskId = candText;
          task = taskDataById[candText];
          break;
        }
      }

      // If still not found, try a title match (case-insensitive)
      if (task == null) {
        final titleCandidate = '${item['title'] ?? ''}'.trim().toLowerCase();
        if (titleCandidate.isNotEmpty) {
          for (final t in tasks) {
            final tTitle = '${t['title'] ?? ''}'.trim().toLowerCase();
            if (tTitle.isNotEmpty && tTitle == titleCandidate) {
              resolvedTaskId = '${t['_id'] ?? t['id'] ?? ''}';
              task = t;
              break;
            }
          }
        }
      }

      if (task != null) {
        // Debug: log mapping information to help diagnose missing subtasks
        // ignore: avoid_print
        print('DAILY PLAN: matched task for schedule item "${item['title'] ?? ''}" -> id=$resolvedTaskId, taskTitle=${task['title'] ?? ''}');
        final title = '${item['title'] ?? ''}'.trim();
        final resolvedTitle = '${task['title'] ?? ''}'.trim();
        if (title.isEmpty && resolvedTitle.isNotEmpty) {
          item['title'] = resolvedTitle;
        }

        final deadlineRaw = _extractDeadlineRaw(item, task);
        final deadlineLabel = _formatDeadlineLabel(deadlineRaw);
        if (deadlineRaw != null && deadlineRaw.isNotEmpty) {
          item['deadline'] = deadlineRaw;
        }
        if (deadlineLabel != null) {
          item['deadline_label'] = deadlineLabel;
        }

        final estimatedMinutes = item['estimated_duration'] ??
            item['duration_minutes'] ??
            task['estimatedDuration'] ??
            task['estimated_minutes'];
        if (estimatedMinutes != null) {
          item['estimated_duration'] = estimatedMinutes;
        }

        // Normalize subtasks: support List<Map> or List<String>
        final subtasksRaw = task['subtasks'];
        if (subtasksRaw is List) {
          // ignore: avoid_print
          print('DAILY PLAN: raw subtasks type=${subtasksRaw.runtimeType}, length=${subtasksRaw.length}');
          final normalized = <Map<String, dynamic>>[];
          for (final s in subtasksRaw) {
            if (s is Map) {
              normalized.add(Map<String, dynamic>.from(s));
            } else if (s is String) {
              normalized.add(<String, dynamic>{'title': s, 'completed': false});
            } else {
              normalized.add(<String, dynamic>{'title': s?.toString() ?? '', 'completed': false});
            }
          }
          item['subtasks'] = normalized;
          // ignore: avoid_print
          print('DAILY PLAN: normalized subtasks length=${normalized.length}');
        }

        final taskStatus = '${task['status'] ?? ''}'.trim();
        if (taskStatus.isNotEmpty) {
          item['task_status'] = taskStatus;
        }
      } else {
        // ignore: avoid_print
        print('DAILY PLAN: no matching task found for schedule entry: ${entry}');
      }

      return item;
    }).toList();
  }

  String? _extractDeadlineRaw(
      Map<String, dynamic> item, Map<String, dynamic> task) {
    final candidates = <dynamic>[
      item['deadline'],
      item['dueDate'],
      item['due_date'],
      item['deadline_at'],
      task['deadline'],
      task['dueDate'],
      task['due_date'],
      task['deadline_at'],
    ];

    for (final candidate in candidates) {
      if (candidate == null) continue;
      final text = candidate.toString().trim();
      if (text.isNotEmpty) return text;
    }

    return null;
  }

  String? _formatDeadlineLabel(String? rawDeadline) {
    if (rawDeadline == null || rawDeadline.isEmpty) return null;

    // Try ISO parse first
    var parsed = DateTime.tryParse(rawDeadline)?.toLocal();
    if (parsed == null) {
      // Handle numeric epoch timestamps (seconds or milliseconds)
      final asInt = int.tryParse(rawDeadline);
      if (asInt != null) {
        // if value looks like milliseconds (>= 10^12) treat as ms, else seconds
        if (asInt > 100000000000) {
          parsed = DateTime.fromMillisecondsSinceEpoch(asInt).toLocal();
        } else if (asInt > 1000000000) {
          parsed = DateTime.fromMillisecondsSinceEpoch(asInt * 1000).toLocal();
        } else {
          // small number, return raw
          return rawDeadline;
        }
      } else {
        return rawDeadline;
      }
    }

    return DateFormat('MMM d, yyyy').format(parsed);
  }
}
