import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/dashboard_provider.dart';
import '../../../../services/task_service.dart';

class DailyPlanSection extends ConsumerStatefulWidget {
  const DailyPlanSection({
    super.key,
    required this.plan,
    required this.onGenerate,
    this.onDelete,
  });

  final Map<String, dynamic>? plan;
  final VoidCallback onGenerate;
  final VoidCallback? onDelete;

  @override
  ConsumerState<DailyPlanSection> createState() => _DailyPlanSectionState();
}

class _DailyPlanSectionState extends ConsumerState<DailyPlanSection> {
  final Set<String> _expandedScheduleKeys = <String>{};
  final TaskService _taskService = TaskService();
  Map<String, dynamic>? _planMutable;

  Future<void> _handleToggleTaskCompletion(dynamic item) async {
    final taskId = '${item['task_id'] ?? ''}'.trim();
    if (taskId.isEmpty) return;

    final status = '${item['task_status'] ?? ''}'.toLowerCase();
    final newStatus = (status == 'done' || status == 'completed' || status == 'complete') ? 'todo' : 'done';

    // Optimistic update: toggle task status locally first
    final oldStatus = item['task_status'];
    item['task_status'] = newStatus;
    setState(() {
      // trigger UI rebuild
    });

    try {
      final resp = await _taskService.updateTask(taskId, <String, dynamic>{'status': newStatus});
      // ignore: avoid_print
      print('DAILY PLAN: updateTask response for $taskId -> $resp');
      // Success: keep the local state
    } catch (e) {
      // Revert on error
      item['task_status'] = oldStatus;
      setState(() {});
      // ignore: avoid_print
      print('DAILY PLAN: Failed to update task status: $e');
    }
  }

  Future<void> _handleToggleSubtask(dynamic item, int subtaskIndex) async {
    final taskId = '${item['task_id'] ?? ''}'.trim();
    if (taskId.isEmpty) return;

    final subtasks = (item['subtasks'] as List?) ?? const <dynamic>[];
    if (subtaskIndex < 0 || subtaskIndex >= subtasks.length) return;

    final subtask = subtasks[subtaskIndex];
    if (subtask is! Map) return;

    final subtaskId = '${subtask['_id'] ?? subtask['id'] ?? ''}'.trim();
    if (subtaskId.isEmpty) return;

    // Optimistic update: toggle subtask locally first
    final oldCompleted = subtask['completed'];
    final newCompleted = oldCompleted != true;
    subtask['completed'] = newCompleted;
    setState(() {
      // trigger UI rebuild
    });

    try {
      final resp = await _taskService.toggleSubtask(taskId, subtaskId);
      // ignore: avoid_print
      print('DAILY PLAN: toggleSubtask response for $taskId/$subtaskId -> $resp');
      // Success: keep the local state
    } catch (e) {
      // Revert on error
      subtask['completed'] = oldCompleted;
      setState(() {});
      // ignore: avoid_print
      print('DAILY PLAN: Failed to toggle subtask: $e');
    }
  }

  @override
  void initState() {
    super.initState();
    _syncMutablePlan();
  }

