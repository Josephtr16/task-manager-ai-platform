import 'package:flutter/material.dart';
import 'package:percent_indicator/circular_percent_indicator.dart';
import 'package:shimmer/shimmer.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/theme/app_theme.dart';

class StatsCard extends StatelessWidget {
  const StatsCard({
    super.key,
    required this.label,
    required this.value,
    this.subtitle,
    this.progress,
    this.progressColor,
    this.iconColor,
    this.icon = Icons.analytics_outlined,
    this.customContent,
    this.compact = false,
  });

  final String label;
  final String value;
  final String? subtitle;
  final double? progress;
  final Color? progressColor;
  final Color? iconColor;
  final IconData icon;
  final Widget? customContent;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final accentColor = iconColor ?? progressColor ?? AppSemanticColors.primary;
    final progressValue = (progress ?? 0).clamp(0.0, 1.0).toDouble();
    final numericValue =
        double.tryParse(value.replaceAll(RegExp(r'[^0-9.]'), '')) ?? 0;
    final isProductivity = label.toLowerCase().contains('productivity');
    final hasSlash = value.contains('/');
    final displayValue =
      (isProductivity && !value.contains('%')) ? '$value%' : value;
    final isChartOnlyCard = compact && customContent != null && progress == null;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: tokens.bgSurface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: tokens.borderSubtle, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: accentColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  icon,
                  size: 16,
                  color: accentColor,
                ),
              ),
              const Spacer(),
              if (numericValue > 80)
                Container(
                  width: 6,
                  height: 6,
                  decoration: BoxDecoration(
                    color: AppSemanticColors.sage,
                    shape: BoxShape.circle,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            label.toUpperCase(),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppTextStyles.labelSmall.copyWith(
              color: tokens.textMuted,
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.08,
            ),
          ),
          if (subtitle != null) ...<Widget>[
            const SizedBox(height: 4),
            Text(
              subtitle!,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTextStyles.bodySmall.copyWith(
                color: tokens.textSecondary,
                fontSize: 11,
              ),
            ),
          ],
          const SizedBox(height: 6),
          if (!isProductivity)
            Text(
              displayValue,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTextStyles.statValueMd.copyWith(
                fontSize: hasSlash ? 20 : 28,
                fontWeight: FontWeight.w800,
                height: 1,
                color: tokens.textPrimary,
              ),
            ),
          if (!isProductivity) const SizedBox(height: 10),
          if (customContent != null) ...<Widget>[
            customContent!,
            const SizedBox(height: 8),
          ],
          if (progress != null) ...<Widget>[
            if (isProductivity)
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: <Widget>[
                  Expanded(
                    child: Text(
                      displayValue,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTextStyles.statValueMd.copyWith(
                        fontSize: hasSlash ? 20 : 28,
                        fontWeight: FontWeight.w800,
                        height: 1,
                        color: tokens.textPrimary,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  CircularPercentIndicator(
                    radius: 18,
                    lineWidth: 6,
                    percent: progressValue,
                    center: const SizedBox.shrink(),
                    progressColor: AppSemanticColors.primary,
                    backgroundColor:
                        AppSemanticColors.primary.withValues(alpha: 0.12),
                    circularStrokeCap: CircularStrokeCap.round,
                  ),
                ],
              )
            else
              ClipRRect(
                borderRadius: BorderRadius.circular(99),
                child: LinearProgressIndicator(
                  value: progressValue,
                  backgroundColor: tokens.bgOverlay,
                  valueColor: AlwaysStoppedAnimation<Color>(accentColor),
                  minHeight: 3,
                ),
              ),
          ],
        ],
      ),
    );
  }
}

class StatsCardSkeleton extends StatelessWidget {
  const StatsCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;

    return Shimmer.fromColors(
      baseColor: tokens.bgSurface,
      highlightColor: tokens.bgOverlay,
      child: Container(
        height: 130,
        decoration: BoxDecoration(
          color: tokens.bgSurface,
          borderRadius: BorderRadius.circular(20),
        ),
      ),
    );
  }
}
