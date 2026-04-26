import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../tasks/providers/tasks_provider.dart';

final kanbanProvider = Provider<Map<String, List<String>>>((ref) {
  final tasks = ref.watch(tasksProvider).valueOrNull?.tasks ?? const [];
  final map = <String, List<String>>{
    'todo': <String>[],
    'in-progress': <String>[],
    'review': <String>[],
    'done': <String>[],
  };
  for (final task in tasks) {
    map.putIfAbsent(task.status, () => <String>[]).add(task.title);
  }
  return map;
});
