import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';
import 'app_text_styles.dart';

@immutable
class AppColorTokens extends ThemeExtension<AppColorTokens> {
  const AppColorTokens({
    required this.bgBase,
    required this.bgSurface,
    required this.bgRaised,
    required this.bgOverlay,
    required this.borderSubtle,
    required this.borderMedium,
    required this.borderStrong,
    required this.textPrimary,
    required this.textSecondary,
    required this.textMuted,
    required this.textDisabled,
    required this.accent,
    required this.accentDim,
    required this.accentGlow,
    required this.sage,
    required this.rose,
    required this.sky,
  });

  final Color bgBase;
  final Color bgSurface;
  final Color bgRaised;
  final Color bgOverlay;
  final Color borderSubtle;
  final Color borderMedium;
  final Color borderStrong;
  final Color textPrimary;
  final Color textSecondary;
  final Color textMuted;
  final Color textDisabled;
  final Color accent;
  final Color accentDim;
  final Color accentGlow;
  final Color sage;
  final Color rose;
  final Color sky;

  factory AppColorTokens.dark() {
    return const AppColorTokens(
      bgBase: AppColorsDark.bgBase,
      bgSurface: AppColorsDark.bgSurface,
      bgRaised: AppColorsDark.bgRaised,
      bgOverlay: AppColorsDark.bgOverlay,
      borderSubtle: AppColorsDark.borderSubtle,
      borderMedium: AppColorsDark.borderMedium,
      borderStrong: AppColorsDark.borderStrong,
      textPrimary: AppColorsDark.textPrimary,
      textSecondary: AppColorsDark.textSecondary,
      textMuted: AppColorsDark.textMuted,
      textDisabled: AppColorsDark.textDisabled,
      accent: AppColorsShared.accent,
      accentDim: AppColorsShared.accentDim,
      accentGlow: AppColorsShared.accentGlow,
      sage: AppColorsShared.sage,
      rose: AppColorsShared.rose,
      sky: AppColorsShared.sky,
    );
  }

  factory AppColorTokens.light() {
    return const AppColorTokens(
      bgBase: AppColorsLight.bgBase,
      bgSurface: AppColorsLight.bgSurface,
      bgRaised: AppColorsLight.bgRaised,
      bgOverlay: AppColorsLight.bgOverlay,
      borderSubtle: AppColorsLight.borderSubtle,
      borderMedium: AppColorsLight.borderMedium,
      borderStrong: AppColorsLight.borderStrong,
      textPrimary: AppColorsLight.textPrimary,
      textSecondary: AppColorsLight.textSecondary,
      textMuted: AppColorsLight.textMuted,
      textDisabled: AppColorsLight.textDisabled,
      accent: AppColorsShared.accent,
      accentDim: AppColorsShared.accentDim,
      accentGlow: AppColorsShared.accentGlow,
      sage: AppColorsShared.sage,
      rose: AppColorsShared.rose,
      sky: AppColorsShared.sky,
    );
  }

  @override
  AppColorTokens copyWith({
    Color? bgBase,
    Color? bgSurface,
    Color? bgRaised,
    Color? bgOverlay,
    Color? borderSubtle,
    Color? borderMedium,
    Color? borderStrong,
    Color? textPrimary,
    Color? textSecondary,
    Color? textMuted,
    Color? textDisabled,
    Color? accent,
    Color? accentDim,
    Color? accentGlow,
    Color? sage,
    Color? rose,
    Color? sky,
  }) {
    return AppColorTokens(
      bgBase: bgBase ?? this.bgBase,
      bgSurface: bgSurface ?? this.bgSurface,
      bgRaised: bgRaised ?? this.bgRaised,
      bgOverlay: bgOverlay ?? this.bgOverlay,
      borderSubtle: borderSubtle ?? this.borderSubtle,
      borderMedium: borderMedium ?? this.borderMedium,
      borderStrong: borderStrong ?? this.borderStrong,
      textPrimary: textPrimary ?? this.textPrimary,
      textSecondary: textSecondary ?? this.textSecondary,
      textMuted: textMuted ?? this.textMuted,
      textDisabled: textDisabled ?? this.textDisabled,
      accent: accent ?? this.accent,
      accentDim: accentDim ?? this.accentDim,
      accentGlow: accentGlow ?? this.accentGlow,
      sage: sage ?? this.sage,
      rose: rose ?? this.rose,
      sky: sky ?? this.sky,
    );
  }

