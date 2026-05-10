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
    final isProductivity = label.toLowerCase().contains('productivity');
    final hasSlash = value.contains('/');
    final displayValue =
        (isProductivity && !value.contains('%')) ? '$value%' : value;

    return Container(
      padding: const EdgeInsets.all(13),
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
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: accentColor.withValues(alpha: 0.10),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: accentColor.withValues(alpha: 0.18),
                    width: 0.8,
                  ),
                ),
                child: Icon(icon, size: 17, color: accentColor),
              ),
              const Spacer(),
              if (progress != null && isProductivity)
                CircularPercentIndicator(
                  radius: 16,
                  lineWidth: 5,
                  percent: progressValue,
                  center: const SizedBox.shrink(),
                  progressColor: AppSemanticColors.primary,
                  backgroundColor:
                      AppSemanticColors.primary.withValues(alpha: 0.10),
                  circularStrokeCap: CircularStrokeCap.round,
                ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            label.toUpperCase(),
            style: AppTextStyles.labelSmall.copyWith(
              color: tokens.textMuted,
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.0,
            ),
          ),
          if (subtitle != null) ...<Widget>[
            const SizedBox(height: 3),
            Text(
              subtitle!,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTextStyles.bodySmall.copyWith(
                color: tokens.textMuted,
                fontSize: 11,
              ),
            ),
          ],
          const SizedBox(height: 6),
          if (customContent != null) ...<Widget>[
            customContent!,
            const SizedBox(height: 4),
          ] else
            Text(
              displayValue,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTextStyles.statValueMd.copyWith(
                fontSize: hasSlash ? 28 : 30,
                fontWeight: FontWeight.w700,
                height: 1,
                color: tokens.textPrimary,
                letterSpacing: -0.5,
              ),
            ),
          if (progress != null && !isProductivity) ...<Widget>[
            const SizedBox(height: 10),
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
