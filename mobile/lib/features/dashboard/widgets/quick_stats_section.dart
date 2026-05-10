import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/theme/app_theme.dart';

class QuickStatsSection extends StatelessWidget {
  const QuickStatsSection({super.key, required this.stats});

  final Map<String, dynamic> stats;

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final urgentCount = (stats['urgent'] ?? 0) as num;
    final highCount = (stats['highPriority'] ?? 0) as num;
    final inProgressCount = (stats['inProgress'] ?? 0) as num;
    final overdueCount = (stats['overdue'] ?? 0) as num;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: tokens.bgSurface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: tokens.borderSubtle, width: 0.8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
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
                  color: tokens.textPrimary.withValues(alpha: 0.07),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(Icons.flash_on_rounded,
                    color: tokens.textPrimary, size: 16),
              ),
              const SizedBox(width: 8),
              Text(
                'Quick Stats',
                style: AppTextStyles.bodyMedium.copyWith(
                  fontWeight: FontWeight.w700,
                  color: tokens.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 9),
          Row(
            children: <Widget>[
              Expanded(
                child: _statCell(
                  context,
                  count: urgentCount.toInt(),
                  label: 'Urgent',
                  bg: AppSemanticColors.rose.withValues(alpha: 0.08),
                  valueColor: AppSemanticColors.rose,
                  tokens: tokens,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _statCell(
                  context,
                  count: highCount.toInt(),
                  label: 'High',
                  bg: AppSemanticColors.primary.withValues(alpha: 0.08),
                  valueColor: AppSemanticColors.primary,
                  tokens: tokens,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _statCell(
                  context,
                  count: inProgressCount.toInt(),
                  label: 'Active',
                  bg: AppSemanticColors.sky.withValues(alpha: 0.08),
                  valueColor: AppSemanticColors.sky,
                  tokens: tokens,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _statCell(
                  context,
                  count: overdueCount.toInt(),
                  label: 'Overdue',
                  bg: AppSemanticColors.rose.withValues(alpha: 0.06),
                  valueColor: AppSemanticColors.rose,
                  tokens: tokens,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _statCell(
    BuildContext context, {
    required int count,
    required String label,
    required Color bg,
    required Color valueColor,
    required AppColorTokens tokens,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 9, horizontal: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: <Widget>[
          Text(
            '$count',
            style: AppTextStyles.statValueMd.copyWith(
              fontSize: 24,
              fontWeight: FontWeight.w800,
              color: valueColor,
              height: 1,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            label,
            style: AppTextStyles.labelSmall.copyWith(
              fontSize: 10,
              color: valueColor.withValues(alpha: 0.75),
              fontWeight: FontWeight.w700,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }
}
