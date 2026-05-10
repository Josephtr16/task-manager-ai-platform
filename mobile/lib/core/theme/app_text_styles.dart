import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTextStyles {
  static TextStyle greetingTitle = GoogleFonts.fraunces(
    fontSize: 44,
    fontWeight: FontWeight.w700,
    letterSpacing: -1.32,
    height: 1.05,
  );

  static TextStyle greetingItalic = GoogleFonts.fraunces(
    fontSize: 32,
    fontStyle: FontStyle.italic,
    fontWeight: FontWeight.w300,
    letterSpacing: -1.32,
    height: 1.05,
  );

  static TextStyle greetingName = GoogleFonts.fraunces(
    fontSize: 32,
    fontWeight: FontWeight.w600,
    letterSpacing: -1.32,
    height: 1.05,
  );

  static TextStyle displayLarge = GoogleFonts.syne(
    fontSize: 32,
    fontWeight: FontWeight.w800,
    letterSpacing: -1.0,
  );

  static TextStyle displayMedium = GoogleFonts.syne(
    fontSize: 24,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.5,
  );

  static TextStyle titleLarge = GoogleFonts.syne(
    fontSize: 21,
    fontWeight: FontWeight.w700,
  );

  static TextStyle statValue = GoogleFonts.fraunces(
    fontSize: 44,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.8,
    height: 1.0,
  );

  static TextStyle statValueMd = GoogleFonts.fraunces(
    fontSize: 34,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.5,
  );

  static TextStyle labelCaps = GoogleFonts.fraunces(
    fontSize: 12,
    fontWeight: FontWeight.w700,
    letterSpacing: 0.88,
  );

  static TextStyle bodyLarge = GoogleFonts.dmSans(
    fontSize: 17,
    fontWeight: FontWeight.w500,
  );

  static TextStyle bodyMedium = GoogleFonts.dmSans(
    fontSize: 15,
    fontWeight: FontWeight.w500,
    letterSpacing: 0,
  );

  static TextStyle bodySmall = GoogleFonts.dmSans(
    fontSize: 13,
    fontWeight: FontWeight.w500,
    letterSpacing: 0,
  );

  static TextStyle labelMedium = GoogleFonts.dmSans(
    fontSize: 14,
    fontWeight: FontWeight.w600,
  );

  static TextStyle labelSmall = GoogleFonts.dmSans(
    fontSize: 12,
    fontWeight: FontWeight.w600,
  );

  static TextStyle buttonText = GoogleFonts.dmSans(
    fontSize: 15,
    fontWeight: FontWeight.w600,
  );
}
