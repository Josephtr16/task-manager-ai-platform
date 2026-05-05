import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:percent_indicator/circular_percent_indicator.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/gradient_background.dart';
import '../../../core/widgets/tf_page_header.dart';
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

  String? _taskId(Map? task) {
    final value = task?['id'];
    return value?.toString();
  }

  String _formatTaskDueDate(TaskModel task) {
    final deadline = task.deadline;
    if (deadline == null) {
      return '';
    }
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
    if (state.technique == FocusTechnique.pomodoro && state.pomodoroPhase == PomodoroPhase.breakTime) {
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
    if (state.technique == FocusTechnique.simpleTimer) {
      return 'ELAPSED';
    }
    return state.pomodoroPhase == PomodoroPhase.breakTime ? 'BREAK' : 'WORK';
  }

  Widget _priorityChip(String priority) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppSemanticColors.primary.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        priority.toUpperCase(),
        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppSemanticColors.primary),
      ),
    );
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
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: selected ? AppSemanticColors.accentDim : tokens.bgSurface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: selected ? AppSemanticColors.accentGlow : tokens.borderSubtle,
              width: selected ? 1.5 : 0.5,
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Icon(icon, size: 18, color: selected ? AppSemanticColors.primary : tokens.textPrimary),
              const SizedBox(height: 10),
              Text(
                title,
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: tokens.textPrimary),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: TextStyle(fontSize: 11, color: tokens.textMuted),
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
        side: BorderSide(color: color),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
      ),
      child: Text(label),
    );
  }

  Widget _preSessionView(BuildContext context, WidgetRef ref, FocusState state) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final notifier = ref.read(focusProvider.notifier);
    final tasksAsync = ref.watch(tasksProvider);
    final activeTasks = tasksAsync.valueOrNull?.tasks.where((task) => task.status.toLowerCase() != 'done').take(6).toList() ?? <TaskModel>[];
    final selectedTaskId = _taskId(state.selectedTask);

    return Scaffold(
      body: GradientBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                const SizedBox(height: 4),
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16),
                  child: TfPageHeader(
                    title: 'Focus Mode',
                    subtitle: 'Pick a task and start a session',
                  ),
                ),
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: tokens.bgSurface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: tokens.borderSubtle, width: 0.5),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: <Widget>[
                      const Text(
                        'Task Selector',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 10),
                      if (tasksAsync.isLoading)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 18),
                          child: Center(child: CircularProgressIndicator()),
                        )
                      else if (tasksAsync.hasError)
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          child: Text(
                            'Unable to load tasks.',
                            style: TextStyle(fontSize: 12, color: tokens.textMuted),
                          ),
                        )
                      else if (activeTasks.isEmpty)
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          child: Text(
                            'No active tasks available.',
                            style: TextStyle(fontSize: 12, color: tokens.textMuted),
                          ),
                        )
                      else
                        ListView.separated(
                          itemCount: activeTasks.length,
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          separatorBuilder: (_, __) => const SizedBox(height: 8),
                          itemBuilder: (context, index) {
                            final task = activeTasks[index];
                            final taskSelection = _taskSelection(task);
                            final isSelected = task.id == selectedTaskId;
                            final isAIPick = index == 0;
                            final hasDueDate = task.deadline != null;

                            return GestureDetector(
                              onTap: () => notifier.selectTask(isSelected ? null : taskSelection),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                decoration: BoxDecoration(
                                  color: isSelected ? AppSemanticColors.accentDim : tokens.bgSurface,
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(
                                    color: isSelected ? AppSemanticColors.accentGlow : tokens.borderSubtle,
                                    width: isSelected ? 1.5 : 0.5,
                                  ),
                                ),
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: <Widget>[
                                    Row(
                                      children: <Widget>[
                                        Expanded(
                                          child: Text(
                                            task.title,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: tokens.textPrimary),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        _priorityChip(task.priority),
                                        if (isAIPick) ...<Widget>[
                                          const SizedBox(width: 8),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: AppSemanticColors.accentDim,
                                              borderRadius: BorderRadius.circular(999),
                                            ),
                                            child: const Text(
                                              'AI Pick',
                                              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppSemanticColors.accentDark),
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                    if (hasDueDate) ...<Widget>[
                                      const SizedBox(height: 6),
                                      Text(
                                        'Due ${_formatTaskDueDate(task)}',
                                        style: TextStyle(fontSize: 11, color: tokens.textMuted),
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
                Container(
                  margin: const EdgeInsets.fromLTRB(16, 0, 16, 0),
                  child: Row(
                    children: <Widget>[
                      _techniqueCard(
                        context: context,
                        tokens: tokens,
                        selected: state.technique == FocusTechnique.simpleTimer,
                        icon: Icons.timer_outlined,
                        title: 'Simple Timer',
                        subtitle: 'Track elapsed time freely',
                        onTap: () => notifier.setTechnique(FocusTechnique.simpleTimer),
                      ),
                      const SizedBox(width: 10),
                      _techniqueCard(
                        context: context,
                        tokens: tokens,
                        selected: state.technique == FocusTechnique.pomodoro,
                        icon: Icons.track_changes_outlined,
                        title: 'Pomodoro 25/5',
                        subtitle: '25-min sprints with 5-min break',
                        onTap: () => notifier.setTechnique(FocusTechnique.pomodoro),
                      ),
                    ],
                  ),
                ),
                Container(
                  margin: const EdgeInsets.fromLTRB(16, 20, 16, 0),
                  width: double.infinity,
                  child: Opacity(
                    opacity: state.selectedTask == null ? 0.5 : 1,
                    child: FilledButton.icon(
                      onPressed: state.selectedTask == null ? null : notifier.start,
                      icon: const Icon(Icons.bolt_rounded, color: Colors.white),
                      label: const Text(
                        'Start Focus Session',
                        style: TextStyle(color: Colors.white),
                      ),
                      style: FilledButton.styleFrom(
                        backgroundColor: AppSemanticColors.primary,
                        disabledBackgroundColor: AppSemanticColors.primary,
                        disabledForegroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        minimumSize: const Size.fromHeight(52),
                        padding: const EdgeInsets.symmetric(horizontal: 18),
                        textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _activeSessionView(BuildContext context, WidgetRef ref, FocusState state) {
    final notifier = ref.read(focusProvider.notifier);
    final taskTitle = state.selectedTask?['title']?.toString() ?? 'Focus Session';
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
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppSemanticColors.accentDim,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    priority.toUpperCase(),
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: AppSemanticColors.accentDark,
                    ),
                  ),
                ),
                const SizedBox(height: 40),
                CircularPercentIndicator(
                  radius: 140,
                  lineWidth: 12,
                  percent: progress,
                  progressColor: progressColor,
                  backgroundColor: AppSemanticColors.primary.withValues(alpha: 0.15),
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
                    const SizedBox(width: 12),
                    _sessionActionButton(
                      label: 'Skip Phase',
                      color: AppSemanticColors.sky,
                      onPressed: notifier.skipPhase,
                    ),
                    const SizedBox(width: 12),
                    _sessionActionButton(
                      label: 'End Session',
                      color: AppSemanticColors.rose,
                      onPressed: notifier.stop,
                    ),
                  ],
                ),
                const SizedBox(height: 32),
                Text(
                  '“$quote”',
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
