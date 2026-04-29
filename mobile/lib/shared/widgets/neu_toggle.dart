import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_theme.dart';

class NeuToggle extends StatelessWidget {
  const NeuToggle({
    super.key,
    required this.leftLabel,
    required this.rightLabel,
    required this.isLeftSelected,
    required this.onChanged,
  });

  final String leftLabel;
  final String rightLabel;
  final bool isLeftSelected;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;

    Widget segment(String label, bool selected, bool left) {
      return Expanded(
        child: GestureDetector(
          onTap: () => onChanged(left),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 160),
            curve: Curves.easeOut,
            padding: const EdgeInsets.symmetric(vertical: 10),
            decoration: BoxDecoration(
              color: selected ? tokens.bgSurface : Colors.transparent,
              borderRadius: AppRadius.full,
              border: selected
                  ? Border.all(color: tokens.borderSubtle)
                  : Border.all(color: Colors.transparent),
            ),
            child: Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: selected ? AppColors.primary : tokens.textSecondary,
              ),
            ),
          ),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: tokens.bgRaised,
        borderRadius: AppRadius.full,
        border: Border.all(color: tokens.borderSubtle),
      ),
      child: Row(
        children: <Widget>[
          segment(leftLabel, isLeftSelected, true),
          segment(rightLabel, !isLeftSelected, false),
        ],
      ),
    );
  }
}
