import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:percent_indicator/circular_percent_indicator.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/gradient_background.dart';
import '../../tasks/models/task_model.dart';
import '../../tasks/providers/tasks_provider.dart';
import '../providers/focus_provider.dart';

class FocusScreen extends ConsumerWidget {
  const FocusScreen({super.key});

  static const List<String> _quotes = <String>[
    'Consistency compounds faster than intensity.',
    'One task at a time.',
    'Progress over perfection.',
  ];

  String _formatDuration(int seconds) {
    final hours = seconds ~/ 3600;
    final minutes = (seconds % 3600) ~/ 60;
    final remainingSeconds = seconds % 60;
    if (hours > 0) {
      return '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${remainingSeconds.toString().padLeft(2, '0')}';
    }
    return '${minutes.toString().padLeft(2, '0')}:${remainingSeconds.toString().padLeft(2, '0')}';
  }

  Map<String, dynamic> _taskSelection(TaskModel task) {
    return <String, dynamic>{
      'id': task.id,
      'title': task.title,
      'priority': task.priority,
      'deadline': task.deadline?.toIso8601String(),
    };
  }

  String? _taskId(Map? task) => task?['id']?.toString();

  String _formatTaskDueDate(TaskModel task) {
    final deadline = task.deadline;
    if (deadline == null) return '';
    return DateFormat('MMM d, yyyy').format(deadline);
  }

  double _progressFor(FocusState state) {
    if (state.technique == FocusTechnique.simpleTimer) {
      return ((state.elapsedSeconds % 3600) / 3600).clamp(0.0, 1.0).toDouble();
    }
    if (state.pomodoroPhase == PomodoroPhase.breakTime) {
      return (1 - (state.pomodoroSecondsLeft / 300)).clamp(0.0, 1.0).toDouble();
    }
    return (1 - (state.pomodoroSecondsLeft / 1500)).clamp(0.0, 1.0).toDouble();
  }

  Color _progressColor(FocusState state) {
    if (state.technique == FocusTechnique.pomodoro &&
        state.pomodoroPhase == PomodoroPhase.breakTime) {
      return AppSemanticColors.sage;
    }
    return AppSemanticColors.primary;
  }

  String _sessionTimeText(FocusState state) {
    if (state.technique == FocusTechnique.simpleTimer) {
      return _formatDuration(state.elapsedSeconds);
    }
    return _formatDuration(state.pomodoroSecondsLeft);
  }

  String _phaseLabel(FocusState state) {
    if (state.technique == FocusTechnique.simpleTimer) return 'ELAPSED';
    return state.pomodoroPhase == PomodoroPhase.breakTime ? 'BREAK' : 'WORK';
  }

