import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../../../core/widgets/gradient_background.dart';
import '../../../../core/widgets/tf_badge.dart';
import '../../../../core/widgets/tf_button.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/tasks_provider.dart';
import '../widgets/risk_alerts_panel.dart';
import '../widgets/swipeable_task_card.dart';
import '../widgets/task_detail_sheet.dart';
import '../models/task_model.dart';

enum _SortOption {
  dueDateAsc,
  dueDateDesc,
  priorityHigh,
  priorityLow,
  aiScore,
  titleAZ,
}

class TasksScreen extends ConsumerStatefulWidget {
  const TasksScreen({super.key});

  @override
  ConsumerState<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends ConsumerState<TasksScreen> {
  final _search = TextEditingController();
  Timer? _debounce;
  String _quickFilter = 'all';
  _SortOption _activeSortOption = _SortOption.aiScore;
  bool _isPrioritizing = false;
  bool _isDetectingRisks = false;
  bool _prioritizeTapped = false;
  bool _risksTapped = false;

  @override
  void dispose() {
    _debounce?.cancel();
    _search.dispose();
    super.dispose();
  }

  void _setQuickFilter(String value) {
    setState(() => _quickFilter = value);
  }

  void _setPrioritizeTapped(bool value) {
    if (!mounted) return;
    setState(() => _prioritizeTapped = value);
  }

  void _setRisksTapped(bool value) {
    if (!mounted) return;
    setState(() => _risksTapped = value);
  }

  Future<void> _handleAiPrioritize() async {
    HapticFeedback.lightImpact();
    setState(() => _isPrioritizing = true);
    try {
      await ref.read(tasksProvider.notifier).aiPrioritize();
    } finally {
      if (mounted) setState(() => _isPrioritizing = false);
    }
  }

  Future<void> _handleDetectRisks() async {
    HapticFeedback.lightImpact();
    setState(() => _isDetectingRisks = true);
    try {
      await ref.read(tasksProvider.notifier).detectRisks();
    } finally {
      if (mounted) setState(() => _isDetectingRisks = false);
    }
  }

  List<TaskModel> _visibleTasks(List<TaskModel> tasks) {
    switch (_quickFilter) {
      case 'active':
        return tasks
            .where((t) => t.status.toLowerCase() != 'done')
            .toList(growable: false);
      case 'high':
        return tasks
            .where((t) =>
                t.priority.toLowerCase() == 'high' ||
                t.priority.toLowerCase() == 'urgent')
            .toList(growable: false);
      case 'work':
        return tasks
            .where((t) => t.category.toLowerCase() == 'work')
            .toList(growable: false);
      case 'shopping':
        return tasks
            .where((t) => t.category.toLowerCase() == 'shopping')
            .toList(growable: false);
      case 'health':
        return tasks
            .where((t) => t.category.toLowerCase() == 'health')
            .toList(growable: false);
      case 'done':
        return tasks
            .where((t) => t.status.toLowerCase() == 'done')
            .toList(growable: false);
      case 'all':
      default:
        return tasks;
    }
  }

  int _priorityRank(String priority) {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 0;
      case 'high':
        return 1;
      case 'medium':
        return 2;
      case 'low':
      default:
        return 3;
    }
  }

  DateTime _deadlineSortValue(TaskModel task) =>
      task.deadline ?? DateTime.fromMillisecondsSinceEpoch(0);

