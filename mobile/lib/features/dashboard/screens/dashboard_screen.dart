import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../auth/providers/auth_provider.dart';
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
                  SliverAppBar(
                    pinned: false,
                    floating: true,
                    snap: true,
                    elevation: 0,
                    backgroundColor: Colors.transparent,
                    automaticallyImplyLeading: false,
                    expandedHeight: 108,
                    flexibleSpace: FlexibleSpaceBar(
                      background: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: <Widget>[
                            RichText(
                              text: TextSpan(
                                children: <InlineSpan>[
                                  TextSpan(
                                    text: '${_greeting()}, ',
                                    style: AppTextStyles.greetingItalic.copyWith(
                                      color: tokens.textSecondary,
                                      fontSize: 24,
                                      fontWeight: FontWeight.w300,
                                    ),
                                  ),
                                  TextSpan(
                                    text: firstName,
                                    style: AppTextStyles.greetingName.copyWith(
                                      color: tokens.textPrimary,
                                      fontSize: 24,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 4),
                            RichText(
                              text: TextSpan(
                                children: <InlineSpan>[
                                  TextSpan(
                                    text: 'You have ',
                                    style: GoogleFonts.inter(
                                      fontSize: 15,
                                      color: tokens.textSecondary,
                                    ),
                                  ),
                                  TextSpan(
                                    text: '${dueToday.toInt()}',
                                    style: GoogleFonts.inter(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w800,
                                      color: tokens.textPrimary,
                                    ),
                                  ),
                                  TextSpan(
                                    text: ' tasks due today and ',
                                    style: GoogleFonts.inter(
                                      fontSize: 15,
                                      color: tokens.textSecondary,
                                    ),
                                  ),
                                  TextSpan(
                                    text: '${dueTomorrow.toInt()}',
                                    style: GoogleFonts.inter(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w800,
                                      color: tokens.textPrimary,
                                    ),
                                  ),
                                  TextSpan(
                                    text: ' tomorrow.',
                                    style: GoogleFonts.inter(
                                      fontSize: 15,
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
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      child: GridView.count(
                        crossAxisCount: 2,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        childAspectRatio: 1.32,
                        children: <Widget>[
                          StatsCard(
                            label: 'Due Today',
                            value: '${dueToday.toInt()}',
                            subtitle: 'Action required',
                            icon: Icons.today_rounded,
                            iconColor: AppSemanticColors.rose,
                            progress: (dueToday.toDouble() / 10).clamp(0.0, 1.0),
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
                        if (data.standupReport != null) const SizedBox(height: 16),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: DailyPlanSection(
                            plan: data.dailyPlan,
                            onGenerate: () {},
                          ),
                        ),
                        const SizedBox(height: 16),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: AiRecommendsSection(tasks: data.tasks),
                        ),
                        const SizedBox(height: 16),
                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Row(
                            children: <Widget>[
                              UpcomingTasksSection(tasks: data.upcomingTasks),
                              const SizedBox(width: 12),
                              QuickStatsSection(stats: data.stats),
                            ],
                          ),
                        ),
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
                      childAspectRatio: 1.32,
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
                  style: AppTextStyles.bodyMedium.copyWith(color: tokens.textSecondary),
                ),
              ),
            ),
          ),
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
  final index = data.indexWhere((v) => v == data.reduce((a, b) => a > b ? a : b));
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
      height: 28,
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
                  width: 8,
                  borderRadius: BorderRadius.circular(6),
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
