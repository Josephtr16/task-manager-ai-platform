import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/widgets/gradient_background.dart';
import '../../../../core/widgets/tf_button.dart';
import '../../../../core/widgets/tf_input.dart';
import '../providers/tasks_provider.dart';
import '../widgets/create_task_sheet.dart';
import '../widgets/filter_bottom_sheet.dart';
import '../widgets/risk_alerts_panel.dart';
import '../widgets/task_card.dart';
import '../widgets/task_detail_sheet.dart';

class TasksScreen extends ConsumerStatefulWidget {
  const TasksScreen({super.key});

  @override
  ConsumerState<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends ConsumerState<TasksScreen> {
  final _search = TextEditingController();
  Timer? _debounce;

  @override
  void dispose() {
    _debounce?.cancel();
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(tasksProvider);

    return Scaffold(
      body: GradientBackground(
        child: state.when(
          data: (data) => ListView(
            padding: const EdgeInsets.fromLTRB(16, 52, 16, 120),
            children: <Widget>[
              Text('All Tasks', style: Theme.of(context).textTheme.displaySmall),
              const SizedBox(height: 8),
              Text("${data.tasks.where((t) => t.status != 'done').length} active · ${data.tasks.where((t) => t.status == 'done').length} completed"),
              const SizedBox(height: 12),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: <Widget>[
                    TfButton(
                      label: 'AI Prioritize',
                      icon: Icons.auto_awesome,
                      variant: TfButtonVariant.secondary,
                      onPressed: () => ref.read(tasksProvider.notifier).aiPrioritize(),
                    ),
                    const SizedBox(width: 8),
                    TfButton(
                      label: 'Detect Risks',
                      icon: Icons.warning_amber_rounded,
                      variant: TfButtonVariant.secondary,
                      onPressed: () => ref.read(tasksProvider.notifier).detectRisks(),
                    ),
                    const SizedBox(width: 8),
                    TfButton(
                      label: '+ New Task',
                      icon: Icons.add,
                      variant: TfButtonVariant.primary,
                      onPressed: () => showModalBottomSheet<void>(
                        context: context,
                        isScrollControlled: true,
                        backgroundColor: Colors.transparent,
                        builder: (_) => const CreateTaskSheet(),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              TfInput(
                controller: _search,
                hint: 'Search tasks...',
                prefixIcon: const Icon(Icons.search),
                onChanged: (v) {
                  _debounce?.cancel();
                  _debounce = Timer(const Duration(milliseconds: 400), () {
                    ref.read(tasksProvider.notifier).setFilter('searchQuery', v);
                  });
                },
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                children: <Widget>[
                  ActionChip(
                    label: const Text('Status'),
                    onPressed: () => showModalBottomSheet<void>(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (_) => FilterBottomSheet(
                        title: 'Status',
                        options: const <String>['all', 'todo', 'in-progress', 'review', 'done'],
                        current: "${data.filters['status']}",
                        onSelect: (value) => ref.read(tasksProvider.notifier).setFilter('status', value),
                      ),
                    ),
                  ),
                ],
              ),
              if (data.riskAlerts != null) ...<Widget>[
                const SizedBox(height: 12),
                RiskAlertsPanel(risk: data.riskAlerts!),
              ],
              const SizedBox(height: 12),
              ...data.tasks.map((task) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: TaskCard(
                      task: task,
                      onTap: () => showModalBottomSheet<void>(
                        context: context,
                        isScrollControlled: true,
                        backgroundColor: Colors.transparent,
                        builder: (_) => TaskDetailSheet(task: task),
                      ),
                    ),
                  )),
            ],
          ),
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, _) => Center(child: Text(err.toString())),
        ),
      ),
    );
  }
}
