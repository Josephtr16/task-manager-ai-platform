import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../auth/providers/auth_provider.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/tf_page_header.dart';
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
              final dueTomorrow = (data.stats['dueTomorrow'] ?? 0) as num;
              final completed = (data.stats['completed'] ?? 0) as num;
              final total = (data.stats['total'] ?? 0) as num;
              final productivity =
                  ((data.stats['productivityScore'] ?? 0) as num).toDouble();
              final busiestDay = _busiestDayLabel(data.stats, data.tasks);
              final busiestDayData = _weekdayLoad(data.tasks);

              return CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: <Widget>[
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text(
                            _greeting(),
                            style: AppTextStyles.labelSmall.copyWith(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: tokens.textMuted,
                            ),
                          ),
                          const SizedBox(height: 2),
                          RichText(
                            text: TextSpan(
                              children: <InlineSpan>[
                                TextSpan(
                                  text: _greeting(),
                                  style: GoogleFonts.dmSerifDisplay(
                                    fontSize: 21,
                                    fontStyle: FontStyle.italic,
                                    color: tokens.textSecondary,
                                  ),
                                ),
                                const TextSpan(text: ' '),
                                TextSpan(
                                  text: firstName,
                                  style: GoogleFonts.dmSerifDisplay(
                                    fontSize: 21,
                                    fontWeight: FontWeight.w700,
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
                                    fontSize: 13,
                                    color: tokens.textSecondary,
                                  ),
                                ),
                                TextSpan(
                                  text: '${dueToday.toInt()}',
                                  style: AppTextStyles.bodySmall.copyWith(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: tokens.textPrimary,
                                  ),
                                ),
                                TextSpan(
                                  text: ' tasks due today.',
                                  style: AppTextStyles.bodySmall.copyWith(
                                    fontSize: 13,
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
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                      child: GridView.count(
                        crossAxisCount: 2,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        childAspectRatio: 1.08,
                        children: <Widget>[
                          StatsCard(
                            label: 'Due Today',
                            value: '${dueToday.toInt()}',
                            subtitle: 'Action required',
                            icon: Icons.today_rounded,
                            iconColor: AppSemanticColors.rose,
                            progress:
                                (dueToday.toDouble() / 10).clamp(0.0, 1.0),
                            progressColor: AppSemanticColors.rose,
                            compact: true,
                          ),
                          StatsCard(
                            label: 'Tasks Completed',
                            value: '${completed.toInt()}/${total.toInt()}',
                            subtitle: 'This week',
                            icon: Icons.check_circle_outline_rounded,
                            iconColor: AppSemanticColors.sage,
                            progress: total <= 0 ? 0 : completed / total,
                            progressColor: AppSemanticColors.sage,
                            compact: true,
                          ),
                          StatsCard(
                            label: 'Productivity Score',
                            value: '${productivity.round()}',
                            subtitle: 'Great consistency',
                            icon: Icons.auto_graph_rounded,
                            iconColor: AppSemanticColors.primary,
                            progress: (productivity / 100).clamp(0.0, 1.0),
                            progressColor: AppSemanticColors.primary,
                            compact: true,
                          ),
                          StatsCard(
                            label: 'Busiest Day',
                            value: busiestDay,
                            subtitle: 'Most load',
                            icon: Icons.bar_chart_rounded,
                            iconColor: AppSemanticColors.sky,
                            customContent: _BusiestDayChart(
                              values: busiestDayData,
                            ),
                            compact: true,
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

String _busiestDayLabel(
  Map<String, dynamic> stats,
  List<Map<String, dynamic>> tasks,
) {
  final raw = '${stats['busiestDay'] ?? stats['busiest_day'] ?? ''}'.trim();
  if (raw.isNotEmpty) return raw;

  final data = _weekdayLoad(tasks);
  final index =
      data.indexWhere((v) => v == data.reduce((a, b) => a > b ? a : b));
  const names = <String>['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  if (index < 0 || index >= names.length) return 'Mon';
  return names[index];
}

List<double> _weekdayLoad(List<Map<String, dynamic>> tasks) {
  final counts = List<double>.filled(7, 0);
  for (final task in tasks) {
    final deadline = DateTime.tryParse('${task['deadline'] ?? ''}');
    if (deadline == null) continue;
    final idx = deadline.weekday - 1;
    if (idx >= 0 && idx < counts.length) {
      counts[idx] += 1;
    }
  }

  if (counts.every((c) => c == 0)) {
    return <double>[2, 3, 4, 3, 5, 2, 1];
  }
  return counts;
}

class _BusiestDayChart extends StatelessWidget {
  const _BusiestDayChart({required this.values});

  final List<double> values;

  @override
  Widget build(BuildContext context) {
    final capped = values.take(7).toList();
    while (capped.length < 7) {
      capped.add(0);
    }
    final maxY = (capped.reduce((a, b) => a > b ? a : b) + 1).toDouble();

    return SizedBox(
      height: 22,
      child: BarChart(
        BarChartData(
          maxY: maxY,
          gridData: const FlGridData(show: false),
          borderData: FlBorderData(show: false),
          titlesData: const FlTitlesData(show: false),
          barGroups: List<BarChartGroupData>.generate(
            7,
            (i) => BarChartGroupData(
              x: i,
              barRods: <BarChartRodData>[
                BarChartRodData(
                  toY: capped[i],
                  width: 6,
                  borderRadius: BorderRadius.circular(4),
                  color: AppSemanticColors.sky,
                ),
              ],
            ),
          ),
        ),
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
