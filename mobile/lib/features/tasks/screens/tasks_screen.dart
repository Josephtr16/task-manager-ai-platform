import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../../core/widgets/gradient_background.dart';
import '../../../../core/widgets/tf_page_header.dart';
import '../../../../core/widgets/tf_badge.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/tasks_provider.dart';
import '../widgets/create_task_sheet.dart';
import '../widgets/risk_alerts_panel.dart';
import '../widgets/swipeable_task_card.dart';
import '../widgets/task_detail_sheet.dart';
import '../models/task_model.dart';

class TasksScreen extends ConsumerStatefulWidget {
  const TasksScreen({super.key});

  @override
  ConsumerState<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends ConsumerState<TasksScreen> {
  final _search = TextEditingController();
  Timer? _debounce;
  String _quickFilter = 'all';

  @override
  void dispose() {
    _debounce?.cancel();
    _search.dispose();
    super.dispose();
  }

  void _setQuickFilter(String value) {
    setState(() => _quickFilter = value);
  }

  List<TaskModel> _visibleTasks(List<TaskModel> tasks) {
    switch (_quickFilter) {
      case 'active':
        return tasks
            .where((task) => task.status.toLowerCase() != 'done')
            .toList(growable: false);
      case 'high':
        return tasks
            .where((task) =>
                task.priority.toLowerCase() == 'high' ||
                task.priority.toLowerCase() == 'urgent')
            .toList(growable: false);
      case 'work':
        return tasks
            .where((task) => task.category.toLowerCase() == 'work')
            .toList(growable: false);
      case 'done':
        return tasks
            .where((task) => task.status.toLowerCase() == 'done')
            .toList(growable: false);
      case 'all':
      default:
        return tasks;
    }
  }

  Widget _actionChip(
    BuildContext context, {
    required String label,
    required IconData icon,
    required Color backgroundColor,
    required Color borderColor,
    required Color textColor,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        splashColor: textColor.withValues(alpha: 0.1),
        highlightColor: textColor.withValues(alpha: 0.05),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
          decoration: BoxDecoration(
            color: backgroundColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: borderColor, width: 1.2),
            boxShadow: backgroundColor != Colors.transparent
                ? [
                    BoxShadow(
                      color: backgroundColor.withValues(alpha: 0.2),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              Icon(icon, size: 16, color: textColor),
              const SizedBox(width: 7),
              Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: textColor,
                  letterSpacing: -0.2,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _filterPill(
    BuildContext context, {
    required String label,
    required String value,
    required bool active,
    required VoidCallback onTap,
  }) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: onTap,
        splashColor: AppSemanticColors.accentDim.withValues(alpha: 0.2),
        highlightColor: AppSemanticColors.accentDim.withValues(alpha: 0.1),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
          decoration: BoxDecoration(
            color: active
                ? AppSemanticColors.accentDim.withValues(alpha: 0.9)
                : tokens.bgSurface,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: active ? AppSemanticColors.accentGlow : tokens.borderSubtle,
              width: active ? 1.3 : 1,
            ),
            boxShadow: active
                ? [
                    BoxShadow(
                      color: AppSemanticColors.accentGlow.withValues(alpha: 0.15),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Text(
            value,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: active ? AppSemanticColors.accentDark : tokens.textSecondary,
              letterSpacing: -0.2,
            ),
          ),
        ),
      ),
    );
  }

  void _showQuickMenu(BuildContext context, WidgetRef ref, TaskModel task) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    showModalBottomSheet(
      context: context,
      backgroundColor: tokens.bgSurface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 36,
                height: 4,
                margin: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: tokens.borderMedium,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      task.title,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: tokens.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 5),
                    Row(children: [
                      TfBadge.priority(task.priority),
                      const SizedBox(width: 6),
                      TfBadge(label: task.category),
                    ]),
                  ],
                ),
              ),
              Divider(height: 1, color: tokens.borderSubtle),
              ListTile(
                leading: Container(
                  width: 30,
                  height: 30,
                  decoration: BoxDecoration(
                    color: AppSemanticColors.sky.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(Icons.calendar_today_rounded,
                      size: 15, color: AppSemanticColors.sky),
                ),
                title: Text('Reschedule',
                    style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: tokens.textPrimary)),
                trailing: Text(
                  task.deadline != null
                      ? DateFormat('MMM d').format(task.deadline!)
                      : 'No deadline',
                  style: TextStyle(fontSize: 12, color: tokens.textMuted),
                ),
                onTap: () async {
                  Navigator.pop(ctx);
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: task.deadline ?? DateTime.now(),
                    firstDate: DateTime.now(),
                    lastDate: DateTime.now().add(const Duration(days: 365)),
                  );
                  if (picked != null) {
                    ref.read(tasksProvider.notifier).updateTask(
                          task.id,
                          {'deadline': picked.toIso8601String()},
                        );
                  }
                },
              ),
              ListTile(
                leading: Container(
                  width: 30,
                  height: 30,
                  decoration: BoxDecoration(
                    color: AppColorsShared.accentDim,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(Icons.flag_rounded,
                      size: 15, color: AppColorsShared.accent),
                ),
                title: Text('Change priority',
                    style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: tokens.textPrimary)),
                trailing: Text(task.priority,
                    style: TextStyle(fontSize: 12, color: tokens.textMuted)),
                onTap: () {
                  Navigator.pop(ctx);
                  _showPriorityPicker(context, ref, task);
                },
              ),
              ListTile(
                leading: Container(
                  width: 30,
                  height: 30,
                  decoration: BoxDecoration(
                    color: AppSemanticColors.sage.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(Icons.my_location_rounded,
                      size: 15, color: AppSemanticColors.sage),
                ),
                title: Text('Start focus on this task',
                    style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: tokens.textPrimary)),
                onTap: () {
                  Navigator.pop(ctx);
                  context.go('/focus', extra: {
                    'taskId': task.id,
                    'taskTitle': task.title,
                    'taskPriority': task.priority,
                  });
                },
              ),
              Divider(height: 1, color: tokens.borderSubtle),
              ListTile(
                leading: Container(
                  width: 30,
                  height: 30,
                  decoration: BoxDecoration(
                    color: AppSemanticColors.rose.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(Icons.delete_outline_rounded,
                      size: 15, color: AppSemanticColors.rose),
                ),
                title: Text('Delete task',
                    style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: AppSemanticColors.rose)),
                onTap: () {
                  Navigator.pop(ctx);
                  ref.read(tasksProvider.notifier).deleteTask(task.id);
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                    content: const Text('Task deleted'),
                    backgroundColor: AppSemanticColors.rose,
                    duration: const Duration(seconds: 2),
                    behavior: SnackBarBehavior.floating,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ));
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showPriorityPicker(
      BuildContext context, WidgetRef ref, TaskModel task) {
    final priorities = ['low', 'medium', 'high', 'urgent'];
    showModalBottomSheet(
      context: context,
      backgroundColor:
          Theme.of(context).extension<AppColorTokens>()!.bgSurface,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 36,
              height: 4,
              margin: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: Theme.of(context).extension<AppColorTokens>()!.borderMedium,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            ...priorities.map((p) => ListTile(
                  leading: TfBadge.priority(p),
                  title: Text(
                    p[0].toUpperCase() + p.substring(1),
                    style: const TextStyle(
                        fontSize: 14, fontWeight: FontWeight.w500),
                  ),
                  trailing: task.priority.toLowerCase() == p
                      ? Icon(Icons.check_rounded,
                          color: AppSemanticColors.sage)
                      : null,
                  onTap: () {
                    Navigator.pop(ctx);
                    ref
                        .read(tasksProvider.notifier)
                        .updateTask(task.id, {'priority': p});
                  },
                )),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(tasksProvider);

    return Scaffold(
      body: GradientBackground(
        child: state.when(
          data: (data) => RefreshIndicator(
            onRefresh: () => ref.read(tasksProvider.notifier).loadTasks(),
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: <Widget>[
                SliverToBoxAdapter(
                  child: TfPageHeader(
                    title: 'All Tasks',
                    subtitle:
                        '${data.tasks.where((t) => t.status.toLowerCase() != 'done').length} active · '
                        '${data.tasks.where((t) => t.status.toLowerCase() == 'done').length} completed',
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 14),
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      physics: const BouncingScrollPhysics(),
                      child: Row(
                        children: <Widget>[
                          _actionChip(
                            context,
                            label: 'AI Prioritize',
                            icon: Icons.auto_awesome_rounded,
                            backgroundColor: AppSemanticColors.accentDim,
                            borderColor: AppSemanticColors.primary,
                            textColor: AppSemanticColors.primary,
                            onTap: () =>
                                ref.read(tasksProvider.notifier).aiPrioritize(),
                          ),
                          const SizedBox(width: 10),
                          _actionChip(
                            context,
                            label: 'Detect Risks',
                            icon: Icons.warning_amber_rounded,
                            backgroundColor: Theme.of(context)
                                .extension<AppColorTokens>()!
                                .bgSurface,
                            borderColor: Theme.of(context)
                                .extension<AppColorTokens>()!
                                .borderMedium,
                            textColor: Theme.of(context)
                                .extension<AppColorTokens>()!
                                .textSecondary,
                            onTap: () =>
                                ref.read(tasksProvider.notifier).detectRisks(),
                          ),
                          const SizedBox(width: 10),
                          _actionChip(
                            context,
                            label: 'New Task',
                            icon: Icons.add_rounded,
                            backgroundColor: AppSemanticColors.primary,
                            borderColor: AppSemanticColors.primary,
                            textColor: Colors.white,
                            onTap: () => showModalBottomSheet<void>(
                              context: context,
                              isScrollControlled: true,
                              backgroundColor: Colors.transparent,
                              builder: (_) => const CreateTaskSheet(),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: Theme.of(context)
                            .extension<AppColorTokens>()!
                            .bgSurface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: Theme.of(context)
                              .extension<AppColorTokens>()!
                              .borderSubtle,
                          width: 1.2,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.06),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        children: <Widget>[
                          Icon(
                            Icons.search_rounded,
                            size: 16,
                            color: Theme.of(context)
                                .extension<AppColorTokens>()!
                                .textSecondary,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: TextField(
                              controller: _search,
                              onChanged: (v) {
                                _debounce?.cancel();
                                _debounce = Timer(
                                    const Duration(milliseconds: 400), () {
                                  ref
                                      .read(tasksProvider.notifier)
                                      .setFilter('searchQuery', v);
                                });
                              },
                              style: TextStyle(
                                fontSize: 14,
                                color: Theme.of(context)
                                    .extension<AppColorTokens>()!
                                    .textPrimary,
                                fontWeight: FontWeight.w500,
                              ),
                              decoration: InputDecoration(
                                isDense: true,
                                border: InputBorder.none,
                                hintText: 'Search tasks...',
                                hintStyle: TextStyle(
                                  fontSize: 14,
                                  color: Theme.of(context)
                                      .extension<AppColorTokens>()!
                                      .textSecondary,
                                  fontWeight: FontWeight.w400,
                                ),
                                contentPadding: EdgeInsets.zero,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      physics: const BouncingScrollPhysics(),
                      child: Row(
                        children: <Widget>[
                          _filterPill(context,
                              label: 'all',
                              value: 'All',
                              active: _quickFilter == 'all',
                              onTap: () => _setQuickFilter('all')),
                          const SizedBox(width: 10),
                          _filterPill(context,
                              label: 'active',
                              value: 'Active',
                              active: _quickFilter == 'active',
                              onTap: () => _setQuickFilter('active')),
                          const SizedBox(width: 10),
                          _filterPill(context,
                              label: 'high',
                              value: 'High',
                              active: _quickFilter == 'high',
                              onTap: () => _setQuickFilter('high')),
                          const SizedBox(width: 10),
                          _filterPill(context,
                              label: 'work',
                              value: 'Work',
                              active: _quickFilter == 'work',
                              onTap: () => _setQuickFilter('work')),
                          const SizedBox(width: 10),
                          _filterPill(context,
                              label: 'done',
                              value: 'Done',
                              active: _quickFilter == 'done',
                              onTap: () => _setQuickFilter('done')),
                        ],
                      ),
                    ),
                  ),
                ),
                if (data.riskAlerts != null)
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
                      child: RiskAlertsPanel(risk: data.riskAlerts!),
                    ),
                  ),
                const SliverToBoxAdapter(child: SizedBox(height: 14)),
                SliverToBoxAdapter(
                  child: _TaskSections(
                    tasks: _visibleTasks(data.tasks),
                    onOpenTask: (task) => showModalBottomSheet<void>(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (_) => TaskDetailSheet(task: task),
                    ),
                    onShowQuickMenu: _showQuickMenu,
                  ),
                ),
                const SliverToBoxAdapter(child: SizedBox(height: 120)),
              ],
            ),
          ),
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, _) => Center(child: Text(err.toString())),
        ),
      ),
    );
  }
}

class _TaskSections extends ConsumerWidget {
  const _TaskSections({
    required this.tasks,
    required this.onOpenTask,
    required this.onShowQuickMenu,
  });

  final List<TaskModel> tasks;
  final ValueChanged<TaskModel> onOpenTask;
  final void Function(BuildContext, WidgetRef, TaskModel) onShowQuickMenu;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activeTasks = tasks
        .where((t) => t.status.toLowerCase() != 'done')
        .toList(growable: false);
    final completedTasks = tasks
        .where((t) => t.status.toLowerCase() == 'done')
        .toList(growable: false);

    if (tasks.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 40),
        child: Center(
          child: Column(
            children: <Widget>[
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppSemanticColors.accentDim.withValues(alpha: 0.3),
                ),
                child: const Icon(
                  Icons.checklist_rounded,
                  size: 36,
                  color: AppSemanticColors.accentGlow,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'No Tasks Found',
                style: Theme.of(context)
                    .textTheme
                    .titleMedium
                    ?.copyWith(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 6),
              Text(
                'Create one with the + New Task button',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context)
                          .extension<AppColorTokens>()
                          ?.textSecondary,
                    ),
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        if (activeTasks.isNotEmpty) ...<Widget>[
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
            child: TfSectionLabel(
                label: 'Active Tasks (${activeTasks.length})'),
          ),
          // ── SwipeableTaskCard replaces Dismissible ──
          ...activeTasks.map(
            (task) => SwipeableTaskCard(
              key: ValueKey(task.id),
              task: task,
              onTap: () => onOpenTask(task),
              onComplete: () {
                ref.read(tasksProvider.notifier).toggleComplete(task);
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                  content: const Text('Task completed'),
                  backgroundColor: AppSemanticColors.sage,
                  duration: const Duration(seconds: 2),
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ));
              },
              onOptions: () => onShowQuickMenu(context, ref, task),
            ),
          ),
        ],
        if (completedTasks.isNotEmpty) ...<Widget>[
          Padding(
            padding: EdgeInsets.fromLTRB(
                16, activeTasks.isNotEmpty ? 16 : 0, 16, 10),
            child: TfSectionLabel(
                label: 'Completed (${completedTasks.length})'),
          ),
          ...completedTasks.map(
            (task) => SwipeableTaskCard(
              key: ValueKey(task.id),
              task: task,
              onTap: () => onOpenTask(task),
              onComplete: () {
                ref.read(tasksProvider.notifier).toggleComplete(task);
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                  content: const Text('Task un-completed'),
                  backgroundColor: AppSemanticColors.sage,
                  duration: const Duration(seconds: 2),
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ));
              },
              onOptions: () => onShowQuickMenu(context, ref, task),
            ),
          ),
        ],
      ],
    );
  }
}