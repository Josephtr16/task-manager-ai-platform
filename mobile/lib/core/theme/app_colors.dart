import 'package:flutter/material.dart';

// ─── Legacy class — kept for backward compatibility only.
// All new code should use AppColorsShared, AppSemanticColors, or AppPriorityColors.
class AppColors {
  static const darkBgMain      = AppColorsDark.bgBase;
  static const darkBgElevated  = AppColorsDark.bgRaised;
  static const darkBgCard      = AppColorsDark.bgSurface;
  static const darkTextPrimary   = AppColorsDark.textPrimary;
  static const darkTextSecondary = AppColorsDark.textSecondary;
  static const darkTextMuted     = AppColorsDark.textMuted;
  static const darkBorder        = AppColorsDark.borderSubtle;

  static const lightBgMain       = AppColorsLight.bgBase;
  static const lightBgElevated   = AppColorsLight.bgRaised;
  static const lightBgCard       = AppColorsLight.bgSurface;
  static const lightTextPrimary   = AppColorsLight.textPrimary;
  static const lightTextSecondary = AppColorsLight.textSecondary;
  static const lightTextMuted     = AppColorsLight.textMuted;
  static const lightBorder        = AppColorsLight.borderSubtle;

  static const primary     = AppColorsShared.accent;
  static const primaryDark = AppColorsShared.accentDark;

  static const success = AppColorsShared.sage;
  static const warning = AppColorsShared.accent;
  static const error   = AppColorsShared.rose;
  static const info    = AppColorsShared.sky;
  static const urgent  = AppColorsShared.rose;
  static const high    = AppColorsShared.accent;
  static const medium  = AppColorsShared.sky;
  static const low     = AppColorsShared.sage;
}

class AppColorsDark {
  static const bgBase      = Color(0xFF181614);
  static const bgSurface   = Color(0xFF1E1E1E);
  static const bgRaised    = Color(0xFF262626);
  static const bgOverlay   = Color(0xFF302C28);
  static const borderSubtle  = Color(0x20FFF8EB);
  static const borderMedium  = Color(0x33FFF8EB);
  static const borderStrong  = Color(0x50FFF8EB);
  static const textPrimary   = Color(0xFFF5F0E8);
  static const textSecondary = Color(0xFF8A8070);
  static const textMuted     = Color(0xFF4A4540);
  static const textDisabled  = Color(0xFF302C28);
}

class AppColorsLight {
  static const bgBase      = Color(0xFFFAF7F2);
  static const bgSurface   = Color(0xFFFFFFFF);
  static const bgRaised    = Color(0xFFF2EDE4);
  static const bgOverlay   = Color(0xFFEDE6DA);
  static const borderSubtle  = Color(0x12481E00);
  static const borderMedium  = Color(0x1E3C2D14);
  static const borderStrong  = Color(0x383C2D14);
  static const textPrimary   = Color(0xFF1A1410);
  static const textSecondary = Color(0xFF6B5E4A);
  static const textMuted     = Color(0xFFA8977E);
  static const textDisabled  = Color(0xFFBFB29B);
}

class AppColorsShared {
  static const accent      = Color(0xFFC9924A);
  static const accentDark  = Color(0xFFA97533);
  static const accentLight = Color(0xFFE0B56F);
  static const accentDim   = Color(0x1FC9924A);
  static const accentGlow  = Color(0x40C9924A);
  static const copper      = Color(0xFFB87355);
  static const sage        = Color(0xFF5E8A6E);
  static const rose        = Color(0xFFB85C5C);
  static const sky         = Color(0xFF5A7FA0);
}

class AppSemanticColors {
  static const primary      = AppColorsShared.accent;
  static const primaryDark  = AppColorsShared.accentDark;
  static const primaryLight = AppColorsShared.accentLight;
  static const accent       = AppColorsShared.accent;
  static const accentDark   = AppColorsShared.accentDark;
  static const accentDim    = AppColorsShared.accentDim;
  static const accentGlow   = AppColorsShared.accentGlow;
  static const copper       = AppColorsShared.copper;
  static const sage         = AppColorsShared.sage;
  static const rose         = AppColorsShared.rose;
  static const sky          = AppColorsShared.sky;
  static const priorityHigh = AppColorsShared.accent;
  static const priorityLow  = AppColorsShared.sage;
}

class AppPriorityColors {
  static Color colorFor(String? priority) {
    switch ((priority ?? '').toLowerCase()) {
      case 'urgent': return AppSemanticColors.rose;
      case 'high':   return AppSemanticColors.primary;
      case 'low':    return AppSemanticColors.sage;
      case 'medium':
      default:       return AppSemanticColors.sky;
    }
  }

  static Color backgroundFor(String? priority, {double alpha = 0.12}) {
    return colorFor(priority).withValues(alpha: alpha);
  }
}