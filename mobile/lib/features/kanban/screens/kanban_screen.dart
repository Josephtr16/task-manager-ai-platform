import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/gradient_background.dart';
import '../providers/kanban_provider.dart';

class KanbanScreen extends ConsumerWidget {
  const KanbanScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final map = ref.watch(kanbanProvider);
    final columns = <String>['todo', 'in-progress', 'review', 'done'];

    return Scaffold(
      appBar: AppBar(title: const Text('Kanban')),
      body: GradientBackground(
        child: PageView.builder(
          itemCount: columns.length,
          itemBuilder: (context, index) {
            final key = columns[index];
            final items = map[key] ?? const <String>[];
            return ListView(
              padding: const EdgeInsets.all(16),
              children: <Widget>[
                Text(key.toUpperCase(), style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 12),
                ...items.map((e) => Card(child: ListTile(title: Text(e)))),
              ],
            );
          },
        ),
      ),
    );
  }
}
