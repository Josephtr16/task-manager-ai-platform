import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

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

    return ConstrainedBox(
      constraints: const BoxConstraints(minWidth: 180, maxWidth: 200),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: tokens.bgSurface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: tokens.borderSubtle),
        ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Icon(Icons.flash_on_rounded, color: tokens.textPrimary, size: 18),
              const SizedBox(width: 6),
              Text(
                'Quick Stats',
                style: AppTextStyles.bodyMedium.copyWith(
                  fontWeight: FontWeight.w700,
                  color: tokens.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
            childAspectRatio: 1.2,
            children: <Widget>[
              _statCell('🔥', urgentCount.toInt(), 'Urgent',
                  AppSemanticColors.rose.withValues(alpha: 0.1), AppSemanticColors.rose),
              _statCell('⚡', highCount.toInt(), 'High',
                  AppSemanticColors.primary.withValues(alpha: 0.1), AppSemanticColors.primary),
              _statCell('🔄', inProgressCount.toInt(), 'Active',
                  AppSemanticColors.sky.withValues(alpha: 0.1), AppSemanticColors.sky),
              _statCell('⚠️', overdueCount.toInt(), 'Overdue',
                  AppSemanticColors.rose.withValues(alpha: 0.08), AppSemanticColors.rose),
            ],
          ),
        ],
      ),
      ),
    );
  }

  Widget _statCell(String emoji, int count, String label, Color bg, Color textColor) {
    return Container(
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: <Widget>[
          Text(emoji, style: const TextStyle(fontSize: 16)),
          Text(
            '$count',
            style: GoogleFonts.inter(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: textColor,
            ),
          ),
          Text(
            label,
            style: AppTextStyles.labelSmall.copyWith(
              fontSize: 9,
              color: textColor.withValues(alpha: 0.8),
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
