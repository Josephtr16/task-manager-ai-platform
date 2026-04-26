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
    final displayValue =
      (isProductivity && !value.contains('%')) ? '$value%' : value;
    final valueFontSize = compact ? 30.0 : 40.0;
    final subtitleFontSize = compact ? 11.0 : 12.0;
    final indicatorRadius = compact ? 22.0 : 28.0;
    final isChartOnlyCard = compact && customContent != null && progress == null;
    final topSpacing = isChartOnlyCard ? 4.0 : (compact ? 6.0 : 10.0);
    final middleSpacing = isChartOnlyCard ? 4.0 : (compact ? 6.0 : 10.0);
    final afterValueSpacing = isChartOnlyCard ? 4.0 : (compact ? 8.0 : 12.0);
    final afterCustomSpacing = isChartOnlyCard ? 0.0 : (compact ? 6.0 : 10.0);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: tokens.bgSurface,
        borderRadius: BorderRadius.circular(20),
        border: Border(
          left: BorderSide(color: accentColor, width: 3.5),
        ),
        boxShadow: <BoxShadow>[
          BoxShadow(
            color: tokens.textPrimary.withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: <Widget>[
              Container(
                width: 34,
                height: 34,
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: accentColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  icon,
                  size: 18,
                  color: accentColor,
                ),
              ),
              if (numericValue > 80)
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: AppSemanticColors.sage,
                    shape: BoxShape.circle,
                    boxShadow: <BoxShadow>[
                      BoxShadow(
                        color: AppSemanticColors.sage.withValues(alpha: 0.5),
                        blurRadius: 6,
                        spreadRadius: 1,
                      ),
                    ],
                  ),
                ),
            ],
          ),
          SizedBox(height: topSpacing),
          Text(
            label.toUpperCase(),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppTextStyles.labelCaps.copyWith(
              color: tokens.textSecondary,
              fontSize: compact ? 10 : 11,
              letterSpacing: compact ? 0.7 : 0.88,
            ),
          ),
          if (subtitle != null) ...<Widget>[
            SizedBox(height: compact ? 2 : 4),
            Text(
              subtitle!,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTextStyles.bodySmall.copyWith(
                color: tokens.textMuted,
                fontSize: subtitleFontSize,
              ),
            ),
          ],
          SizedBox(height: middleSpacing),
          if (!isProductivity)
            Text(
              displayValue,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTextStyles.statValueMd.copyWith(
                fontSize: valueFontSize,
                fontWeight: FontWeight.w800,
                height: 1,
                color: tokens.textPrimary,
              ),
            ),
          if (!isProductivity) SizedBox(height: afterValueSpacing),
          if (customContent != null) ...<Widget>[
            customContent!,
            SizedBox(height: afterCustomSpacing),
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
                        fontSize: valueFontSize,
                        fontWeight: FontWeight.w800,
                        height: 1,
                        color: tokens.textPrimary,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  CircularPercentIndicator(
                    radius: compact ? 22 : indicatorRadius,
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
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: progressValue,
                  backgroundColor: accentColor.withValues(alpha: 0.12),
                  valueColor: AlwaysStoppedAnimation<Color>(accentColor),
                  minHeight: 5,
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