  @override
  AppColorTokens lerp(
      covariant ThemeExtension<AppColorTokens>? other, double t) {
    if (other is! AppColorTokens) return this;
    return AppColorTokens(
      bgBase: Color.lerp(bgBase, other.bgBase, t) ?? bgBase,
      bgSurface: Color.lerp(bgSurface, other.bgSurface, t) ?? bgSurface,
      bgRaised: Color.lerp(bgRaised, other.bgRaised, t) ?? bgRaised,
      bgOverlay: Color.lerp(bgOverlay, other.bgOverlay, t) ?? bgOverlay,
      borderSubtle:
          Color.lerp(borderSubtle, other.borderSubtle, t) ?? borderSubtle,
      borderMedium:
          Color.lerp(borderMedium, other.borderMedium, t) ?? borderMedium,
      borderStrong:
          Color.lerp(borderStrong, other.borderStrong, t) ?? borderStrong,
      textPrimary: Color.lerp(textPrimary, other.textPrimary, t) ?? textPrimary,
      textSecondary:
          Color.lerp(textSecondary, other.textSecondary, t) ?? textSecondary,
      textMuted: Color.lerp(textMuted, other.textMuted, t) ?? textMuted,
      textDisabled:
          Color.lerp(textDisabled, other.textDisabled, t) ?? textDisabled,
      accent: Color.lerp(accent, other.accent, t) ?? accent,
      accentDim: Color.lerp(accentDim, other.accentDim, t) ?? accentDim,
      accentGlow: Color.lerp(accentGlow, other.accentGlow, t) ?? accentGlow,
      sage: Color.lerp(sage, other.sage, t) ?? sage,
      rose: Color.lerp(rose, other.rose, t) ?? rose,
      sky: Color.lerp(sky, other.sky, t) ?? sky,
    );
  }
}

class AppTheme {
  static const Duration fastAnim = Duration(milliseconds: 150);

  static const BorderRadius radiusSm = BorderRadius.all(Radius.circular(6));
  static const BorderRadius radiusMd = BorderRadius.all(Radius.circular(8));
  static const BorderRadius radiusLg = BorderRadius.all(Radius.circular(12));
  static const BorderRadius radiusXl = BorderRadius.all(Radius.circular(16));

  static final AppColorTokens darkTokens = AppColorTokens.dark();
  static final AppColorTokens lightTokens = AppColorTokens.light();

  static final ThemeData darkTheme = _buildTheme(Brightness.dark, darkTokens);
  static final ThemeData lightTheme = _buildTheme(Brightness.light, lightTokens);

  static ThemeData _buildTheme(Brightness brightness, AppColorTokens tokens) {
    final isDark = brightness == Brightness.dark;
    final textTheme = GoogleFonts.dmSansTextTheme().apply(
      bodyColor: tokens.textPrimary,
      displayColor: tokens.textPrimary,
    ).copyWith(
      headlineLarge: AppTextStyles.displayLarge.copyWith(
        color: tokens.textPrimary,
      ),
      headlineMedium: AppTextStyles.displayMedium.copyWith(
        color: tokens.textPrimary,
      ),
      headlineSmall: AppTextStyles.titleLarge.copyWith(
        color: tokens.textPrimary,
      ),
      titleLarge: AppTextStyles.labelMedium.copyWith(
        fontSize: 18,
        fontWeight: FontWeight.w700,
        color: tokens.textPrimary,
      ),
      titleMedium: AppTextStyles.labelMedium.copyWith(
        fontSize: 15,
        color: tokens.textPrimary,
      ),
      titleSmall: AppTextStyles.labelMedium.copyWith(
        color: tokens.textPrimary,
      ),
      bodyLarge: AppTextStyles.bodyLarge.copyWith(
        color: tokens.textPrimary,
      ),
      bodyMedium: AppTextStyles.bodyMedium.copyWith(
        color: tokens.textPrimary,
      ),
      bodySmall: AppTextStyles.bodySmall.copyWith(
        color: tokens.textSecondary,
      ),
      labelMedium: AppTextStyles.labelMedium.copyWith(
        color: tokens.textSecondary,
      ),
      labelSmall: AppTextStyles.labelSmall.copyWith(
        color: tokens.textSecondary,
      ),
    );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      scaffoldBackgroundColor: tokens.bgBase,
      cardColor: tokens.bgSurface,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColorsShared.accent,
        brightness: brightness,
        primary: AppColorsShared.accent,
      ).copyWith(
        primary: AppColorsShared.accent,
        secondary: AppColorsShared.accentLight,
        surface: tokens.bgSurface,
      ),
      textTheme: textTheme,
      extensions: <ThemeExtension<dynamic>>[tokens],
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: tokens.bgRaised,
        border: OutlineInputBorder(
          borderRadius: radiusMd,
          borderSide: BorderSide(color: tokens.borderSubtle),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: radiusMd,
          borderSide: BorderSide(color: tokens.borderSubtle),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: radiusMd,
          borderSide: BorderSide(color: tokens.borderStrong),
        ),
      ),
      dividerColor: tokens.borderSubtle,
      iconTheme: IconThemeData(color: tokens.textSecondary),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        foregroundColor: tokens.textPrimary,
        elevation: 0,
      ),
      chipTheme: ChipThemeData(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
        side: BorderSide(color: tokens.borderSubtle),
        backgroundColor: tokens.bgRaised,
        selectedColor: tokens.accentDim,
        labelStyle: GoogleFonts.dmSans(
            fontSize: 11,
            color: tokens.textSecondary,
            fontWeight: FontWeight.w700),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: tokens.bgSurface,
        indicatorColor: tokens.accentDim,
        elevation: 0,
        iconTheme: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return IconThemeData(
              color: selected ? tokens.accent : tokens.textSecondary, size: 22);
        }),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return GoogleFonts.dmSans(
            fontSize: 12,
            color: selected ? tokens.textPrimary : tokens.textSecondary,
            fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
          );
        }),
      ),
      shadowColor: isDark ? const Color(0x8C000000) : const Color(0x30000000),
    );
  }
}