  @override
  void didUpdateWidget(DailyPlanSection oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.plan != oldWidget.plan) {
      _syncMutablePlan();
    }
  }

  void _syncMutablePlan() {
    if (widget.plan == null) {
      _planMutable = null;
      return;
    }

    final copy = Map<String, dynamic>.from(widget.plan!);
    final scheduleRaw = (widget.plan!['schedule'] as List?) ?? <dynamic>[];
    copy['schedule'] = scheduleRaw
        .map((e) => e is Map ? Map<String, dynamic>.from(e) : <String, dynamic>{})
        .toList();
    _planMutable = copy;
  }

  Future<void> _loadTaskDetailsForKey(String itemKey) async {
    final schedule = (_planMutable?['schedule'] as List?) ?? (widget.plan?['schedule'] as List?) ?? const <dynamic>[];
    for (var i = 0; i < schedule.length; i++) {
      final item = schedule[i] is Map ? Map<String, dynamic>.from(schedule[i]) : null;
      if (item == null) continue;
      final key = _scheduleItemKey(item);
      if (key != itemKey) continue;

      var taskId = '${item['task_id'] ?? ''}'.trim();

      // If no task_id present, try to resolve from provider tasks by title match
      if (taskId.isEmpty) {
        final providerState = ref.read(dashboardProvider);
        final tasksList = providerState.valueOrNull?.tasks ?? <Map<String, dynamic>>[];
        final titleCandidate = '${item['title'] ?? ''}'.trim().toLowerCase();
        if (titleCandidate.isNotEmpty) {
          for (final t in tasksList) {
            final tTitle = '${t['title'] ?? ''}'.trim().toLowerCase();
            if (tTitle.isNotEmpty && tTitle == titleCandidate) {
              taskId = '${t['_id'] ?? t['id'] ?? ''}';
              // persist for subsequent calls
              schedule[i]['task_id'] = taskId;
              // ignore: avoid_print
              print('DAILY PLAN: resolved missing task_id for "$titleCandidate" -> $taskId');
              break;
            }
          }
        }
      }

      if (taskId.isEmpty) {
        // nothing to fetch
        // ignore: avoid_print
        print('DAILY PLAN: no task_id for expanded item $itemKey; cannot fetch details');
        return;
      }

      // ignore: avoid_print
      print('DAILY PLAN: expanding itemKey=$itemKey resolvedTaskId=$taskId');

      try {
        final full = await _taskService.getTask(taskId);
        // ignore: avoid_print
        print('DAILY PLAN: fetched task $taskId -> $full');
        if (full != null) {
          // API returns { task: { ... } }, unwrap it
          final taskData = (full['task'] is Map ? Map<String, dynamic>.from(full['task'] as Map) : full);
          // ignore: avoid_print
          print('DAILY PLAN: unwrapped taskData keys: ${taskData.keys.toList()}');

          final subtasksRaw = taskData['subtasks'];
          // ignore: avoid_print
          print('DAILY PLAN: subtasksRaw=$subtasksRaw (type=${subtasksRaw.runtimeType})');
          if (subtasksRaw is List && subtasksRaw.isNotEmpty) {
            final normalized = <Map<String, dynamic>>[];
            for (final s in subtasksRaw) {
              if (s is Map) normalized.add(Map<String, dynamic>.from(s));
              else if (s is String) normalized.add({'title': s, 'completed': false});
              else normalized.add({'title': s?.toString() ?? '', 'completed': false});
            }
            // ignore: avoid_print
            print('DAILY PLAN: normalized ${normalized.length} subtasks');
            setState(() {
              schedule[i]['subtasks'] = normalized;
            });
          }

          // attach deadline if missing
          final deadlineRaw = taskData['deadline'] ?? taskData['dueDate'] ?? taskData['due_date'] ?? taskData['deadline_at'];
          // ignore: avoid_print
          print('DAILY PLAN: deadlineRaw=$deadlineRaw');
          if ((item['deadline_label'] == null || (item['deadline_label'] as String).isEmpty) && deadlineRaw != null) {
            final deadlineText = deadlineRaw.toString();
            final parsed = DateTime.tryParse(deadlineText) ?? (int.tryParse(deadlineText) != null ? DateTime.fromMillisecondsSinceEpoch(int.parse(deadlineText) > 100000000000 ? int.parse(deadlineText) : int.parse(deadlineText) * 1000) : null);
            if (parsed != null) {
              setState(() {
                schedule[i]['deadline'] = deadlineText;
                schedule[i]['deadline_label'] = DateFormat('MMM d, yyyy').format(parsed.toLocal());
              });
            }
          }
        }
      } catch (e) {
        // ignore errors
        // ignore: avoid_print
        print('DAILY PLAN: failed loading task $taskId -> $e');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final hasPlan = widget.plan != null;
    final planTitle = _planTitle(widget.plan);
    final planStatusLabel = _planStatusLabel(widget.plan);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(2),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: <Color>[
            AppSemanticColors.sage,
            AppSemanticColors.primary,
            AppSemanticColors.rose,
          ],
        ),
        borderRadius: BorderRadius.circular(22),
        boxShadow: <BoxShadow>[
          BoxShadow(
            color: AppSemanticColors.primary.withValues(alpha: 0.12),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: tokens.bgSurface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: tokens.borderSubtle),
        ),
        child: hasPlan
            ? _buildActivePlan(context, tokens, planTitle, planStatusLabel)
            : _buildEmptyPlan(context, tokens, planTitle),
      ),
    );
  }

  Widget _buildEmptyPlan(
    BuildContext context,
    AppColorTokens tokens,
    String planTitle,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Center(
          child: Column(
            children: <Widget>[
              Container(
                width: 58,
                height: 58,
                decoration: BoxDecoration(
                  color: AppSemanticColors.primary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: AppSemanticColors.primary.withValues(alpha: 0.24),
                  ),
                ),
                child: const Icon(
                  Icons.auto_awesome_rounded,
                  color: AppSemanticColors.primary,
                  size: 28,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                planTitle,
                style: AppTextStyles.titleLarge.copyWith(
                  color: tokens.textPrimary,
                  fontSize: 22,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'No AI plan is ready yet.',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: tokens.textSecondary,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: <Color>[
                  AppSemanticColors.primary,
                  AppSemanticColors.primary.withValues(alpha: 0.82),
                ],
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                borderRadius: BorderRadius.circular(16),
                onTap: widget.onGenerate,
                child: Center(
                  child: Text(
                    'Generate Today\'s Plan',
                    style: AppTextStyles.bodyMedium.copyWith(
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                      color: tokens.bgSurface,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildActivePlan(
    BuildContext context,
    AppColorTokens tokens,
    String planTitle,
    String planStatusLabel,
  ) {
    final plan = _planMutable ?? widget.plan!;
    final schedule = (plan['schedule'] as List? ?? const <dynamic>[]);
    final scheduleSurface = Theme.of(context).brightness == Brightness.dark
        ? tokens.bgRaised
        : AppColorsLight.bgRaised;
    final focusTask =
        '${plan['focus_task_title'] ?? plan['focus_task'] ?? 'No focus task selected'}';
    final advice =
        '${plan['advice'] ?? 'Stay focused on your high-priority tasks and minimize distractions.'}';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Row(
          children: <Widget>[
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    planTitle,
                    style: AppTextStyles.titleLarge.copyWith(
                      color: tokens.textPrimary,
                      fontSize: 22,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Your AI-generated day plan',
                    style: AppTextStyles.bodySmall.copyWith(
                      color: tokens.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              crossAxisAlignment: WrapCrossAlignment.center,
              alignment: WrapAlignment.end,
              children: <Widget>[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                  decoration: BoxDecoration(
                    color: AppSemanticColors.sage.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    planStatusLabel,
                    style: AppTextStyles.labelSmall.copyWith(
                      color: AppSemanticColors.sage,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                if (widget.onDelete != null)
                  InkWell(
                    onTap: widget.onDelete,
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        color: AppSemanticColors.rose.withValues(alpha: 0.10),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: AppSemanticColors.rose.withValues(alpha: 0.28),
                        ),
                      ),
                      child: const Icon(
                        Icons.delete_outline_rounded,
                        color: AppSemanticColors.rose,
                        size: 18,
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 16),
        LayoutBuilder(
          builder: (context, constraints) {
            final shouldStack = constraints.maxWidth < 420;

            if (shouldStack) {
              return Column(
                children: <Widget>[
                  _InfoBlock(
                    icon: Icons.list_alt_rounded,
                    title: 'Focus task',
                    text: focusTask,
                    accentColor: AppSemanticColors.primary,
                    backgroundColor: AppSemanticColors.primary.withValues(alpha: 0.08),
                    borderColor: AppSemanticColors.primary.withValues(alpha: 0.30),
                    textColor: tokens.textPrimary,
                  ),
                  const SizedBox(height: 12),
                  _InfoBlock(
                    icon: Icons.wb_sunny_rounded,
                    title: 'Advice',
                    text: advice,
                    accentColor: AppSemanticColors.primary,
                    backgroundColor: AppSemanticColors.primary.withValues(alpha: 0.08),
                    borderColor: AppSemanticColors.primary.withValues(alpha: 0.30),
                    textColor: tokens.textPrimary,
                  ),
                ],
              );
            }

            return Row(
              children: <Widget>[
                Expanded(
                  child: _InfoBlock(
                    icon: Icons.list_alt_rounded,
                    title: 'Focus task',
                    text: focusTask,
                    accentColor: AppSemanticColors.primary,
                    backgroundColor: AppSemanticColors.primary.withValues(alpha: 0.08),
                    borderColor: AppSemanticColors.primary.withValues(alpha: 0.30),
                    textColor: tokens.textPrimary,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _InfoBlock(
                    icon: Icons.wb_sunny_rounded,
                    title: 'Advice',
                    text: advice,
                    accentColor: AppSemanticColors.primary,
                    backgroundColor: AppSemanticColors.primary.withValues(alpha: 0.08),
                    borderColor: AppSemanticColors.primary.withValues(alpha: 0.30),
                    textColor: tokens.textPrimary,
                  ),
                ),
              ],
            );
          },
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: scheduleSurface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: tokens.borderSubtle),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(
                'Schedule',
                style: AppTextStyles.bodyMedium.copyWith(
                  fontWeight: FontWeight.w700,
                  color: tokens.textPrimary,
                  fontSize: 15,
                ),
              ),
              const SizedBox(height: 12),
              if (schedule.isEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: Text(
                    'No schedule saved.',
                    style: AppTextStyles.bodySmall.copyWith(
                      color: tokens.textMuted,
                    ),
                  ),
                )
              else
                ...schedule.take(5).map(
                      (item) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _ScheduleRow(
                          item: item,
                          expanded: _expandedScheduleKeys.contains(_scheduleItemKey(item)),
                          onToggleExpanded: _toggleExpanded,
                          onToggleCompleted: _handleToggleTaskCompletion,
                          onSubtaskToggle: (subtaskIndex) => _handleToggleSubtask(item, subtaskIndex),
                        ),
                      ),
                    ),
            ],
          ),
        ),
      ],
    );
  }

  void _toggleExpanded(String itemKey) {
    setState(() {
      if (_expandedScheduleKeys.contains(itemKey)) {
        _expandedScheduleKeys.remove(itemKey);
      } else {
        _expandedScheduleKeys.add(itemKey);
        // attempt to load subtasks for the expanded item
        _loadTaskDetailsForKey(itemKey);
      }
    });
  }

  String _scheduleItemKey(dynamic item) {
    final title = '${item['title'] ?? item['task_id'] ?? 'Untitled task'}';
    final start = '${item['suggested_start'] ?? '--:--'}';
    return '${item['task_id'] ?? ''}-$title-$start';
  }

  String _planTitle(Map<String, dynamic>? plan) {
    if (plan == null) {
      return 'Today\'s Plan';
    }

    final planningScope = '${plan['planning_scope'] ?? ''}'.toLowerCase();
    if (planningScope == 'tomorrow') {
      return 'Tomorrow\'s Plan';
    }

    final targetDate = '${plan['target_date'] ?? ''}'.trim();
    final targetDateValue = DateTime.tryParse(targetDate);
    if (targetDateValue != null) {
      final tomorrow = DateTime.now().add(const Duration(days: 1));
      if (targetDateValue.year == tomorrow.year &&
          targetDateValue.month == tomorrow.month &&
          targetDateValue.day == tomorrow.day) {
        return 'Tomorrow\'s Plan';
      }
    }

    return 'Today\'s Plan';
  }

  String _planStatusLabel(Map<String, dynamic>? plan) {
    if (plan == null) {
      return 'ACTIVE TODAY';
    }

    final planningScope = '${plan['planning_scope'] ?? ''}'.toLowerCase();
    if (planningScope == 'tomorrow') {
      return 'STARTS TOMORROW';
    }

    final targetDate = '${plan['target_date'] ?? ''}'.trim();
    final targetDateValue = DateTime.tryParse(targetDate);
    if (targetDateValue != null) {
      final tomorrow = DateTime.now().add(const Duration(days: 1));
      if (targetDateValue.year == tomorrow.year &&
          targetDateValue.month == tomorrow.month &&
          targetDateValue.day == tomorrow.day) {
        return 'STARTS TOMORROW';
      }
    }

    return 'ACTIVE TODAY';
  }
}

class _InfoBlock extends StatelessWidget {
  const _InfoBlock({
    required this.icon,
    required this.title,
    required this.text,
    required this.accentColor,
    required this.backgroundColor,
    required this.borderColor,
    required this.textColor,
  });

  final IconData icon;
  final String title;
  final String text;
  final Color accentColor;
  final Color backgroundColor;
  final Color borderColor;
  final Color textColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: accentColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(9),
                ),
                child: Icon(icon, size: 16, color: accentColor),
              ),
              const SizedBox(width: 8),
              Text(
                title.toUpperCase(),
                style: AppTextStyles.labelSmall.copyWith(
                  color: accentColor,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.6,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            text,
            maxLines: 4,
            overflow: TextOverflow.ellipsis,
            style: AppTextStyles.bodyMedium.copyWith(
              fontWeight: FontWeight.w600,
              color: textColor,
              height: 1.45,
            ),
          ),
        ],
      ),
    );
  }
}

class _ScheduleRow extends StatelessWidget {
  const _ScheduleRow({
    required this.item,
    required this.expanded,
    required this.onToggleExpanded,
    required this.onToggleCompleted,
    required this.onSubtaskToggle,
  });

  final dynamic item;
  final bool expanded;
  final ValueChanged<String> onToggleExpanded;
  final ValueChanged<dynamic> onToggleCompleted;
  final ValueChanged<int> onSubtaskToggle;

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final title = '${item['title'] ?? item['task_id'] ?? 'Untitled task'}';
    final start = '${item['suggested_start'] ?? '--:--'}';
    final estimated = item['estimated_duration'];
    final duration = estimated is num ? '${estimated.toStringAsFixed(0)}h' : '';
    final deadlineLabel = '${item['deadline_label'] ?? ''}'.trim();
    final parsed = deadlineLabel.isNotEmpty ? null : DateTime.tryParse('${item['deadline'] ?? ''}');
    final status = '${item['task_status'] ?? ''}'.toLowerCase();
    final subtasksRaw = (item['subtasks'] as List? ?? const <dynamic>[]);
    final subtasks = <Map<String, dynamic>>[];
    for (final s in subtasksRaw) {
      if (s is Map) subtasks.add(Map<String, dynamic>.from(s));
    }
    final completedSubtasks = subtasks.where((subtask) => subtask['completed'] == true).length;
    final hasSubtasks = subtasks.isNotEmpty;
    final isCompleted = status == 'done' || status == 'completed' || status == 'complete';
    final itemKey = '${item['task_id'] ?? ''}-$title-$start';

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isCompleted ? AppSemanticColors.sage.withValues(alpha: 0.08) : tokens.bgSurface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isCompleted ? AppSemanticColors.sage.withValues(alpha: 0.30) : tokens.borderSubtle,
        ),
      ),
      child: Column(
        children: <Widget>[
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              InkWell(
                onTap: () => onToggleCompleted(item),
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  width: 22,
                  height: 22,
                  margin: const EdgeInsets.only(top: 2),
                  decoration: BoxDecoration(
                    color: isCompleted ? AppSemanticColors.sage.withValues(alpha: 0.18) : Colors.transparent,
                    borderRadius: BorderRadius.circular(7),
                    border: Border.all(
                      color: isCompleted ? AppSemanticColors.sage.withValues(alpha: 0.70) : AppSemanticColors.primary.withValues(alpha: 0.55),
                      width: 1.6,
                    ),
                  ),
                  child: Icon(
                    Icons.check_rounded,
                    size: 14,
                    color: isCompleted ? AppSemanticColors.sage : Colors.transparent,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTextStyles.bodyMedium.copyWith(
                        fontWeight: FontWeight.w700,
                        color: isCompleted ? tokens.textSecondary : tokens.textPrimary,
                        decoration: isCompleted ? TextDecoration.lineThrough : TextDecoration.none,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      duration.isEmpty
                          ? (deadlineLabel.isNotEmpty
                              ? deadlineLabel
                              : (parsed == null ? 'No deadline' : DateFormat('MMM d').format(parsed)))
                          : duration,
                      style: AppTextStyles.bodySmall.copyWith(
                        color: tokens.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              TextButton(
                onPressed: () => onToggleExpanded(itemKey),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  foregroundColor: AppSemanticColors.primary,
                  backgroundColor: AppSemanticColors.primary.withValues(alpha: 0.08),
                  disabledForegroundColor: AppSemanticColors.primary.withValues(alpha: 0.45),
                  disabledBackgroundColor: AppSemanticColors.primary.withValues(alpha: 0.05),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                    side: BorderSide(color: AppSemanticColors.primary.withValues(alpha: 0.22)),
                  ),
                  textStyle: AppTextStyles.labelSmall.copyWith(fontWeight: FontWeight.w700),
                ),
                child: Text(expanded ? 'Hide subtasks' : 'Show subtasks'),
              ),
              const SizedBox(width: 10),
              Text(
                start,
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppSemanticColors.primary,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
          if (hasSubtasks && expanded) ...<Widget>[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: tokens.bgRaised,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: tokens.borderSubtle),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: <Widget>[
                      Text(
                        'Subtasks',
                        style: AppTextStyles.bodySmall.copyWith(
                          color: tokens.textSecondary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        '$completedSubtasks/${subtasks.length}',
                        style: AppTextStyles.bodySmall.copyWith(
                          color: tokens.textSecondary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(999),
                    child: LinearProgressIndicator(
                      minHeight: 6,
                      value: subtasks.isEmpty ? 0 : completedSubtasks / subtasks.length,
                      backgroundColor: tokens.borderSubtle,
                      valueColor: const AlwaysStoppedAnimation<Color>(AppSemanticColors.primary),
                    ),
                  ),
                  const SizedBox(height: 10),
                  ...subtasks.asMap().entries.map((entry) {
                    final subtaskIndex = entry.key;
                    final subtask = entry.value;
                    final subtaskCompleted = subtask['completed'] == true;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: InkWell(
                        onTap: () => onSubtaskToggle(subtaskIndex),
                        child: Row(
                          children: <Widget>[
                            Icon(
                              subtaskCompleted ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                              size: 16,
                              color: subtaskCompleted ? AppSemanticColors.sage : tokens.textMuted,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                '${subtask['title'] ?? 'Untitled subtask'}',
                                style: AppTextStyles.bodySmall.copyWith(
                                  color: subtaskCompleted ? tokens.textSecondary : tokens.textPrimary,
                                  decoration: subtaskCompleted ? TextDecoration.lineThrough : TextDecoration.none,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
