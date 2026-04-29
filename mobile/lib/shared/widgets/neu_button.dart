import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/neu_shadow.dart';

enum NeuButtonVariant { primary, secondary, danger, ghost }
enum NeuButtonSize { sm, md, lg }

class NeuButton extends StatefulWidget {
  const NeuButton({
    super.key,
    required this.label,
    this.onTap,
    this.variant = NeuButtonVariant.primary,
    this.size = NeuButtonSize.md,
    this.loading = false,
    this.icon,
    this.fullWidth = false,
  });

  final String label;
  final VoidCallback? onTap;
  final NeuButtonVariant variant;
  final NeuButtonSize size;
  final bool loading;
  final IconData? icon;
  final bool fullWidth;

  @override
  State<NeuButton> createState() => _NeuButtonState();
}

class _NeuButtonState extends State<NeuButton> {
  bool _pressed = false;

  double get _height {
    switch (widget.size) {
      case NeuButtonSize.sm:
        return 36;
      case NeuButtonSize.lg:
        return 52;
      case NeuButtonSize.md:
        return 44;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final tokens = Theme.of(context).extension<AppColorTokens>()!;

    BoxDecoration decoration;
    Color textColor;

    switch (widget.variant) {
      case NeuButtonVariant.primary:
        decoration = BoxDecoration(
          gradient: const LinearGradient(
            colors: <Color>[AppColors.primary, AppColors.primaryDark],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
          borderRadius: AppRadius.md,
          boxShadow: <BoxShadow>[
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.4),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        );
        textColor = Colors.white;
      case NeuButtonVariant.secondary:
        decoration = BoxDecoration(
          color: tokens.bgSurface,
          borderRadius: AppRadius.md,
          border: Border.all(color: tokens.borderSubtle),
          boxShadow: neuShadow(isDark),
        );
        textColor = tokens.textPrimary;
      case NeuButtonVariant.danger:
        decoration = BoxDecoration(
          color: AppColors.error,
          borderRadius: AppRadius.md,
          boxShadow: <BoxShadow>[
            BoxShadow(
              color: AppColors.error.withValues(alpha: 0.35),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        );
        textColor = Colors.white;
      case NeuButtonVariant.ghost:
        decoration = BoxDecoration(
          color: Colors.transparent,
          borderRadius: AppRadius.md,
          border: Border.all(color: AppColors.primary),
        );
        textColor = AppColors.primary;
    }

    final buttonChild = AnimatedScale(
      scale: _pressed ? 0.96 : 1,
      duration: const Duration(milliseconds: 80),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        height: _height,
        width: widget.fullWidth ? double.infinity : null,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: decoration,
        child: Center(
          child: widget.loading
              ? SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator.adaptive(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(textColor),
                  ),
                )
              : Row(
                  mainAxisSize: MainAxisSize.min,
                  children: <Widget>[
                    if (widget.icon != null) ...<Widget>[
                      Icon(widget.icon, size: 18, color: textColor),
                      const SizedBox(width: 8),
                    ],
                    Text(
                      widget.label,
                      style: TextStyle(
                        color: textColor,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );

    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapCancel: () => setState(() => _pressed = false),
      onTapUp: (_) => setState(() => _pressed = false),
      onTap: widget.loading || widget.onTap == null
          ? null
          : () {
              HapticFeedback.lightImpact();
              widget.onTap!();
            },
      child: buttonChild,
    );
  }
}
