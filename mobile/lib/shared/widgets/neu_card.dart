import 'package:flutter/material.dart';

import '../../core/theme/app_radius.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/neu_shadow.dart';

class NeuCard extends StatelessWidget {
  const NeuCard({
    super.key,
    required this.child,
    this.inset = false,
    this.onTap,
    this.padding,
    this.borderRadius,
  });

  final Widget child;
  final bool inset;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry? padding;
  final BorderRadius? borderRadius;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final tokens = Theme.of(context).extension<AppColorTokens>()!;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        curve: Curves.easeOut,
        decoration: BoxDecoration(
          color: tokens.bgSurface,
          borderRadius: borderRadius ?? AppRadius.lg,
          border: Border.all(color: tokens.borderSubtle),
          boxShadow: inset ? neuShadowInset(isDark) : neuShadow(isDark),
        ),
        padding: padding ?? const EdgeInsets.all(AppSpacing.md),
        child: child,
      ),
    );
  }
}