  Widget _techniqueCard({
    required BuildContext context,
    required AppColorTokens tokens,
    required bool selected,
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: selected
                ? AppSemanticColors.primary.withValues(alpha: 0.08)
                : tokens.bgSurface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: selected
                  ? AppSemanticColors.primary.withValues(alpha: 0.4)
                  : tokens.borderSubtle,
              width: selected ? 1.5 : 0.8,
            ),
            boxShadow: selected
                ? [
                    BoxShadow(
                      color: AppSemanticColors.primary.withValues(alpha: 0.08),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ]
                : [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: selected
                      ? AppSemanticColors.primary.withValues(alpha: 0.12)
                      : tokens.bgRaised,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  icon,
                  size: 17,
                  color: selected
                      ? AppSemanticColors.primary
                      : tokens.textSecondary,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                title,
                style: AppTextStyles.bodySmall.copyWith(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: tokens.textPrimary,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                subtitle,
                style: AppTextStyles.bodySmall.copyWith(
                  fontSize: 13,
                  color: tokens.textMuted,
                  height: 1.3,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _sessionActionButton({
    required String label,
    required Color color,
    required VoidCallback onPressed,
  }) {
    return OutlinedButton(
      onPressed: onPressed,
      style: OutlinedButton.styleFrom(
        foregroundColor: color,
        side: BorderSide(color: color.withValues(alpha: 0.6), width: 1.2),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
      ),
      child: Text(label),
    );
  }

  Widget _preSessionView(
      BuildContext context, WidgetRef ref, FocusState state) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final notifier = ref.read(focusProvider.notifier);
    final tasksAsync = ref.watch(tasksProvider);
    final activeTasks = tasksAsync.valueOrNull?.tasks
            .where((task) => task.status.toLowerCase() != 'done')
            .take(6)
            .toList() ??
        <TaskModel>[];
    final selectedTaskId = _taskId(state.selectedTask);

    return Scaffold(
      body: GradientBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                const SizedBox(height: 4),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: <Widget>[
                            Text(
                              'Focus Mode',
                              style: GoogleFonts.dmSerifDisplay(
                                fontSize: 34,
                                fontWeight: FontWeight.w700,
                                height: 1.0,
                                color: tokens.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Pick a task and start a session',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(
                                    fontSize: 14,
                                    color: tokens.textSecondary,
                                    height: 1.25,
                                  ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                  child: Container(
                    padding: const EdgeInsets.all(13),
                    decoration: BoxDecoration(
                      color: tokens.bgSurface,
                      borderRadius: BorderRadius.circular(20),
                      border:
                          Border.all(color: tokens.borderSubtle, width: 0.8),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.04),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: <Widget>[
                        Row(
                          children: <Widget>[
                            Container(
                              width: 28,
                              height: 28,
                              decoration: BoxDecoration(
                                color: AppSemanticColors.primary
                                    .withValues(alpha: 0.10),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(
                                Icons.assignment_turned_in_outlined,
                                size: 15,
                                color: AppSemanticColors.primary,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Task Selector',
                              style: AppTextStyles.bodySmall.copyWith(
                                fontSize: 17,
                                fontWeight: FontWeight.w600,
                                color: tokens.textPrimary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        if (tasksAsync.isLoading)
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 18),
                            child: Center(child: CircularProgressIndicator()),
                          )
                        else if (tasksAsync.hasError)
                          Text(
                            'Unable to load tasks.',
                            style: AppTextStyles.bodySmall.copyWith(
                                fontSize: 12, color: tokens.textMuted),
                          )
                        else if (activeTasks.isEmpty)
                          Text(
                            'No active tasks available.',
                            style: AppTextStyles.bodySmall.copyWith(
                                fontSize: 12, color: tokens.textMuted),
                          )
                        else
                          ListView.separated(
                            itemCount: activeTasks.length,
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            separatorBuilder: (_, __) =>
                                const SizedBox(height: 6),
                            itemBuilder: (context, index) {
                              final task = activeTasks[index];
                              final taskSelection = _taskSelection(task);
                              final isSelected = task.id == selectedTaskId;
                              final isAIPick = index == 0;
                              final hasDueDate = task.deadline != null;

                              return GestureDetector(
                                onTap: () => notifier.selectTask(
                                    isSelected ? null : taskSelection),
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 180),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 11,
                                    vertical: 8,
                                  ),
                                  decoration: BoxDecoration(
                                    color: isSelected
                                        ? AppSemanticColors.primary
                                            .withValues(alpha: 0.08)
                                        : tokens.bgRaised,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: isSelected
                                          ? AppSemanticColors.primary
                                              .withValues(alpha: 0.35)
                                          : tokens.borderSubtle,
                                      width: isSelected ? 1.5 : 0.8,
                                    ),
                                  ),
                                  child: Row(
                                    children: <Widget>[
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: <Widget>[
                                            Text(
                                              task.title,
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: AppTextStyles.bodySmall
                                                  .copyWith(
                                                fontSize: 16,
                                                fontWeight: FontWeight.w600,
                                                color: tokens.textPrimary,
                                              ),
                                            ),
                                            if (hasDueDate) ...<Widget>[
                                              const SizedBox(height: 3),
                                              Text(
                                                'Due ${_formatTaskDueDate(task)}',
                                                style: AppTextStyles.bodySmall
                                                    .copyWith(
                                                  fontSize: 13,
                                                  color: tokens.textMuted,
                                                ),
                                              ),
                                            ],
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 7, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: AppSemanticColors.primary
                                              .withValues(alpha: 0.10),
                                          borderRadius:
                                              BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          task.priority.toUpperCase(),
                                          style:
                                              AppTextStyles.labelSmall.copyWith(
                                            fontSize: 9,
                                            fontWeight: FontWeight.w800,
                                            color: AppSemanticColors.primary,
                                          ),
                                        ),
                                      ),
                                      if (isAIPick) ...<Widget>[
                                        const SizedBox(width: 6),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 7, vertical: 3),
                                          decoration: BoxDecoration(
                                            color: AppSemanticColors.primary
                                                .withValues(alpha: 0.15),
                                            borderRadius:
                                                BorderRadius.circular(6),
                                          ),
                                          child: Text(
                                            'AI Pick',
                                            style: AppTextStyles.labelSmall
                                                .copyWith(
                                              fontSize: 9,
                                              fontWeight: FontWeight.w800,
                                              color: AppSemanticColors.primary,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: <Widget>[
                      _techniqueCard(
                        context: context,
                        tokens: tokens,
                        selected: state.technique == FocusTechnique.simpleTimer,
                        icon: Icons.timer_outlined,
                        title: 'Simple Timer',
                        subtitle: 'Track elapsed time freely',
                        onTap: () =>
                            notifier.setTechnique(FocusTechnique.simpleTimer),
                      ),
                      const SizedBox(width: 10),
                      _techniqueCard(
                        context: context,
                        tokens: tokens,
                        selected: state.technique == FocusTechnique.pomodoro,
                        icon: Icons.track_changes_outlined,
                        title: 'Pomodoro 25/5',
                        subtitle: '25-min sprints with 5-min break',
                        onTap: () =>
                            notifier.setTechnique(FocusTechnique.pomodoro),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Opacity(
                    opacity: state.selectedTask == null ? 0.5 : 1,
                    child: SizedBox(
                      width: double.infinity,
                      height: 54,
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          color: AppSemanticColors.primary,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(16),
                            onTap: state.selectedTask == null
                                ? null
                                : notifier.start,
                            child: Center(
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: <Widget>[
                                  const Icon(
                                    Icons.bolt_rounded,
                                    color: Colors.white,
                                    size: 20,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Start Focus Session',
                                    style: AppTextStyles.bodyMedium.copyWith(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 16,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _activeSessionView(
      BuildContext context, WidgetRef ref, FocusState state) {
    final notifier = ref.read(focusProvider.notifier);
    final taskTitle =
        state.selectedTask?['title']?.toString() ?? 'Focus Session';
    final priority = state.selectedTask?['priority']?.toString() ?? 'medium';
    final progress = _progressFor(state);
    final progressColor = _progressColor(state);
    final sessionTimeText = _sessionTimeText(state);
    final phaseLabel = _phaseLabel(state);
    final quote = state.sessionQuote ?? _quotes.first;

    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                Text(
                  taskTitle,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.dmSerifDisplay(
                    fontSize: 22,
                    color: Colors.white,
                    height: 1.1,
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppSemanticColors.primary.withValues(alpha: 0.20),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    priority.toUpperCase(),
                    style: AppTextStyles.labelSmall.copyWith(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: AppSemanticColors.primary,
                    ),
                  ),
                ),
                const SizedBox(height: 40),
                CircularPercentIndicator(
                  radius: 140,
                  lineWidth: 12,
                  percent: progress,
                  progressColor: progressColor,
                  backgroundColor:
                      AppSemanticColors.primary.withValues(alpha: 0.15),
                  circularStrokeCap: CircularStrokeCap.round,
                  animation: false,
                  center: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: <Widget>[
                      Text(
                        sessionTimeText,
                        style: GoogleFonts.dmSerifDisplay(
                          fontSize: 46,
                          color: Colors.white,
                          height: 1,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        phaseLabel,
                        style: TextStyle(
                          fontSize: 12,
                          color: AppSemanticColors.primary,
                          letterSpacing: 1.2,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 40),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: <Widget>[
                    if (state.sessionPaused)
                      _sessionActionButton(
                        label: 'Resume',
                        color: AppSemanticColors.sage,
                        onPressed: notifier.resume,
                      )
                    else
                      _sessionActionButton(
                        label: 'Pause',
                        color: AppSemanticColors.primary,
                        onPressed: notifier.pause,
                      ),
                    const SizedBox(width: 10),
                    _sessionActionButton(
                      label: 'Skip Phase',
                      color: AppSemanticColors.sky,
                      onPressed: notifier.skipPhase,
                    ),
                    const SizedBox(width: 10),
                    _sessionActionButton(
                      label: 'End',
                      color: AppSemanticColors.rose,
                      onPressed: notifier.stop,
                    ),
                  ],
                ),
                const SizedBox(height: 32),
                Text(
                  '"$quote"',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 14,
                    color: Colors.white54,
                    fontStyle: FontStyle.italic,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(focusProvider);
    if (state.sessionActive) {
      return _activeSessionView(context, ref, state);
    }
    return _preSessionView(context, ref, state);
  }
}
