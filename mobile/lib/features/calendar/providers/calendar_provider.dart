import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../tasks/providers/tasks_provider.dart';

final calendarTasksProvider = Provider<List<Map<String, dynamic>>>((ref) {
  final tasks = ref.watch(tasksProvider).valueOrNull?.tasks ?? const [];
  return tasks
      .map((e) => <String, dynamic>{
            'id': e.id,
            'title': e.title,
            'deadline': e.deadline,
            'priority': e.priority,
          })
      .toList();
});
