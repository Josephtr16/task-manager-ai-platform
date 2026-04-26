import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_theme.dart';

class TfCard extends StatelessWidget {
  const TfCard({
    required this.child,
    this.padding,
    this.borderRadius,
    this.radius,
    this.elevated = false,
    this.onTap,
    this.borderColor,
    this.border,
    this.backgroundColor,
    super.key,
  });

  final Widget child;
  final EdgeInsetsGeometry? padding;
  final double? borderRadius;
  final double? radius;
  final bool elevated;
  final VoidCallback? onTap;
  final Color? borderColor;
  final Color? border;
  final Color? backgroundColor;

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final bg = backgroundColor ?? tokens.bgSurface;
    final effectiveBorderColor = borderColor ?? border ?? tokens.borderSubtle;
    final effectiveRadius = borderRadius ?? radius ?? 12;

    final shadows = elevated
        ? [
            BoxShadow(
              color: isDark ? const Color(0x8C000000) : const Color(0x143C2D14),
              blurRadius: isDark ? 32 : 16,
              offset: const Offset(0, 8),
            ),
            BoxShadow(
              color: isDark ? const Color(0x66000000) : const Color(0x0A3C2D14),
              blurRadius: isDark ? 8 : 4,
              offset: const Offset(0, 2),
            ),
          ]
        : [
            BoxShadow(
              color: isDark ? const Color(0x73000000) : const Color(0x143C2D14),
              blurRadius: isDark ? 8 : 8,
              offset: const Offset(0, 2),
            ),
            BoxShadow(
              color: isDark ? const Color(0x80000000) : const Color(0x0A3C2D14),
              blurRadius: 2,
              offset: const Offset(0, 1),
            ),
          ];

    Widget card = Container(
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(effectiveRadius),
        border: Border.all(color: effectiveBorderColor, width: 1),
        boxShadow: shadows,
      ),
      padding: padding ?? const EdgeInsets.all(20),
      child: child,
    );

    if (onTap != null) {
      card = Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(effectiveRadius),
        child: InkWell(
          borderRadius: BorderRadius.circular(effectiveRadius),
          splashColor: AppColorsShared.accentDim,
          highlightColor: AppColorsShared.accentDim.withValues(alpha: 0.5),
          onTap: onTap,
          child: card,
        ),
      );
    }

    return card;
  }
}
