import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';
import '../theme/app_theme.dart';

class TfBadge extends StatelessWidget {
  const TfBadge({
    required this.label,
    this.color,
    this.outlined = false,
    this.prefixIcon,
    this.uppercase = false,
    this.size = TfBadgeSize.md,
    super.key,
  });

  final String label;
  final Color? color;
  final bool outlined;
  final IconData? prefixIcon;
  final bool uppercase;
  final TfBadgeSize size;

  factory TfBadge.priority(String priority) {
    final color = AppPriorityColors.colorFor(priority);
    return TfBadge(
      label: priority.toUpperCase(),
      color: color,
      prefixIcon: Icons.flag,
      uppercase: true,
    );
  }

  factory TfBadge.status(String status) {
    final Color color;
    switch (status.toLowerCase().replaceAll('-', ' ')) {
      case 'in progress':
        color = AppColorsShared.accent;
        break;
      case 'completed':
        color = AppColorsShared.sage;
        break;
      case 'not started':
        color = AppColorsShared.sky;
        break;
      default:
        color = AppColorsShared.sky;
    }
    return TfBadge(label: status.toUpperCase(), color: color, uppercase: true);
  }

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final effectiveColor = color ?? tokens.textSecondary;

    return Container(
      padding: size == TfBadgeSize.sm
          ? const EdgeInsets.symmetric(horizontal: 7, vertical: 3)
          : const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: outlined
            ? Colors.transparent
            : color != null
                ? effectiveColor.withValues(alpha: 0.10)
                : tokens.bgRaised,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: color != null ? effectiveColor.withValues(alpha: 0.22) : tokens.borderMedium,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (prefixIcon != null) ...[
            Icon(prefixIcon, size: 10, color: effectiveColor),
            const SizedBox(width: 4),
          ],
          Text(
            uppercase ? label.toUpperCase() : label,
            style: AppTextStyles.labelSmall.copyWith(
              color: effectiveColor,
              letterSpacing: uppercase ? 0.6 : 0.2,
            ),
          ),
        ],
      ),
    );
  }
}

enum TfBadgeSize {
  sm,
  md,
}
