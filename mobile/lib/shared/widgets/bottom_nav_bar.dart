import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';

class BottomNavBar extends StatelessWidget {
  const BottomNavBar({
    super.key,
    required this.currentIndex,
    required this.onTabSelected,
    required this.onFabTap,
  });

  final int currentIndex;
  final ValueChanged<int> onTabSelected;
  final VoidCallback onFabTap;

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final bottomInset = MediaQuery.of(context).padding.bottom;

    Widget tabItem({
      required int navIndex,
      required IconData icon,
      required VoidCallback onTap,
    }) {
      final active = currentIndex == navIndex;
      return Expanded(
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () {
            HapticFeedback.lightImpact();
            onTap();
          },
          child: SizedBox(
            height: 72,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: <Widget>[
                Icon(
                  icon,
                  size: 24,
                  color: active ? AppSemanticColors.primary : tokens.textMuted,
                ),
                const SizedBox(height: 4),
                AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  width: 4,
                  height: 4,
                  decoration: BoxDecoration(
                    color:
                        active ? AppSemanticColors.primary : Colors.transparent,
                    shape: BoxShape.circle,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Container(
      height: 72 + bottomInset,
      padding: EdgeInsets.only(bottom: bottomInset),
      decoration: BoxDecoration(
        color: tokens.bgSurface,
        border: Border(
          top: BorderSide(color: tokens.borderSubtle, width: 0.5),
        ),
      ),
      child: Row(
        children: <Widget>[
          tabItem(
            navIndex: 0,
            icon: Icons.home_rounded,
            onTap: () => onTabSelected(0),
          ),
          tabItem(
            navIndex: 1,
            icon: Icons.checklist_rounded,
            onTap: () => onTabSelected(1),
          ),
          Expanded(
            child: Center(
              child: GestureDetector(
                onTap: () {
                  HapticFeedback.mediumImpact();
                  onFabTap();
                },
                child: Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppSemanticColors.primary,
                    boxShadow: <BoxShadow>[
                      BoxShadow(
                        color: AppSemanticColors.primary.withValues(
                          alpha: 0.35,
                        ),
                        blurRadius: 14,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: const Icon(Icons.add, color: Colors.white, size: 28),
                ),
              ),
            ),
          ),
          tabItem(
            navIndex: 2,
            icon: Icons.folder_rounded,
            onTap: () => onTabSelected(2),
          ),
          tabItem(
            navIndex: 4,
            icon: Icons.more_horiz_rounded,
            onTap: () => onTabSelected(4),
          ),
        ],
      ),
    );
  }
}