  List<TaskModel> _sortTasks(List<TaskModel> tasks) {
    final sorted = List<TaskModel>.from(tasks);
    sorted.sort((a, b) {
      switch (_activeSortOption) {
        case _SortOption.dueDateAsc:
          return _deadlineSortValue(a).compareTo(_deadlineSortValue(b));
        case _SortOption.dueDateDesc:
          return _deadlineSortValue(b).compareTo(_deadlineSortValue(a));
        case _SortOption.priorityHigh:
          final c = _priorityRank(a.priority).compareTo(_priorityRank(b.priority));
          return c != 0 ? c : a.title.toLowerCase().compareTo(b.title.toLowerCase());
        case _SortOption.priorityLow:
          final c = _priorityRank(b.priority).compareTo(_priorityRank(a.priority));
          return c != 0 ? c : a.title.toLowerCase().compareTo(b.title.toLowerCase());
        case _SortOption.titleAZ:
          return a.title.toLowerCase().compareTo(b.title.toLowerCase());
        case _SortOption.aiScore:
        default:
          final aScore = a.aiPriorityScore ?? -1;
          final bScore = b.aiPriorityScore ?? -1;
          final c = bScore.compareTo(aScore);
          return c != 0 ? c : a.title.toLowerCase().compareTo(b.title.toLowerCase());
      }
    });
    return sorted;
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
          padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 8),
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
              fontWeight: FontWeight.w700,
              color: active
                  ? AppSemanticColors.accentDark
                  : tokens.textSecondary,
              letterSpacing: -0.2,
            ),
          ),
        ),
      ),
    );
  }

  void _showSortSheet(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final options = <({_SortOption option, String label, IconData icon})>[
      (option: _SortOption.aiScore, label: 'AI Score', icon: Icons.auto_awesome_rounded),
      (option: _SortOption.dueDateAsc, label: 'Due Date (Earliest)', icon: Icons.arrow_upward_rounded),
      (option: _SortOption.dueDateDesc, label: 'Due Date (Latest)', icon: Icons.arrow_downward_rounded),
      (option: _SortOption.priorityHigh, label: 'Priority (High → Low)', icon: Icons.arrow_downward_rounded),
      (option: _SortOption.priorityLow, label: 'Priority (Low → High)', icon: Icons.arrow_upward_rounded),
      (option: _SortOption.titleAZ, label: 'Title (A → Z)', icon: Icons.sort_by_alpha_rounded),
    ];

    showModalBottomSheet<void>(
      context: context,
      backgroundColor: tokens.bgSurface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Align(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: tokens.borderSubtle,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Sort by',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                  color: tokens.textPrimary,
                ),
              ),
              const SizedBox(height: 16),
              ...options.asMap().entries.expand((entry) {
                final index = entry.key;
                final item = entry.value;
                final isSelected = _activeSortOption == item.option;
                final row = InkWell(
                  onTap: () {
                    setState(() => _activeSortOption = item.option);
                    Navigator.pop(sheetContext);
                  },
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    child: Row(
                      children: <Widget>[
                        Icon(item.icon,
                            size: 18,
                            color: isSelected
                                ? tokens.accent
                                : tokens.textMuted),
                        const SizedBox(width: 12),
                        Text(
                          item.label,
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: isSelected
                                ? FontWeight.w600
                                : FontWeight.w500,
                            color: tokens.textPrimary,
                          ),
                        ),
                        const Spacer(),
                        if (isSelected)
                          Icon(Icons.check_rounded,
                              size: 18, color: tokens.accent),
                      ],
                    ),
                  ),
                );
                if (index == options.length - 1) return <Widget>[row];
                return <Widget>[
                  row,
                  Divider(
                      height: 1,
                      thickness: 0.5,
                      color: tokens.borderSubtle),
                ];
              }),
            ],
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
                width: 40,
                height: 4,
                margin: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  color: tokens.borderMedium,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      task.title,
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        color: tokens.textPrimary,
                        letterSpacing: -0.3,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(children: [
                      TfBadge.priority(task.priority),
                      const SizedBox(width: 6),
                      TfBadge(label: task.category),
                    ]),
                  ],
                ),
              ),
              Divider(height: 1, color: tokens.borderSubtle),

              // ── Reschedule — uses our custom modern date picker ──
              Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () async {
                    Navigator.pop(ctx);
                    final picked = await showModernDatePicker(
                      context: context,
                      initialDate: task.deadline,
                    );
                    if (picked != null) {
                      ref.read(tasksProvider.notifier).updateTask(
                        task.id,
                        {'deadline': picked.toIso8601String()},
                      );
                    }
                  },
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 14),
                    child: Row(
                      children: [
                        Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: AppSemanticColors.sky
                                .withValues(alpha: 0.10),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.calendar_today_rounded,
                              size: 17, color: AppSemanticColors.sky),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Text(
                            'Reschedule',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: tokens.textPrimary,
                            ),
                          ),
                        ),
                        Text(
                          task.deadline != null
                              ? DateFormat('MMM d').format(task.deadline!)
                              : 'No deadline',
                          style: TextStyle(
                            fontSize: 13,
                            color: tokens.textMuted,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // ── Change priority ──
              Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () {
                    Navigator.pop(ctx);
                    _showPriorityPicker(context, ref, task);
                  },
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 14),
                    child: Row(
                      children: [
                        Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: AppSemanticColors.primary
                                .withValues(alpha: 0.10),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.flag_rounded,
                              size: 17,
                              color: AppSemanticColors.primary),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Text(
                            'Change priority',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: tokens.textPrimary,
                            ),
                          ),
                        ),
                        Text(
                          task.priority,
                          style: TextStyle(
                            fontSize: 13,
                            color: tokens.textMuted,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // ── Start focus ──
              Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () {
                    Navigator.pop(ctx);
                    context.go('/focus', extra: {
                      'taskId': task.id,
                      'taskTitle': task.title,
                      'taskPriority': task.priority,
                    });
                  },
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 14),
                    child: Row(
                      children: [
                        Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: AppSemanticColors.sage
                                .withValues(alpha: 0.10),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.my_location_rounded,
                              size: 17,
                              color: AppSemanticColors.sage),
                        ),
                        const SizedBox(width: 14),
                        Text(
                          'Start focus on this task',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: tokens.textPrimary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              Divider(
                height: 1,
                thickness: 0.5,
                color: tokens.borderSubtle,
                indent: 16,
                endIndent: 16,
              ),

              // ── Delete ──
              Material(
                color: Colors.transparent,
                child: InkWell(
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
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 14),
                    child: Row(
                      children: [
                        Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: AppSemanticColors.rose
                                .withValues(alpha: 0.10),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(
                              Icons.delete_outline_rounded,
                              size: 17,
                              color: AppSemanticColors.rose),
                        ),
                        const SizedBox(width: 14),
                        Text(
                          'Delete task',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: AppSemanticColors.rose,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  void _showPriorityPicker(
      BuildContext context, WidgetRef ref, TaskModel task) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    const priorities = ['low', 'medium', 'high', 'urgent'];
    showModalBottomSheet(
      context: context,
      backgroundColor: tokens.bgSurface,
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
                color: tokens.borderMedium,
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
      body: SafeArea(
        bottom: false,
        child: GradientBackground(
          child: state.when(
            data: (data) {
              final tokens = Theme.of(context).extension<AppColorTokens>()!;
              final activeTasks = data.tasks
                  .where((t) => t.status.toLowerCase() != 'done')
                  .length;
              final completedTasks = data.tasks
                  .where((t) => t.status.toLowerCase() == 'done')
                  .length;

              return RefreshIndicator(
                onRefresh: () =>
                    ref.read(tasksProvider.notifier).loadTasks(),
                child: CustomScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  slivers: <Widget>[
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'All Tasks',
                              style: GoogleFonts.fraunces(
                                fontSize: 34,
                                fontWeight: FontWeight.w700,
                                color: tokens.textPrimary,
                                height: 1.1,
                                letterSpacing: -0.5,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '$activeTasks active · $completedTasks completed',
                              style: GoogleFonts.dmSans(
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                                color: tokens.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // Search + sort
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                        child: Row(
                          children: <Widget>[
                            Expanded(
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 180),
                                curve: Curves.easeOut,
                                height: 48,
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 10),
                                decoration: BoxDecoration(
                                  color: tokens.bgSurface,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                      color: tokens.borderMedium, width: 1),
                                  boxShadow: [
                                    BoxShadow(
                                      color:
                                          Colors.black.withValues(alpha: 0.06),
                                      blurRadius: 14,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 30,
                                      height: 30,
                                      decoration: BoxDecoration(
                                        color: tokens.bgRaised,
                                        borderRadius:
                                            BorderRadius.circular(9),
                                        border: Border.all(
                                            color: tokens.borderSubtle),
                                      ),
                                      child: Icon(Icons.search_rounded,
                                          size: 17,
                                          color: tokens.textSecondary),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: TextField(
                                        controller: _search,
                                        style: TextStyle(
                                          fontSize: 14.5,
                                          color: tokens.textPrimary,
                                          fontWeight: FontWeight.w600,
                                        ),
                                        decoration: InputDecoration(
                                          isDense: true,
                                          border: InputBorder.none,
                                          hintText: 'Search tasks...',
                                          hintStyle: TextStyle(
                                            fontSize: 14,
                                            color: tokens.textMuted,
                                            fontWeight: FontWeight.w400,
                                          ),
                                          contentPadding:
                                              const EdgeInsets.symmetric(
                                                  vertical: 2),
                                        ),
                                        onChanged: (v) {
                                          setState(() {});
                                          _debounce?.cancel();
                                          _debounce = Timer(
                                            const Duration(
                                                milliseconds: 400),
                                            () => ref
                                                .read(tasksProvider.notifier)
                                                .setFilter(
                                                    'searchQuery', v),
                                          );
                                        },
                                      ),
                                    ),
                                    if (_search.text.isNotEmpty)
                                      GestureDetector(
                                        onTap: () {
                                          _search.clear();
                                          ref
                                              .read(tasksProvider.notifier)
                                              .setFilter('searchQuery', '');
                                          setState(() {});
                                        },
                                        child: Container(
                                          width: 24,
                                          height: 24,
                                          decoration: BoxDecoration(
                                            color: tokens.bgRaised,
                                            shape: BoxShape.circle,
                                            border: Border.all(
                                                color: tokens.borderSubtle),
                                          ),
                                          child: Icon(Icons.close_rounded,
                                              size: 14,
                                              color: tokens.textMuted),
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            GestureDetector(
                              onTap: () => _showSortSheet(context),
                              child: Container(
                                width: 48,
                                height: 48,
                                decoration: BoxDecoration(
                                  color: tokens.bgRaised,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                      color: tokens.borderSubtle, width: 1),
                                ),
                                child: Center(
                                  child: Icon(Icons.sort_rounded,
                                      size: 20,
                                      color: tokens.textSecondary),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // Filter pills
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 0, 0, 8),
                        child: SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          physics: const BouncingScrollPhysics(),
                          child: Row(
                            children: [
                              _filterPill(context,
                                  label: 'all',
                                  value: 'All',
                                  active: _quickFilter == 'all',
                                  onTap: () => _setQuickFilter('all')),
                              const SizedBox(width: 8),
                              _filterPill(context,
                                  label: 'active',
                                  value: 'Active',
                                  active: _quickFilter == 'active',
                                  onTap: () => _setQuickFilter('active')),
                              const SizedBox(width: 8),
                              _filterPill(context,
                                  label: 'high',
                                  value: 'High',
                                  active: _quickFilter == 'high',
                                  onTap: () => _setQuickFilter('high')),
                              const SizedBox(width: 8),
                              _filterPill(context,
                                  label: 'work',
                                  value: 'Work',
                                  active: _quickFilter == 'work',
                                  onTap: () => _setQuickFilter('work')),
                              const SizedBox(width: 8),
                              _filterPill(context,
                                  label: 'health',
                                  value: 'Health',
                                  active: _quickFilter == 'health',
                                  onTap: () => _setQuickFilter('health')),
                              const SizedBox(width: 8),
                              _filterPill(context,
                                  label: 'shopping',
                                  value: 'Shopping',
                                  active: _quickFilter == 'shopping',
                                  onTap: () => _setQuickFilter('shopping')),
                              const SizedBox(width: 8),
                              _filterPill(context,
                                  label: 'done',
                                  value: 'Done',
                                  active: _quickFilter == 'done',
                                  onTap: () => _setQuickFilter('done')),
                              const SizedBox(width: 16),
                            ],
                          ),
                        ),
                      ),
                    ),

                    // AI Prioritize + Detect Risks buttons
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                        child: Row(
                          children: <Widget>[
                            Expanded(
                              child: GestureDetector(
                                onTapDown: (_) {
                                  _setPrioritizeTapped(true);
                                  Future.delayed(
                                    const Duration(milliseconds: 150),
                                    () => _setPrioritizeTapped(false),
                                  );
                                },
                                onTapUp: (_) => _setPrioritizeTapped(false),
                                onTapCancel: () =>
                                    _setPrioritizeTapped(false),
                                child: AnimatedScale(
                                  scale: _prioritizeTapped || _isPrioritizing
                                      ? 0.96
                                      : 1.0,
                                  duration: const Duration(milliseconds: 100),
                                  curve: Curves.easeOut,
                                  child: TfButton(
                                    label: 'AI Prioritize',
                                    icon: Icons.auto_awesome_rounded,
                                    variant: TfButtonVariant.accent,
                                    isLoading: _isPrioritizing,
                                    width: double.infinity,
                                    onPressed: _handleAiPrioritize,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: GestureDetector(
                                onTapDown: (_) {
                                  _setRisksTapped(true);
                                  Future.delayed(
                                    const Duration(milliseconds: 150),
                                    () => _setRisksTapped(false),
                                  );
                                },
                                onTapUp: (_) => _setRisksTapped(false),
                                onTapCancel: () => _setRisksTapped(false),
                                child: AnimatedScale(
                                  scale: _risksTapped || _isDetectingRisks
                                      ? 0.96
                                      : 1.0,
                                  duration: const Duration(milliseconds: 100),
                                  curve: Curves.easeOut,
                                  child: TfButton(
                                    label: 'Detect Risks',
                                    icon: Icons.warning_amber_rounded,
                                    variant: TfButtonVariant.danger,
                                    isLoading: _isDetectingRisks,
                                    width: double.infinity,
                                    onPressed: _handleDetectRisks,
                                  ),
                                ),
                              ),
                            ),
                          ],
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
                        tasks: _sortTasks(_visibleTasks(data.tasks)),
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
              );
            },
            loading: () =>
                const Center(child: CircularProgressIndicator()),
            error: (err, _) => Center(child: Text(err.toString())),
          ),
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
                  color:
                      AppSemanticColors.accentDim.withValues(alpha: 0.3),
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
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
            child: Text(
              'ACTIVE TASKS (${activeTasks.length})',
              style: GoogleFonts.dmSans(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.8,
                color: Theme.of(context)
                    .extension<AppColorTokens>()!
                    .textMuted,
              ),
            ),
          ),
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
                16, activeTasks.isNotEmpty ? 16 : 4, 16, 8),
            child: Text(
              'COMPLETED (${completedTasks.length})',
              style: GoogleFonts.dmSans(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.8,
                color: Theme.of(context)
                    .extension<AppColorTokens>()!
                    .textMuted,
              ),
            ),
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