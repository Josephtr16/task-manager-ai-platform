import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/theme/app_theme.dart';

class DailyStandupBanner extends StatelessWidget {
  const DailyStandupBanner({
    super.key,
    required this.report,
    required this.onDismiss,
  });

  final Map<String, dynamic> report;
  final VoidCallback onDismiss;

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final summary = '${report['summary'] ?? ''}'.trim();
    final rate = '${report['completion_rate_label'] ?? 'Standup ready'}';

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: <Color>[
            AppSemanticColors.primary.withValues(alpha: 0.08),
            AppSemanticColors.sky.withValues(alpha: 0.08),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: AppSemanticColors.primary.withValues(alpha: 0.15),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Text(
                'Daily AI Standup',
                style: AppTextStyles.bodyMedium.copyWith(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: tokens.textPrimary,
                ),
              ),
              const Spacer(),
              IconButton(
                onPressed: onDismiss,
                icon: Icon(Icons.close, color: tokens.textMuted),
              ),
            ],
          ),
          Text(
            rate,
            style: AppTextStyles.bodyMedium.copyWith(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: tokens.textPrimary,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            summary.isEmpty ? 'Your daily standup is ready.' : summary,
            style: AppTextStyles.bodySmall.copyWith(
              fontSize: 12,
              color: tokens.textSecondary,
            ),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: <Widget>[
              _chip(tokens, 'AI Summary'),
              _chip(tokens, '${report['focus'] ?? 'Focus'}'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _chip(AppColorTokens tokens, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: tokens.bgSurface,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: tokens.borderSubtle),
      ),
      child: Text(
        label,
        style: AppTextStyles.labelSmall.copyWith(color: tokens.textSecondary),
      ),
    );
  }
}
