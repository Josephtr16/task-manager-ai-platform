import 'package:flutter/material.dart';

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
