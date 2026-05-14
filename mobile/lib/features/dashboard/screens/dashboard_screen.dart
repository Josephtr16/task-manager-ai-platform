import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../auth/providers/auth_provider.dart';
import '../../notifications/providers/notifications_provider.dart';
import '../../shell/notification_sheet.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/dashboard_provider.dart';
import '../widgets/ai_recommends_section.dart';
import '../widgets/daily_plan_section.dart';
import '../widgets/daily_standup_banner.dart';
import '../widgets/quick_stats_section.dart';
import '../widgets/stats_card.dart';
import '../widgets/upcoming_tasks_section.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncData = ref.watch(dashboardProvider);
    final userName = ref.watch(authProvider).valueOrNull?.user?.name ?? 'there';
    final tokens = Theme.of(context).extension<AppColorTokens>()!;

    return Scaffold(
      backgroundColor: tokens.bgBase,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => ref.read(dashboardProvider.notifier).refresh(),
          child: asyncData.when(
            data: (data) {
              final firstName = userName.split(' ').first;
              final dueToday = (data.stats['dueToday'] ?? 0) as num;
              final completed = (data.stats['completed'] ?? 0) as num;
              final total = (data.stats['total'] ?? 0) as num;
              final productivity =
                  ((data.stats['productivityScore'] ?? 0) as num).toDouble();
              final dailyInsight = data.dailyInsight;

              return CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: <Widget>[
                  SliverAppBar(
                    expandedHeight: 144,
                    toolbarHeight: 56,
                    elevation: 0,
                    scrolledUnderElevation: 0,
                    backgroundColor: Colors.transparent,
                    actions: const <Widget>[
                      _NotificationBellButton(),
                      SizedBox(width: 0),
                    ],
                    flexibleSpace: FlexibleSpaceBar(
                      background: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.end,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            RichText(
                              text: TextSpan(
                                children: <InlineSpan>[
                                  TextSpan(
                                    text: '${_greeting()}, ',
                                    style:
                                        AppTextStyles.greetingItalic.copyWith(
                                      fontSize: 36,
                                      color: tokens.textSecondary,
                                    ),
                                  ),
                                  TextSpan(
                                    text: firstName,
                                    style: AppTextStyles.greetingName.copyWith(
                                      fontSize: 38,
                                      color: tokens.textPrimary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 2),
                            RichText(
                              text: TextSpan(
                                children: <InlineSpan>[
                                  TextSpan(
                                    text: 'You have ',
                                    style: AppTextStyles.bodySmall.copyWith(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w500,
                                      color: tokens.textSecondary,
                                    ),
                                  ),
                                  TextSpan(
                                    text: '${dueToday.toInt()}',
                                    style: AppTextStyles.bodySmall.copyWith(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w700,
                                      color: tokens.textPrimary,
                                    ),
                                  ),
                                  TextSpan(
                                    text: ' tasks due today.',
                                    style: AppTextStyles.bodySmall.copyWith(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w500,
                                      color: tokens.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                      child: Row(
                        children: <Widget>[
                          Expanded(
                            child: StatsCard(
                              label: 'Productivity Score',
                              value: '${productivity.round()}',
                              subtitle: 'Great consistency',
                              icon: Icons.auto_graph_rounded,
                              iconColor: AppSemanticColors.primary,
                              progress: (productivity / 100).clamp(0.0, 1.0),
                              progressColor: AppSemanticColors.primary,
                              compact: true,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: StatsCard(
                              label: 'Tasks Completed',
                              value: '${completed.toInt()}/${total.toInt()}',
                              subtitle: 'This week',
                              icon: Icons.check_circle_outline_rounded,
                              iconColor: AppSemanticColors.sage,
                              progress: total <= 0 ? 0 : completed / total,
                              progressColor: AppSemanticColors.sage,
                              compact: true,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                      child: Column(
                        children: <Widget>[
                          // Daily Insight Card
                          Container(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            padding: const EdgeInsets.all(12),
                            child: Row(
                              children: <Widget>[
                                Container(
                                  width: 24,
                                  height: 24,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFFAEEDA),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: const Icon(
                                    Icons.lightbulb_outline,
                                    size: 14,
                                    color: Color(0xFFC9924A),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: <Widget>[
                                      Text(
                                        'DAILY INSIGHT',
                                        style: AppTextStyles.labelCaps.copyWith(
                                          color: tokens.textSecondary,
                                          fontSize: 10,
                                          letterSpacing: 0.55,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        dailyInsight,
                                        style: GoogleFonts.fraunces(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w700,
                                          color: tokens.textPrimary,
                                        ),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 8),
                          // Weekly Activity Heatmap Card
                          _WeeklyActivityCard(
                            tasks: data.tasks,
                            tokens: tokens,
                          ),
                        ],
                      ),
                    ),
                  ),
                  SliverList(
                    delegate: SliverChildListDelegate(
                      <Widget>[
                        const SizedBox(height: 4),
                        if (data.standupReport != null)
                          DailyStandupBanner(
                            report: data.standupReport!,
                            onDismiss: () {},
                          ),
                        if (data.standupReport != null)
                          const SizedBox(height: 16),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: DailyPlanSection(
                            plan: data.dailyPlan,
                            onGenerate: () =>
                                _showPlanConfirmationDialog(context, ref),
                            onDelete: data.dailyPlan == null
                                ? null
                                : () => _showDeletePlanConfirmationDialog(
                                    context, ref),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: AiRecommendsSection(tasks: data.tasks),
                        ),
                        const SizedBox(height: 16),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: QuickStatsSection(stats: data.stats),
                        ),
                        const SizedBox(height: 16),
                        UpcomingTasksSection(tasks: data.upcomingTasks),
                        const SizedBox(height: 120),
                      ],
                    ),
                  ),
                ],
              );
            },
            loading: () => CustomScrollView(
              slivers: <Widget>[
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
                    child: Text(
                      'Loading dashboard...',
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: tokens.textSecondary,
                      ),
                    ),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 1.08,
                      children: const <Widget>[
                        StatsCardSkeleton(),
                        StatsCardSkeleton(),
                        StatsCardSkeleton(),
                        StatsCardSkeleton(),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            error: (err, _) => Center(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  err.toString(),
                  style: AppTextStyles.bodyMedium
                      .copyWith(color: tokens.textSecondary),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

Future<void> _showPlanConfirmationDialog(
  BuildContext context,
  WidgetRef ref,
) async {
  TimeOfDay startTime = const TimeOfDay(hour: 9, minute: 0);
  TimeOfDay endTime = const TimeOfDay(hour: 18, minute: 0);
  bool isLoading = false;

  Future<void> pickTime({required bool isStart}) async {
    final picked = await showTimePicker(
      context: context,
      initialTime: isStart ? startTime : endTime,
    );
    if (picked == null) return;
    if (isStart) {
      startTime = picked;
    } else {
      endTime = picked;
    }
  }

  String formatTime(TimeOfDay time) {
    final hour = time.hour.toString().padLeft(2, '0');
    final minute = time.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  await showDialog<void>(
    context: context,
    barrierDismissible: !isLoading,
    builder: (dialogContext) {
      final tokens = Theme.of(dialogContext).extension<AppColorTokens>()!;
      return StatefulBuilder(
        builder: (context, setState) {
          Future<void> submitPlan() async {
            setState(() {
              isLoading = true;
            });
            try {
              await ref.read(dashboardProvider.notifier).generateDailyPlan(
                    workStart: formatTime(startTime),
                    workEnd: formatTime(endTime),
                  );
              if (!dialogContext.mounted) return;
              Navigator.of(dialogContext).pop();
              if (!context.mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Today\'s plan generated.'),
                ),
              );
            } catch (error) {
              if (!dialogContext.mounted) return;
              setState(() {
                isLoading = false;
              });
              if (!context.mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    error.toString().replaceFirst('Exception: ', ''),
                  ),
                ),
              );
            }
          }

          return AlertDialog(
            backgroundColor: tokens.bgSurface,
            surfaceTintColor: Colors.transparent,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(24),
              side: BorderSide(color: tokens.borderMedium),
            ),
            titlePadding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
            contentPadding: const EdgeInsets.fromLTRB(24, 14, 24, 0),
            actionsPadding: const EdgeInsets.fromLTRB(24, 18, 24, 24),
            title: Text(
              'Build today\'s schedule',
              style: AppTextStyles.titleLarge.copyWith(
                color: tokens.textPrimary,
              ),
            ),
            content: SizedBox(
              width: 420,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    'Use your open tasks and working hours to generate a focused plan for the day.',
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: tokens.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 22),
                  Row(
                    children: <Widget>[
                      Expanded(
                        child: _TimeField(
                          label: 'Start time',
                          value: MaterialLocalizations.of(context)
                              .formatTimeOfDay(startTime),
                          onTap: isLoading
                              ? null
                              : () async => pickTime(isStart: true),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _TimeField(
                          label: 'End time',
                          value: MaterialLocalizations.of(context)
                              .formatTimeOfDay(endTime),
                          onTap: isLoading
                              ? null
                              : () async => pickTime(isStart: false),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            actions: <Widget>[
              TextButton(
                onPressed:
                    isLoading ? null : () => Navigator.of(dialogContext).pop(),
                child: Text(
                  'Cancel',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: tokens.textSecondary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              FilledButton(
                onPressed: isLoading ? null : submitPlan,
                style: FilledButton.styleFrom(
                  backgroundColor: AppSemanticColors.primary,
                  foregroundColor: tokens.bgSurface,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: isLoading
                    ? SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor:
                              AlwaysStoppedAnimation<Color>(tokens.bgSurface),
                        ),
                      )
                    : Text(
                        'Generate plan',
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: tokens.bgSurface,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
              ),
            ],
          );
        },
      );
    },
  );
}

Future<void> _showDeletePlanConfirmationDialog(
  BuildContext context,
  WidgetRef ref,
) async {
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (dialogContext) {
      final tokens = Theme.of(dialogContext).extension<AppColorTokens>()!;
      return AlertDialog(
        backgroundColor: tokens.bgSurface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: BorderSide(color: tokens.borderMedium),
        ),
        titlePadding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
        contentPadding: const EdgeInsets.fromLTRB(24, 14, 24, 0),
        actionsPadding: const EdgeInsets.fromLTRB(24, 18, 24, 24),
        title: Text(
          'Delete today\'s plan?',
          style: AppTextStyles.titleLarge.copyWith(
            color: tokens.textPrimary,
          ),
        ),
        content: Text(
          'This will remove the current plan from the dashboard so you can generate a fresh one.',
          style: AppTextStyles.bodyMedium.copyWith(
            color: tokens.textSecondary,
          ),
        ),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: Text(
              'Cancel',
              style: AppTextStyles.bodyMedium.copyWith(
                color: tokens.textSecondary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            style: FilledButton.styleFrom(
              backgroundColor: AppSemanticColors.rose,
              foregroundColor: tokens.bgSurface,
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            child: Text(
              'Delete plan',
              style: AppTextStyles.bodyMedium.copyWith(
                color: tokens.bgSurface,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      );
    },
  );

  if (confirmed != true || !context.mounted) return;

  await ref.read(dashboardProvider.notifier).clearDailyPlan();
  if (!context.mounted) return;
  ScaffoldMessenger.of(context).showSnackBar(
    const SnackBar(content: Text('Today\'s plan deleted.')),
  );
}

class _TimeField extends StatelessWidget {
  const _TimeField({
    required this.label,
    required this.value,
    required this.onTap,
  });

  final String label;
  final String value;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: tokens.bgRaised,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: tokens.borderMedium),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              label,
              style: AppTextStyles.labelSmall.copyWith(
                color: tokens.textSecondary,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: <Widget>[
                Expanded(
                  child: Text(
                    value,
                    style: AppTextStyles.bodyMedium.copyWith(
                      fontWeight: FontWeight.w700,
                      color: tokens.textPrimary,
                    ),
                  ),
                ),
                Icon(
                  Icons.schedule_rounded,
                  size: 18,
                  color: tokens.textMuted,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// Removed busiest-day helpers; replaced by _WeeklyActivityCard below.

class _NotificationBellButton extends ConsumerWidget {
  const _NotificationBellButton();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeData = Theme.of(context);
    final tokens = themeData.extension<AppColorTokens>()!;
    final state = ref.watch(notificationsProvider);

    final unreadCount = state.maybeWhen(
      data: (data) => data.items.where((n) => n['read'] != true).length,
      orElse: () => 0,
    );

    return Padding(
      padding: const EdgeInsets.only(top: 16, right: 16),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          GestureDetector(
            onTap: () {
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                useRootNavigator: false,
                builder: (_) => NotificationSheet(themeData: themeData),
              );
            },
            child: Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: tokens.bgRaised,
                shape: BoxShape.circle,
                border: Border.all(color: tokens.borderSubtle, width: 1),
              ),
              child: Icon(
                Icons.notifications_none_rounded,
                size: 24,
                color: tokens.textPrimary,
              ),
            ),
          ),
          if (unreadCount > 0)
            Positioned(
              top: 6,
              right: 6,
              child: Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: tokens.accent,
                  shape: BoxShape.circle,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

String _greeting() {
  final hour = DateTime.now().hour;
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 20) return 'Good evening';
  return 'Good night';
}

String _resolveDailyInsight(Map<String, dynamic> stats) {
  final candidates = <String?>[
    stats['dailyInsight'] as String?,
    stats['daily_insight'] as String?,
    stats['insight'] as String?,
    stats['motivation'] as String?,
    stats['motivationalInsight'] as String?,
  ];

  for (final candidate in candidates) {
    final text = candidate?.trim() ?? '';
    if (text.isNotEmpty) return text;
  }

  return 'Your motivation for today is loading…';
}

class _WeeklyActivityCard extends StatelessWidget {
  const _WeeklyActivityCard({
    required this.tasks,
    required this.tokens,
  });

  final List<dynamic> tasks;
  final AppColorTokens tokens;

  _WeeklyActivityData _computeWeeklyData() {
    // Debug: log incoming task statuses and first task keys to diagnose heatmap data
    try {
      debugPrint('HEATMAP: task statuses = ${tasks.map((t) => t['status']).toList()}');
      debugPrint('HEATMAP: first task keys = ${tasks.isNotEmpty ? tasks.first.keys.toList() : []}');
    } catch (_) {}
    final today = DateTime.now();
    final weekStart = DateTime(today.year, today.month, today.day)
        .subtract(Duration(days: today.weekday - 1));

    final dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    final counts = <int>[0, 0, 0, 0, 0, 0, 0];

    for (final task in tasks) {
      final status = '${task['status'] ?? ''}'.toLowerCase();
      // broaden accepted completed statuses
      final completedStatusValues = <String>{'done', 'completed', 'complete', 'finished'};
      if (!completedStatusValues.contains(status)) continue;

      final completedDate = _parseTaskDate(task);
      if (completedDate == null) continue;

      // Debug: show which tasks matched and the parsed date
      try {
        debugPrint('HEATMAP: matched task status=$status, parsedDate=${completedDate.toIso8601String()}');
      } catch (_) {}

      final localCompletedDate = completedDate.toLocal();

      for (int i = 0; i < 7; i++) {
        final bucketStart = weekStart.add(Duration(days: i));
        final bucketEnd = bucketStart.add(const Duration(days: 1));
        if (!localCompletedDate.isBefore(bucketStart) &&
            localCompletedDate.isBefore(bucketEnd)) {
          counts[i] += 1;
          break;
        }
      }
    }

    final totalDone = counts.reduce((a, b) => a + b);
    final activeDaysCount = counts.where((count) => count > 0).length;
    final average = totalDone > 0 ? (totalDone / 7.0) : 0.0;

    // Calculate streak backward from today
    int streak = 0;
    final todayIndex = today.weekday - 1;
    for (int i = todayIndex; i >= 0; i--) {
      if (counts[i] > 0) {
        streak += 1;
      } else {
        break;
      }
    }

    return _WeeklyActivityData(
      dayLabels: dayLabels,
      counts: counts,
      totalDone: totalDone,
      activeDaysCount: activeDaysCount,
      average: average,
      streak: streak,
      todayIndex: todayIndex,
    );
  }

  DateTime? _parseTaskDate(Map<String, dynamic> task) {
    final fields = <String>[
      'completedAt',
      'completed_at',
      'updatedAt',
      'updated_at',
      'createdAt',
      'created_at',
      'deadline',
    ];

    for (final field in fields) {
      final rawValue = task[field];
      if (rawValue == null) continue;

      if (rawValue is DateTime) {
        return rawValue;
      }

      final parsed = DateTime.tryParse(rawValue.toString());
      if (parsed != null) {
        return parsed;
      }
    }

    return null;
  }

  Color _getDotColor(int count, int index, int todayIndex) {
    if (count == 0 && index == todayIndex) {
      return const Color(0xFFF0EBE3); // Empty with ring handled separately
    }
    if (count == 0) {
      return const Color(0xFFF0EBE3);
    }
    if (count >= 3) {
      return const Color(0xFFC9924A);
    }
    return const Color(0xFFE8C98A);
  }

  @override
  Widget build(BuildContext context) {
    final data = _computeWeeklyData();

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: <Widget>[
              Text(
                'WEEKLY ACTIVITY',
                style: AppTextStyles.labelCaps.copyWith(
                  color: tokens.textSecondary,
                  fontSize: 10,
                  letterSpacing: 0.55,
                ),
              ),
              if (data.streak > 0)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFAEEDA),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    '${data.streak} day streak',
                    style: AppTextStyles.bodySmall.copyWith(
                      fontSize: 9,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF854F0B),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: <Widget>[
              for (int i = 0; i < 7; i++)
                _DayDot(
                  label: data.dayLabels[i],
                  count: data.counts[i],
                  color: _getDotColor(data.counts[i], i, data.todayIndex),
                  isToday: i == data.todayIndex,
                  textColor: data.counts[i] >= 3
                      ? Colors.white
                      : tokens.textPrimary,
                  tokens: tokens,
                ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            '${data.totalDone} done this week · ${data.activeDaysCount} active days',
            style: AppTextStyles.bodySmall.copyWith(
              fontSize: 13,
              color: tokens.textMuted,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class _DayDot extends StatelessWidget {
  const _DayDot({
    required this.label,
    required this.count,
    required this.color,
    required this.isToday,
    required this.textColor,
    required this.tokens,
  });

  final String label;
  final int count;
  final Color color;
  final bool isToday;
  final Color textColor;
  final AppColorTokens tokens;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: <Widget>[
        Container(
          width: 18,
          height: 18,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: color,
            border: isToday && count == 0
                ? Border.all(color: const Color(0xFFC9924A), width: 1.5)
                : null,
          ),
          child: count > 0
              ? Center(
                  child: Text(
                    count.toString(),
                    style: AppTextStyles.bodySmall.copyWith(
                      fontSize: 8,
                      fontWeight: FontWeight.w700,
                      color: textColor,
                    ),
                  ),
                )
              : null,
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: AppTextStyles.bodySmall.copyWith(
            fontSize: 8,
            color: tokens.textMuted,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

class _WeeklyActivityData {
  _WeeklyActivityData({
    required this.dayLabels,
    required this.counts,
    required this.totalDone,
    required this.activeDaysCount,
    required this.average,
    required this.streak,
    required this.todayIndex,
  });

  final List<String> dayLabels;
  final List<int> counts;
  final int totalDone;
  final int activeDaysCount;
  final double average;
  final int streak;
  final int todayIndex;
}
