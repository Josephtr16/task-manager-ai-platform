import 'dart:math';

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/gradient_background.dart';
import '../providers/insights_provider.dart';

class InsightsScreen extends ConsumerStatefulWidget {
  const InsightsScreen({super.key});

  @override
  ConsumerState<InsightsScreen> createState() => _InsightsScreenState();
}

class _TrendPill extends StatelessWidget {
  const _TrendPill({
    required this.label,
    required this.selected,
    required this.onTap,
    required this.tokens,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;
  final AppColorTokens tokens;

  @override
  Widget build(BuildContext context) {
    final background = selected ? AppSemanticColors.accentDim : tokens.bgSurface;
    final borderColor = selected ? AppSemanticColors.copper : tokens.borderSubtle;
    final textColor = selected ? AppSemanticColors.copper : tokens.textSecondary;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: background,
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: borderColor, width: 0.9),
            boxShadow: selected
                ? <BoxShadow>[
                    BoxShadow(
                      color: AppSemanticColors.copper.withValues(alpha: 0.12),
                      blurRadius: 14,
                      offset: const Offset(0, 6),
                    ),
                  ]
                : <BoxShadow>[],
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: textColor,
            ),
          ),
        ),
      ),
    );
  }
}

class _ChartLegendDot extends StatelessWidget {
  const _ChartLegendDot({
    required this.color,
    required this.label,
    required this.textColor,
  });

  final Color color;
  final String label;
  final Color textColor;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: textColor,
          ),
        ),
      ],
    );
  }
}

class _InsightsScreenState extends ConsumerState<InsightsScreen> {
  int _trendDays = 7;

  String _formatDuration(num minutes) {
    final rounded = minutes.round();
    if (rounded <= 0) return '0m';
    if (rounded < 60) return '${rounded}m';
    final hours = rounded ~/ 60;
    final remainder = rounded % 60;
    return remainder == 0 ? '${hours}h' : '${hours}h ${remainder}m';
  }

  num _toNum(dynamic value) {
    if (value == null) return 0;
    if (value is num) return value;
    if (value is String) return num.tryParse(value) ?? 0;
    return 0;
  }

  Map? _asMap(dynamic value) => value is Map ? value : null;

  List<Map> _listOfMaps(dynamic value) {
    if (value is List) {
      return value.whereType<Map>().cast<Map>().toList();
    }
    if (value is Map && value['data'] is List) {
      final rawList = value['data'] as List;
      return rawList.whereType<Map>().cast<Map>().toList();
    }
    return const <Map>[];
  }

  String _getString(Map? map, String key) {
    if (map == null) return '';
    final value = map[key];
    return value == null ? '' : value.toString();
  }

  num _numFromMap(Map? map, List<String> keys) {
    if (map == null) return 0;
    for (final key in keys) {
      final value = map[key];
      if (value == null) continue;
      if (value is num) return value;
      if (value is String) {
        final parsed = num.tryParse(value);
        if (parsed != null) return parsed;
      }
    }
    return 0;
  }

  Color _getCategoryColor(String category) {
    final normalized = category.trim().toLowerCase();
    switch (normalized) {
      case 'work':
        return const Color(0xFFC9924A); // Copper
      case 'personal':
        return const Color(0xFF5E8A6E); // Sage
      case 'shopping':
        return const Color(0xFFB85C5C); // Rose
      case 'learning':
        return const Color(0xFFB87355); // Burnt orange
      case 'health':
        return const Color(0xFF5A7FA0); // Sky
      case 'family':
        return const Color(0xFFA07050); // Brown
      default:
        return const Color(0xFF6D7B8C); // Gray fallback
    }
  }

  String _dayLabel(Map? map) {
    final dayName = _getString(map, 'dayName');
    final day = _getString(map, 'day');
    final date = _getString(map, 'date');
    final label = dayName.isNotEmpty ? dayName : (day.isNotEmpty ? day : date);
    if (label.isEmpty) return '';
    return label.length >= 3 ? label.substring(0, 3) : label;
  }

