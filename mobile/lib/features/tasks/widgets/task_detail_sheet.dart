import 'package:flutter/material.dart';

import '../../../../core/widgets/tf_button.dart';
import '../../../../core/widgets/tf_card.dart';
import '../../tasks/models/task_model.dart';

class TaskDetailSheet extends StatelessWidget {
  const TaskDetailSheet({super.key, required this.task});

  final TaskModel task;

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.95,
      maxChildSize: 0.98,
      expand: false,
      builder: (_, controller) => ListView(
        controller: controller,
        padding: const EdgeInsets.all(16),
        children: <Widget>[
          const Center(child: SizedBox(width: 42, child: Divider(thickness: 3))),
          const SizedBox(height: 12),
          Text(task.title, style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 12),
          TfCard(child: Text(task.description ?? 'No description')),
          const SizedBox(height: 12),
          TfCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const <Widget>[
                Text('Time Tracking'),
                SizedBox(height: 8),
                Text('Timer support is wired to API service and can be expanded here.'),
              ],
            ),
          ),
          const SizedBox(height: 12),
          TfButton(label: 'Close', onPressed: () => Navigator.of(context).pop()),
        ],
      ),
    );
  }
}
