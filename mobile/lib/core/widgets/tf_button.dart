import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';
import '../theme/app_theme.dart';

enum TfButtonVariant { primary, secondary, ghost, danger }

class TfButton extends StatefulWidget {
  const TfButton({
    required this.label,
    this.onPressed,
    this.variant = TfButtonVariant.primary,
    this.isLoading = false,
    this.icon,
    this.width,
    super.key,
  });

  final String label;
  final VoidCallback? onPressed;
  final TfButtonVariant variant;
  final bool isLoading;
  final IconData? icon;
  final double? width;

  @override
  State<TfButton> createState() => _TfButtonState();
}

class _TfButtonState extends State<TfButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    Color bg;
    Color textColor;
    Border border;
    List<BoxShadow> shadows = [];

    switch (widget.variant) {
      case TfButtonVariant.primary:
        bg = AppColorsShared.accent;
        textColor = Colors.white;
        border = Border.all(color: Colors.transparent);
        shadows = [
          BoxShadow(
            color: AppColorsShared.accentGlow,
            blurRadius: _pressed ? 8 : 16,
            offset: const Offset(0, 4),
          ),
        ];
        break;
      case TfButtonVariant.secondary:
        bg = tokens.bgRaised;
        textColor = tokens.textPrimary;
        border = Border.all(color: tokens.borderMedium);
        break;
      case TfButtonVariant.ghost:
        bg = Colors.transparent;
        textColor = AppColorsShared.accent;
        border = Border.all(color: Colors.transparent);
        break;
      case TfButtonVariant.danger:
        bg = isDark
            ? AppColorsShared.rose.withValues(alpha: 0.12)
            : AppColorsShared.rose.withValues(alpha: 0.08);
        textColor = AppColorsShared.rose;
        border = Border.all(color: AppColorsShared.rose.withValues(alpha: 0.25));
        break;
    }

    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      onTap: widget.isLoading ? null : widget.onPressed,
      child: AnimatedScale(
        scale: _pressed ? 0.97 : 1.0,
        duration: const Duration(milliseconds: 120),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 120),
          width: widget.width,
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(8),
            border: border,
            boxShadow: shadows,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Row(
            mainAxisSize: widget.width != null ? MainAxisSize.max : MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (widget.isLoading)
                SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: textColor,
                  ),
                )
              else ...[
                if (widget.icon != null) ...[
                  Icon(widget.icon, size: 14, color: textColor),
                  const SizedBox(width: 6),
                ],
                Text(
                  widget.label,
                  style: AppTextStyles.buttonText.copyWith(color: textColor),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