  String _tooltipDateLabel(Map? map) {
    final rawDate = _getString(map, 'date');
    if (rawDate.isEmpty) {
      return _dayLabel(map);
    }

    final parsed = DateTime.tryParse(rawDate);
    if (parsed == null) {
      return rawDate;
    }

    const monthNames = <String>[
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    final weekday = <String>['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][parsed.weekday % 7];
    final month = monthNames[parsed.month - 1];
    return '$weekday, $month ${parsed.day}';
  }

  Widget _sectionCard(WidgetRef ref, AppColorTokens tokens, {required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: tokens.bgSurface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: tokens.borderSubtle, width: 0.5),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 12, offset: const Offset(0, 6)),
        ],
      ),
      child: child,
    );
  }

  Widget _buildCategoryDistributionChart(AppColorTokens tokens, List<dynamic> categoryDistribution) {
    // Filter out categories with 0% or 0 count
    final filtered = <dynamic>[];
    for (int i = 0; i < categoryDistribution.length; i++) {
      final item = _asMap(categoryDistribution[i]);
      final count = _numFromMap(item, const <String>['count', 'value']);
      if (count > 0) {
        filtered.add(categoryDistribution[i]);
      }
    }

    return Column(
      children: <Widget>[
        SizedBox(
          height: 140,
          child: Row(
            children: <Widget>[
              Expanded(
                flex: 4,
                child: PieChart(
                  PieChartData(
                    sectionsSpace: 2,
                    centerSpaceRadius: 28,
                    sections: List.generate(filtered.length, (index) {
                      final item = _asMap(filtered[index]);
                      final count = _numFromMap(item, const <String>['count', 'value']);
                      final label = _getString(item, 'category').isNotEmpty
                          ? _getString(item, 'category')
                          : (_getString(item, 'name').isNotEmpty ? _getString(item, 'name') : 'Other');
                      return PieChartSectionData(
                        value: count.toDouble(),
                        color: _getCategoryColor(label),
                        radius: 40,
                        showTitle: false,
                      );
                    }),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 5,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: List.generate(filtered.length, (index) {
                    final item = _asMap(filtered[index]);
                    final label = _getString(item, 'category').isNotEmpty
                        ? _getString(item, 'category')
                        : (_getString(item, 'name').isNotEmpty ? _getString(item, 'name') : 'Other');
                    final value = _numFromMap(item, const <String>['percentage', 'count', 'value']);
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 5),
                      child: Row(
                        children: <Widget>[
                          Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              color: _getCategoryColor(label),
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              label,
                              style: TextStyle(fontSize: 12, color: tokens.textSecondary),
                            ),
                          ),
                          Text(
                            '${value.round()}%',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: tokens.textPrimary,
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }


  Widget _metricTile({
    required AppColorTokens tokens,
    required String value,
    required String label,
    required String sub,
    required Color valueColor,
  }) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
      decoration: BoxDecoration(
        color: tokens.bgSurface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: tokens.borderSubtle, width: 0.8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 22,
              height: 1,
              fontWeight: FontWeight.w800,
              color: valueColor,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              letterSpacing: 0.7,
              fontWeight: FontWeight.w700,
              color: tokens.textPrimary,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            sub,
            style: TextStyle(
              fontSize: 11,
              color: tokens.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _statBox(AppColorTokens tokens, String value, String label, {Color? color}) {
    IconData iconData = Icons.check_circle;
    if (label.contains('Focus')) iconData = Icons.timer;
    if (label.contains('Streak')) iconData = Icons.local_fire_department;
    if (label.contains('Total')) iconData = Icons.list_alt;
    if (label.contains('Progress')) iconData = Icons.circle_outlined;
    if (label.contains('Overdue')) iconData = Icons.warning_rounded;
    
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
      decoration: BoxDecoration(
        color: tokens.bgSurface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: tokens.borderSubtle, width: 0.8),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0,4))],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: <Widget>[
          Icon(
            iconData,
            size: 18,
            color: color ?? AppSemanticColors.primary,
          ),
          const SizedBox(height: 8),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: color ?? tokens.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 10, color: tokens.textMuted, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  Widget _circularMetric(AppColorTokens tokens, Color color, String value, String label, double percent) {
    final clamped = percent.clamp(0, 100) / 100;
    final IconData icon = label.contains('Completion') ? Icons.check_circle : Icons.trending_up_rounded;
    
    return Column(
      children: <Widget>[
        SizedBox(
          width: 100,
          height: 100,
          child: Stack(
            alignment: Alignment.center,
            children: <Widget>[
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [tokens.bgSurface, tokens.bgSurface.withOpacity(0.6)],
                  ),
                  boxShadow: [BoxShadow(color: color.withOpacity(0.08), blurRadius: 16, offset: const Offset(0,6))],
                ),
              ),
              SizedBox(
                width: 100,
                height: 100,
                child: CircularProgressIndicator(
                  value: clamped,
                  strokeWidth: 7,
                  backgroundColor: tokens.borderSubtle.withOpacity(0.3),
                  valueColor: AlwaysStoppedAnimation<Color>(color),
                ),
              ),
              Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: <Widget>[
                  Icon(icon, size: 20, color: color),
                  const SizedBox(height: 4),
                  Text(
                    value,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: tokens.textPrimary,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: tokens.textSecondary,
            letterSpacing: 0.2,
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(insightsProvider);
    final tokens = Theme.of(context).extension<AppColorTokens>()!;

    return Scaffold(
      body: GradientBackground(
        child: async.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => Center(child: Text(error.toString())),
          data: (data) {
            final performanceMetrics = _asMap(data['performanceMetrics']) ?? <String, dynamic>{};
            final productivityTrend = _listOfMaps(data['productivityTrend']);
            // Compute dynamic scales for the trend chart to keep it clean and modern
            final int _trendMax = productivityTrend.fold<int>(0, (prev, item) {
              final map = _asMap(item);
              final created = _numFromMap(map, const <String>['created']).toInt();
              final completed = _numFromMap(map, const <String>['completed']).toInt();
              return max(prev, max(created, completed));
            });
            final int trendMaxY = (_trendMax <= 0) ? 3 : (_trendMax + 1);
            final int trendInterval = trendMaxY <= 4 ? 1 : ( (trendMaxY / 4).ceil() );
            final int trendLabelStep = productivityTrend.length <= 8 ? 1 : ( (productivityTrend.length / 6).ceil() );
            final categoryDistribution = _listOfMaps(data['categoryDistribution']);
            final timeOfDay = _listOfMaps(data['timeOfDay']);
            // Compute dynamic scales for timeOfDay and bestDays charts
            final int _timeMax = timeOfDay.fold<int>(0, (prev, item) {
              final map = _asMap(item);
              return max(prev, _numFromMap(map, const <String>['count']).toInt());
            });
            final int timeMaxY = max(1, _timeMax + 1);
            final int timeInterval = timeMaxY <= 4 ? 1 : ((timeMaxY / 4).ceil());
            // Show X-axis labels every 2 hours to match web
            final int timeLabelStep = 2;
            final bestDays = _listOfMaps(data['bestDays']);
            final aiInsights = _listOfMaps(data['aiInsights']);

            final productivityScore = _toNum(performanceMetrics['productivityScore']);
            final completionRate = _toNum(performanceMetrics['completionRate']);
            final onTimeRate = _toNum(performanceMetrics['onTimeRate']);
            final avgDuration = _toNum(performanceMetrics['averageDuration']);

            final bottomInset = MediaQuery.of(context).padding.bottom + kBottomNavigationBarHeight + 16;

            return ListView(
              padding: EdgeInsets.fromLTRB(16, 12, 16, bottomInset),
              children: <Widget>[
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text(
                            'AI Insights',
                            style: TextStyle(
                              fontSize: 26,
                              fontWeight: FontWeight.w800,
                              color: tokens.textPrimary,
                              height: 1.05,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Smart analytics powered by your task data',
                            style: TextStyle(
                              fontSize: 13,
                              color: tokens.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    InkWell(
                      onTap: () => ref.invalidate(insightsProvider),
                      borderRadius: BorderRadius.circular(999),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        decoration: BoxDecoration(
                          color: tokens.bgSurface,
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(color: tokens.borderSubtle, width: 0.6),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: <Widget>[
                            Icon(Icons.refresh, size: 14, color: tokens.textPrimary),
                            const SizedBox(width: 6),
                            Text(
                              'Refresh',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: tokens.textPrimary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                if (aiInsights.isNotEmpty) ...[
                  ...aiInsights.map((insight) {
                    final item = _asMap(insight);
                    final title = _getString(item, 'title').isNotEmpty ? _getString(item, 'title') : 'AI Insight';
                    final description = _getString(item, 'description').isNotEmpty
                        ? _getString(item, 'description')
                        : (_getString(item, 'summary').isNotEmpty ? _getString(item, 'summary') : _getString(item, 'text'));
                    final icon = _getString(item, 'icon');
                    final confidence = _toNum(item?['confidence']).clamp(0, 100).toInt();

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 14),
                      child: _sectionCard(
                        ref,
                        tokens,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: <Widget>[
                                Container(
                                  width: 42,
                                  height: 42,
                                  decoration: BoxDecoration(
                                    color: AppSemanticColors.primary.withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Icon(
                                    icon == 'chart'
                                        ? Icons.show_chart
                                        : icon == 'calendar'
                                            ? Icons.calendar_today
                                            : icon == 'clock'
                                                ? Icons.schedule
                                                : Icons.auto_awesome,
                                    color: AppSemanticColors.primary,
                                    size: 20,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: <Widget>[
                                      Text(
                                        title,
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w800,
                                          color: tokens.textPrimary,
                                        ),
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        description,
                                        style: TextStyle(
                                          fontSize: 13,
                                          height: 1.5,
                                          color: tokens.textSecondary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Text(
                                  '$confidence%',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: confidence > 80
                                        ? AppSemanticColors.sage
                                        : confidence > 60
                                            ? AppSemanticColors.copper
                                            : AppSemanticColors.rose,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  }),
                ],

                GridView.count(
                  crossAxisCount: 2,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 1.16,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  children: <Widget>[
                    _metricTile(
                      tokens: tokens,
                      value: '${productivityScore.round()}%',
                      label: 'PRODUCTIVITY',
                      sub: 'Overall score',
                      valueColor: AppSemanticColors.primary,
                    ),
                    _metricTile(
                      tokens: tokens,
                      value: '${completionRate.round()}%',
                      label: 'COMPLETION',
                      sub: '${performanceMetrics['tasksCompleted'] ?? 0} tasks',
                      valueColor: AppSemanticColors.sage,
                    ),
                    _metricTile(
                      tokens: tokens,
                      value: '${onTimeRate.round()}%',
                      label: 'ON-TIME RATE',
                      sub: 'This week',
                      valueColor: AppSemanticColors.sky,
                    ),
                    _metricTile(
                      tokens: tokens,
                      value: _formatDuration(avgDuration),
                      label: 'AVG DURATION',
                      sub: 'Per task',
                      valueColor: tokens.textPrimary,
                    ),
                  ],
                ),

                const SizedBox(height: 14),

                Container(
                  padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
                  decoration: BoxDecoration(
                    color: tokens.bgSurface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: tokens.borderSubtle, width: 0.6),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Icon(Icons.show_chart, size: 18, color: tokens.textPrimary),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Productivity Trend',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                                color: tokens.textPrimary,
                                letterSpacing: -0.2,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Flexible(
                            child: Align(
                              alignment: Alignment.topRight,
                              child: Wrap(
                                spacing: 8,
                                runSpacing: 6,
                                alignment: WrapAlignment.end,
                                children: <Widget>[
                                  _TrendPill(
                                    label: '7d',
                                    selected: _trendDays == 7,
                                    onTap: () {
                                      setState(() => _trendDays = 7);
                                      ref.read(insightsTrendDaysProvider.notifier).state = 7;
                                    },
                                    tokens: tokens,
                                  ),
                                  _TrendPill(
                                    label: '14d',
                                    selected: _trendDays == 14,
                                    onTap: () {
                                      setState(() => _trendDays = 14);
                                      ref.read(insightsTrendDaysProvider.notifier).state = 14;
                                    },
                                    tokens: tokens,
                                  ),
                                  _TrendPill(
                                    label: '30d',
                                    selected: _trendDays == 30,
                                    onTap: () {
                                      setState(() => _trendDays = 30);
                                      ref.read(insightsTrendDaysProvider.notifier).state = 30;
                                    },
                                    tokens: tokens,
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      SizedBox(
                        height: 230,
                        child: productivityTrend.isEmpty
                            ? Center(
                                child: Text(
                                  'No trend data yet',
                                  style: TextStyle(color: tokens.textMuted, fontSize: 12),
                                ),
                              )
                            : LineChart(
                                LineChartData(
                                  minX: 0,
                                  maxX: (productivityTrend.length - 1).toDouble(),
                                  minY: 0,
                                  maxY: trendMaxY.toDouble(),
                                  gridData: FlGridData(
                                    show: true,
                                    drawVerticalLine: false,
                                    horizontalInterval: trendInterval.toDouble(),
                                    getDrawingHorizontalLine: (value) => FlLine(
                                      color: tokens.borderSubtle,
                                      strokeWidth: 1,
                                      dashArray: [4, 4],
                                    ),
                                  ),
                                  borderData: FlBorderData(
                                    show: true,
                                    border: Border(
                                      left: BorderSide(color: tokens.borderSubtle, width: 1),
                                      bottom: BorderSide(color: tokens.borderSubtle, width: 1),
                                    ),
                                  ),
                                  lineTouchData: LineTouchData(
                                    handleBuiltInTouches: true,
                                    touchTooltipData: LineTouchTooltipData(
                                      tooltipRoundedRadius: 8,
                                      tooltipPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                      tooltipMargin: 8,
                                      fitInsideHorizontally: true,
                                      fitInsideVertically: true,
                                      getTooltipColor: (_) => tokens.bgSurface,
                                      getTooltipItems: (touchedSpots) {
                                        return touchedSpots.asMap().entries.map((entry) {
                                          final spot = entry.value;
                                          final item = productivityTrend[spot.x.toInt()];
                                          final map = _asMap(item);
                                          final label = _tooltipDateLabel(map);
                                          final isCreated = spot.barIndex == 0;
                                          final series = isCreated ? 'Created' : 'Completed';
                                          return LineTooltipItem(
                                            entry.key == 0 ? '$label\n$series: ${spot.y.toInt()}' : '$series: ${spot.y.toInt()}',
                                            TextStyle(
                                              color: tokens.textPrimary,
                                              fontSize: 12,
                                              height: 1.4,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          );
                                        }).toList();
                                      },
                                    ),
                                  ),
                                  titlesData: FlTitlesData(
                                    topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                    rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                    leftTitles: AxisTitles(
                                      sideTitles: SideTitles(
                                        showTitles: true,
                                        reservedSize: 28,
                                        interval: trendInterval.toDouble(),
                                        getTitlesWidget: (value, meta) {
                                          return Padding(
                                            padding: const EdgeInsets.only(right: 6),
                                            child: Text(
                                              value.toInt().toString(),
                                              style: TextStyle(fontSize: 10, color: tokens.textMuted),
                                            ),
                                          );
                                        },
                                      ),
                                    ),
                                    bottomTitles: AxisTitles(
                                      sideTitles: SideTitles(
                                        showTitles: true,
                                        reservedSize: 30,
                                        interval: 1,
                                        getTitlesWidget: (value, meta) {
                                          final idx = value.toInt();
                                          if (idx < 0 || idx >= productivityTrend.length) return const SizedBox.shrink();
                                          if (trendLabelStep > 1 && (idx % trendLabelStep) != 0) return const SizedBox.shrink();
                                          final label = _dayLabel(_asMap(productivityTrend[idx]));
                                          return Padding(
                                            padding: const EdgeInsets.only(top: 10),
                                            child: Text(
                                              label,
                                              style: TextStyle(fontSize: 10, color: tokens.textMuted),
                                            ),
                                          );
                                        },
                                      ),
                                    ),
                                  ),
                                  lineBarsData: <LineChartBarData>[
                                    LineChartBarData(
                                      spots: List.generate(productivityTrend.length, (index) {
                                        final map = _asMap(productivityTrend[index]);
                                        return FlSpot(index.toDouble(), _numFromMap(map, const <String>['created']).toDouble().clamp(0, double.infinity));
                                      }),
                                      isCurved: true,
                                      color: const Color(0xFFD79B4B),
                                      barWidth: 2.2,
                                      isStrokeCapRound: true,
                                      dotData: FlDotData(
                                        show: true,
                                        getDotPainter: (spot, percent, barData, index) => FlDotCirclePainter(
                                          radius: 2.4,
                                          color: const Color(0xFFD79B4B),
                                          strokeWidth: 0,
                                        ),
                                      ),
                                      belowBarData: BarAreaData(show: true, color: const Color(0xFFD79B4B).withOpacity(0.06)),
                                    ),
                                    LineChartBarData(
                                      spots: List.generate(productivityTrend.length, (index) {
                                        final map = _asMap(productivityTrend[index]);
                                        return FlSpot(index.toDouble(), _numFromMap(map, const <String>['completed']).toDouble().clamp(0, double.infinity));
                                      }),
                                      isCurved: true,
                                      color: const Color(0xFF6D8F73),
                                      barWidth: 2.2,
                                      isStrokeCapRound: true,
                                      dotData: FlDotData(
                                        show: true,
                                        getDotPainter: (spot, percent, barData, index) => FlDotCirclePainter(
                                          radius: 2.4,
                                          color: const Color(0xFF6D8F73),
                                          strokeWidth: 0,
                                        ),
                                      ),
                                      belowBarData: BarAreaData(show: true, color: const Color(0xFF6D8F73).withOpacity(0.06)),
                                    ),
                                  ],
                                ),
                              ),
                      ),
                      const SizedBox(height: 10),
                      Center(
                        child: Wrap(
                          spacing: 14,
                          runSpacing: 8,
                          alignment: WrapAlignment.center,
                          children: <Widget>[
                            // Match series order to chart (Created then Completed)
                            _ChartLegendDot(color: const Color(0xFFD79B4B), label: 'Created', textColor: tokens.textPrimary),
                            _ChartLegendDot(color: const Color(0xFF6D8F73), label: 'Completed', textColor: tokens.textPrimary),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 14),

                _sectionCard(
                  ref,
                  tokens,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text(
                        'CATEGORY DISTRIBUTION',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                          color: tokens.textMuted,
                        ),
                      ),
                      const SizedBox(height: 16),
                      if (categoryDistribution.isEmpty)
                        SizedBox(
                          height: 180,
                          child: Center(
                            child: Text(
                              'No tasks yet. Create tasks to see distribution!',
                              textAlign: TextAlign.center,
                              style: TextStyle(fontSize: 12, color: tokens.textMuted),
                            ),
                          ),
                        )
                      else
                        _buildCategoryDistributionChart(tokens, categoryDistribution)

                    ],
                  ),
                ),

                const SizedBox(height: 14),

                _sectionCard(
                  ref,
                  tokens,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text(
                        'TIME OF DAY ANALYSIS',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                          color: tokens.textMuted,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'When do you complete most tasks?',
                        style: TextStyle(fontSize: 13, color: tokens.textSecondary),
                      ),
                      const SizedBox(height: 14),
                      SizedBox(
                        height: 250,
                        child: timeOfDay.any((item) => _numFromMap(_asMap(item), const <String>['count']) > 0)
                            ? BarChart(
                                BarChartData(
                                  barTouchData: BarTouchData(
                                    enabled: true,
                                    touchTooltipData: BarTouchTooltipData(
                                      tooltipRoundedRadius: 8,
                                      tooltipPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                      fitInsideHorizontally: true,
                                      fitInsideVertically: true,
                                      tooltipBorder: BorderSide(color: Color(0xFFDCC6A8), width: 1),
                                      getTooltipColor: (_) => const Color(0xFFFAF3EA),
                                      getTooltipItem: (group, groupIndex, rod, rodIndex) {
                                        final idx = group.x.toInt();
                                        if (idx < 0 || idx >= timeOfDay.length) return null;
                                        final map = _asMap(timeOfDay[idx]);
                                        final label = _getString(map, 'label');
                                        final count = _numFromMap(map, const <String>['count']).toInt();
                                        return BarTooltipItem(
                                          '$label\n',
                                          TextStyle(
                                            color: tokens.textPrimary,
                                            fontWeight: FontWeight.w800,
                                            fontSize: 12,
                                          ),
                                          children: [
                                            TextSpan(
                                              text: 'Tasks Completed: $count',
                                              style: TextStyle(
                                                color: const Color(0xFFC9924A),
                                                fontWeight: FontWeight.w700,
                                                fontSize: 12,
                                              ),
                                            ),
                                          ],
                                        );
                                      },
                                    ),
                                  ),
                                  maxY: timeMaxY.toDouble(),
                                  gridData: FlGridData(
                                    show: true,
                                    drawVerticalLine: false,
                                    horizontalInterval: timeInterval.toDouble(),
                                    getDrawingHorizontalLine: (value) => FlLine(
                                      color: tokens.borderSubtle,
                                      strokeWidth: 1,
                                      dashArray: [3, 3],
                                    ),
                                  ),
                                  borderData: FlBorderData(
                                    show: true,
                                    border: Border(
                                      left: BorderSide(color: tokens.borderSubtle, width: 1),
                                      bottom: BorderSide(color: tokens.borderSubtle, width: 1),
                                    ),
                                  ),
                                  groupsSpace: 12,
                                  barGroups: List.generate(timeOfDay.length, (index) {
                                    final item = _asMap(timeOfDay[index]);
                                    final value = _numFromMap(item, const <String>['count']).toDouble();
                                    return BarChartGroupData(
                                      x: index,
                                      barRods: <BarChartRodData>[
                                        BarChartRodData(
                                          toY: value,
                                          width: 18,
                                          borderRadius: const BorderRadius.only(
                                            topLeft: Radius.circular(4),
                                            topRight: Radius.circular(4),
                                          ),
                                          color: AppSemanticColors.primary,
                                          borderSide: BorderSide(color: AppSemanticColors.primary.withOpacity(0.9), width: 0.5),
                                        ),
                                      ],
                                    );
                                  }),
                                  titlesData: FlTitlesData(
                                    topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                    rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                    leftTitles: AxisTitles(
                                      sideTitles: SideTitles(
                                        showTitles: true,
                                        reservedSize: 32,
                                        interval: timeInterval.toDouble(),
                                        getTitlesWidget: (value, meta) => Text(
                                          value.toInt().toString(),
                                          style: TextStyle(fontSize: 11, color: tokens.textMuted),
                                        ),
                                      ),
                                    ),
                                    bottomTitles: AxisTitles(
                                      sideTitles: SideTitles(
                                        showTitles: true,
                                        reservedSize: 32,
                                        interval: 1,
                                        getTitlesWidget: (value, meta) {
                                          final index = value.toInt();
                                          if (index < 0 || index >= timeOfDay.length) return const SizedBox.shrink();
                                          if (timeLabelStep > 1 && (index % timeLabelStep) != 0) return const SizedBox.shrink();
                                          final label = _getString(_asMap(timeOfDay[index]), 'label');
                                          return Padding(
                                            padding: const EdgeInsets.only(top: 8),
                                            child: Text(
                                              label,
                                              style: TextStyle(fontSize: 10, color: tokens.textMuted),
                                            ),
                                          );
                                        },
                                      ),
                                    ),
                                  ),
                                ),
                              )
                            : Center(
                                child: Text(
                                  'Complete tasks to see your most productive hours!',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(fontSize: 12, color: tokens.textMuted),
                                ),
                              ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 14),

                _sectionCard(
                  ref,
                  tokens,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text(
                        'BEST DAYS',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                          color: tokens.textMuted,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Most productive days of the week',
                        style: TextStyle(fontSize: 13, color: tokens.textSecondary),
                      ),
                      const SizedBox(height: 14),
                      SizedBox(
                        height: 210,
                        child: bestDays.any((item) => _numFromMap(_asMap(item), const <String>['count']) > 0)
                            ? Builder(builder: (_) {
                                final int _bestMax = bestDays.fold<int>(0, (prev, item) {
                                  final map = _asMap(item);
                                  return max(prev, _numFromMap(map, const <String>['count']).toInt());
                                });
                                final int bestMaxY = max(1, _bestMax + 1);
                                final int bestInterval = bestMaxY <= 4 ? 1 : ((bestMaxY / 4).ceil());
                                final int bestLabelStep = bestDays.length <= 7 ? 1 : ((bestDays.length / 7).ceil());
                                return BarChart(
                                  BarChartData(
                                    barTouchData: BarTouchData(
                                      enabled: true,
                                      touchTooltipData: BarTouchTooltipData(
                                        tooltipRoundedRadius: 8,
                                        tooltipPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                        fitInsideHorizontally: true,
                                        fitInsideVertically: true,
                                        tooltipBorder: BorderSide(color: Color(0xFFDCC6A8), width: 1),
                                        getTooltipColor: (_) => const Color(0xFFFAF3EA),
                                        getTooltipItem: (group, groupIndex, rod, rodIndex) {
                                          final idx = group.x.toInt();
                                          if (idx < 0 || idx >= bestDays.length) return null;
                                          final map = _asMap(bestDays[idx]);
                                          final day = _getString(map, 'day');
                                          final count = _numFromMap(map, const <String>['count']).toInt();
                                          final label = day.isNotEmpty ? (day.length >= 3 ? day.substring(0, 3) : day) : '';
                                          return BarTooltipItem(
                                            '$label\n',
                                            TextStyle(
                                              color: tokens.textPrimary,
                                              fontWeight: FontWeight.w800,
                                              fontSize: 12,
                                            ),
                                            children: [
                                              TextSpan(
                                                text: 'Tasks: $count',
                                                style: TextStyle(
                                                  color: const Color(0xFFC9924A),
                                                  fontWeight: FontWeight.w700,
                                                  fontSize: 12,
                                                ),
                                              ),
                                            ],
                                          );
                                        },
                                      ),
                                    ),
                                    maxY: bestMaxY.toDouble(),
                                    gridData: FlGridData(
                                      show: true,
                                      drawVerticalLine: false,
                                      horizontalInterval: bestInterval.toDouble(),
                                      getDrawingHorizontalLine: (value) => FlLine(
                                        color: tokens.borderSubtle,
                                        strokeWidth: 1,
                                      ),
                                    ),
                                    borderData: FlBorderData(
                                      show: true,
                                      border: Border(
                                        left: BorderSide(color: tokens.borderSubtle, width: 1),
                                        bottom: BorderSide(color: tokens.borderSubtle, width: 1),
                                      ),
                                    ),
                                    groupsSpace: 12,
                                    barGroups: List.generate(bestDays.length, (index) {
                                      final item = _asMap(bestDays[index]);
                                      final value = _numFromMap(item, const <String>['count']).toDouble();
                                      return BarChartGroupData(
                                        x: index,
                                        barRods: <BarChartRodData>[
                                          BarChartRodData(
                                            toY: value,
                                            width: 18,
                                            borderRadius: const BorderRadius.only(
                                              topLeft: Radius.circular(4),
                                              topRight: Radius.circular(4),
                                            ),
                                            color: const Color(0xFFC9924A),
                                            borderSide: BorderSide(color: const Color(0xFFB77A39), width: 0.5),
                                          ),
                                        ],
                                      );
                                    }),
                                    titlesData: FlTitlesData(
                                      topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                      rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                      leftTitles: AxisTitles(
                                        sideTitles: SideTitles(
                                          showTitles: true,
                                          reservedSize: 28,
                                          interval: bestInterval.toDouble(),
                                          getTitlesWidget: (value, meta) => Text(
                                            value.toInt().toString(),
                                            style: TextStyle(fontSize: 9, color: tokens.textMuted),
                                          ),
                                        ),
                                      ),
                                      bottomTitles: AxisTitles(
                                        sideTitles: SideTitles(
                                          showTitles: true,
                                          reservedSize: 28,
                                          interval: 1,
                                          getTitlesWidget: (value, meta) {
                                            final index = value.toInt();
                                            if (index < 0 || index >= bestDays.length) return const SizedBox.shrink();
                                            if (bestLabelStep > 1 && (index % bestLabelStep) != 0) return const SizedBox.shrink();
                                            final day = _getString(_asMap(bestDays[index]), 'day');
                                            final label = day.isNotEmpty ? (day.length >= 3 ? day.substring(0, 3) : day) : '';
                                            return Padding(
                                              padding: const EdgeInsets.only(top: 8),
                                              child: Text(
                                                label,
                                                style: TextStyle(fontSize: 10, color: tokens.textMuted),
                                              ),
                                            );
                                          },
                                        ),
                                      ),
                                    ),
                                  ),
                                );
                              })
                            : Center(
                                child: Text(
                                  'Complete tasks to see your best days!',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(fontSize: 12, color: tokens.textMuted),
                                ),
                              ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 14),

                _sectionCard(
                  ref,
                  tokens,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text(
                        'PERFORMANCE METRICS',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                          color: tokens.textMuted,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Your productivity overview',
                        style: TextStyle(fontSize: 13, color: tokens.textSecondary),
                      ),
                      const SizedBox(height: 18),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: <Widget>[
                          _circularMetric(
                            tokens,
                            AppSemanticColors.sage,
                            '${completionRate.round()}%',
                            'Completion Rate',
                            completionRate.toDouble(),
                          ),
                          const SizedBox(width: 32),
                          _circularMetric(
                            tokens,
                            AppSemanticColors.primary,
                            '${productivityScore.round()}',
                            'Productivity Score',
                            productivityScore.toDouble(),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      GridView.count(
                        crossAxisCount: 3,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        childAspectRatio: 1.0,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        children: <Widget>[
                          _statBox(tokens, '${performanceMetrics['tasksCompleted'] ?? 0}', 'Completed'),
                          _statBox(tokens, '${_toNum(performanceMetrics['focusTimeToday'])}m', 'Focus Time'),
                          _statBox(tokens, '${performanceMetrics['streak'] ?? 0}', 'Day Streak'),
                          _statBox(tokens, '${performanceMetrics['totalTasks'] ?? 0}', 'Total Tasks'),
                          _statBox(tokens, '${performanceMetrics['inProgress'] ?? 0}', 'In Progress', color: AppSemanticColors.sky),
                          _statBox(tokens, '${performanceMetrics['overdue'] ?? 0}', 'Overdue', color: AppSemanticColors.rose),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 32),
              ],
            );
          },
        ),
      ),
    );
  }
}
