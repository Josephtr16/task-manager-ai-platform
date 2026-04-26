import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';
import '../theme/app_theme.dart';

class TfInput extends StatefulWidget {
  const TfInput({
    super.key,
    this.label,
    this.hint,
    this.controller,
    this.keyboardType,
    this.obscureText = false,
    this.prefixIcon,
    this.suffixIcon,
    this.maxLines = 1,
    this.enabled = true,
    this.errorText,
    this.onChanged,
  });

  final String? label;
  final String? hint;
  final TextEditingController? controller;
  final TextInputType? keyboardType;
  final bool obscureText;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final int maxLines;
  final bool enabled;
  final String? errorText;
  final ValueChanged<String>? onChanged;

  @override
  State<TfInput> createState() => _TfInputState();
}

class _TfInputState extends State<TfInput> {
  late final FocusNode _focusNode;
  bool _focused = false;

  @override
  void initState() {
    super.initState();
    _focusNode = FocusNode();
    _focusNode.addListener(_handleFocusChanged);
  }

  void _handleFocusChanged() {
    if (!mounted) return;
    setState(() => _focused = _focusNode.hasFocus);
  }

  @override
  void dispose() {
    _focusNode.removeListener(_handleFocusChanged);
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        if (widget.label != null) ...<Widget>[
          Text(
            widget.label!.toUpperCase(),
            style: AppTextStyles.labelCaps.copyWith(
              color: tokens.textSecondary,
            ),
          ),
          const SizedBox(height: 6),
        ],
        AnimatedContainer(
          duration: const Duration(milliseconds: 120),
          decoration: BoxDecoration(
            boxShadow: _focused
                ? const [
                    BoxShadow(
                      color: AppColorsShared.accentDim,
                      blurRadius: 0,
                      spreadRadius: 3,
                    ),
                  ]
                : const [],
            borderRadius: BorderRadius.circular(8),
          ),
          child: TextField(
            focusNode: _focusNode,
            controller: widget.controller,
            keyboardType: widget.keyboardType,
            obscureText: widget.obscureText,
            maxLines: widget.maxLines,
            enabled: widget.enabled,
            onChanged: widget.onChanged,
            decoration: InputDecoration(
              filled: true,
              fillColor: tokens.bgRaised,
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              hintText: widget.hint,
              errorText: widget.errorText,
              prefixIcon: widget.prefixIcon,
              suffixIcon: widget.suffixIcon,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: tokens.borderSubtle),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: tokens.borderSubtle),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: tokens.borderStrong, width: 1),
              ),
              hintStyle: GoogleFonts.dmSans(
                color: tokens.textMuted,
                fontSize: 14,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
