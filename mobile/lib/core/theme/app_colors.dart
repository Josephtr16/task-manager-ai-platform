import 'package:flutter/material.dart';

class AppColors {
  // Dark mode
  static const darkBgMain = Color(0xFF212529);
  static const darkBgElevated = Color(0xFF1A1D21);
  static const darkBgCard = Color(0xFF212529);
  static const darkTextPrimary = Color(0xFFF3F4F6);
  static const darkTextSecondary = Color(0xFF9CA3AF);
  static const darkTextMuted = Color(0xFF6B7280);
  static const darkBorder = Color(0x0DFFFFFF);

  // Light mode
  static const lightBgMain = Color(0xFFF3F4F6);
  static const lightBgElevated = Color(0xFFE9EAEC);
  static const lightBgCard = Color(0xFFF3F4F6);
  static const lightTextPrimary = Color(0xFF1F2937);
  static const lightTextSecondary = Color(0xFF4B5563);
  static const lightTextMuted = Color(0xFF9CA3AF);
  static const lightBorder = Color(0x0D000000);

  // Shared accents
  static const primary = Color(0xFF6366F1);
  static const primaryDark = Color(0xFF4F46E5);
  static const aiPurple = Color(0xFF8B7FFF);
  static const success = Color(0xFF10B981);
  static const warning = Color(0xFFF59E0B);
  static const error = Color(0xFFEF4444);
  static const info = Color(0xFF3B82F6);
  static const urgent = Color(0xFFEF4444);
  static const high = Color(0xFFFF6B6B);
  static const medium = Color(0xFFF59E0B);
  static const low = Color(0xFF10B981);
}

class AppColorsDark {
  static const bgBase = Color(0xFF0A0908);
  static const bgSurface = Color(0xFF121110);
  static const bgRaised = Color(0xFF1C1A18);
  static const bgOverlay = Color(0xFF242220);
  static const borderSubtle = Color(0x0FFFF8EB);
  static const borderMedium = Color(0x1CFFF8EB);
  static const borderStrong = Color(0x33FFF8EB);
  static const textPrimary = Color(0xFFF5F0E8);
  static const textSecondary = Color(0xFF8A8070);
  static const textMuted = Color(0xFF4A4540);
  static const textDisabled = Color(0xFF302C28);
}

class AppColorsLight {
  static const bgBase = Color(0xFFFAF7F2);
  static const bgSurface = Color(0xFFFFFFFF);
  static const bgRaised = Color(0xFFF2EDE4);
  static const bgOverlay = Color(0xFFEDE6DA);
  static const borderSubtle = Color(0x12481E00);
  static const borderMedium = Color(0x1E3C2D14);
  static const borderStrong = Color(0x383C2D14);
  static const textPrimary = Color(0xFF1A1410);
  static const textSecondary = Color(0xFF6B5E4A);
  static const textMuted = Color(0xFFA8977E);
  static const textDisabled = Color(0xFFBFB29B);
}

class AppColorsShared {
  static const accent = Color(0xFFC9924A);
  static const accentDark = Color(0xFFA97533);
  static const accentLight = Color(0xFFE0B56F);
  static const accentDim = Color(0x1FC9924A);
  static const accentGlow = Color(0x40C9924A);
  static const copper = Color(0xFFB87355);
  static const sage = Color(0xFF5E8A6E);
  static const rose = Color(0xFFB85C5C);
  static const sky = Color(0xFF5A7FA0);
}

class AppSemanticColors {
  static const primary = AppColorsShared.accent;
  static const primaryDark = AppColorsShared.accentDark;
  static const primaryLight = AppColorsShared.accentLight;
  static const accentDim = AppColorsShared.accentDim;
  static const accentGlow = AppColorsShared.accentGlow;
  static const copper = AppColorsShared.copper;
  static const sage = AppColorsShared.sage;
  static const rose = AppColorsShared.rose;
  static const sky = AppColorsShared.sky;
  static const priorityHigh = AppColorsShared.accent;
  static const priorityLow = AppColorsShared.sage;
}

class AppPriorityColors {
  static Color colorFor(String? priority) {
    switch ((priority ?? '').toLowerCase()) {
      case 'urgent':
        return AppSemanticColors.rose;
      case 'high':
        return AppSemanticColors.primary;
      case 'low':
        return AppSemanticColors.sage;
      case 'medium':
      default:
        return AppSemanticColors.sky;
    }
  }

  static Color backgroundFor(String? priority, {double alpha = 0.12}) {
    return colorFor(priority).withValues(alpha: alpha);
  }
}
