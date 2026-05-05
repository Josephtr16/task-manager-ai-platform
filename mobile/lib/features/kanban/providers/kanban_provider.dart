import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../tasks/models/task_model.dart';
import '../../tasks/providers/tasks_provider.dart';

final kanbanProvider = Provider<Map<String, List<TaskModel>>>((ref) {
  final tasks = ref.watch(tasksProvider).valueOrNull?.tasks ?? const <TaskModel>[];
  final map = <String, List<TaskModel>>{
    'todo': <TaskModel>[],
    'in-progress': <TaskModel>[],
    'review': <TaskModel>[],
    'done': <TaskModel>[],
  };
  for (final task in tasks) {
    final key = task.status.toLowerCase();
    map.putIfAbsent(key, () => <TaskModel>[]).add(task);
  }
  return map;
});
