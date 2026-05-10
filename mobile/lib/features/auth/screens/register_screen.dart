import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/widgets/tf_button.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_colors.dart';
import '../providers/auth_provider.dart';
import '../../settings/providers/settings_provider.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen>
    with SingleTickerProviderStateMixin {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  String? _error;
  bool _loading = false;
  bool _showPassword = false;
  bool _showConfirmPassword = false;

  late AnimationController _animController;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    )..forward();
    _fadeAnim = CurvedAnimation(parent: _animController, curve: Curves.easeOut);
    _slideAnim = Tween<Offset>(
      begin: const Offset(0, 0.03),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _animController, curve: Curves.easeOut));
  }

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    _confirm.dispose();
    _animController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final emailRegex = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
    if (_name.text.trim().isEmpty) {
      setState(() => _error = 'Please enter your full name.');
      return;
    }
    if (!emailRegex.hasMatch(_email.text.trim())) {
      setState(() => _error = 'Please enter a valid email address.');
      return;
    }
    if (_password.text.length < 6) {
      setState(() => _error = 'Password must be at least 6 characters.');
      return;
    }
    if (_password.text != _confirm.text) {
      setState(() => _error = 'Passwords do not match.');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      await ref.read(authProvider.notifier).register(
        _name.text.trim(), _email.text.trim(), _password.text,
      );
      if (mounted) context.go('/login');
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final settings = ref.watch(settingsProvider);

    return Scaffold(
      backgroundColor: tokens.bgBase,
      body: SafeArea(
        child: Stack(
          children: [
            Positioned.fill(
              child: FadeTransition(
                opacity: _fadeAnim,
                child: SlideTransition(
                  position: _slideAnim,
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 28),
                    child: ConstrainedBox(
                      constraints: BoxConstraints(
                        minHeight: MediaQuery.of(context).size.height
                            - MediaQuery.of(context).padding.top
                            - MediaQuery.of(context).padding.bottom,
                      ),
                      child: IntrinsicHeight(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 36),

                            // ── Brand mark ──
                            Center(
                              child: Image.asset(
                                'assets/images/tudu-logo.png',
                                width: 200,
                                height: 200,
                                fit: BoxFit.contain,
                              ),
                            ),

                            const SizedBox(height: 2),

                            // ── Heading — Fraunces serif ──
                            Text(
                              'Create account',
                              style: GoogleFonts.fraunces(
                                color: tokens.textPrimary,
                                fontSize: 52,
                                fontWeight: FontWeight.w700,
                                letterSpacing: -1.5,
                                height: 1.0,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Start your free workspace today.',
                              style: GoogleFonts.dmSans(
                                color: AppColorsShared.accent,
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                              ),
                            ),

                            const SizedBox(height: 36),

                            // ── Error banner ──
                            if (_error != null) ...[
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                decoration: BoxDecoration(
                                  color: tokens.bgRaised,
                                  border: Border.all(color: tokens.borderSubtle),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Row(
                                  children: [
                                    Icon(Icons.error_outline_rounded, color: tokens.rose, size: 17),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Text(
                                        _error!,
                                        style: GoogleFonts.dmSans(
                                          color: tokens.rose,
                                          fontSize: 13,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 20),
                            ],

                            // ── Full Name ──
                            _Label(text: 'FULL NAME', tokens: tokens),
                            const SizedBox(height: 8),
                            _AuthInput(
                              controller: _name,
                              hint: 'John Doe',
                              prefixIcon: Icons.person_outline_rounded,
                              tokens: tokens,
                            ),

                            const SizedBox(height: 20),

                            // ── Email ──
                            _Label(text: 'EMAIL', tokens: tokens),
                            const SizedBox(height: 8),
                            _AuthInput(
                              controller: _email,
                              hint: 'your.email@example.com',
                              keyboardType: TextInputType.emailAddress,
                              prefixIcon: Icons.mail_outline_rounded,
                              tokens: tokens,
                            ),

                            const SizedBox(height: 20),

                            // ── Password ──
                            _Label(text: 'PASSWORD', tokens: tokens),
                            const SizedBox(height: 8),
                            _AuthInput(
                              controller: _password,
                              hint: 'Enter your password',
                              obscureText: !_showPassword,
                              prefixIcon: Icons.lock_outline_rounded,
                              tokens: tokens,
                              showToggle: true,
                              showToggleValue: _showPassword,
                              onToggle: () => setState(() => _showPassword = !_showPassword),
                            ),

                            const SizedBox(height: 20),

                            // ── Confirm Password ──
                            _Label(text: 'CONFIRM PASSWORD', tokens: tokens),
                            const SizedBox(height: 8),
                            _AuthInput(
                              controller: _confirm,
                              hint: 'Confirm your password',
                              obscureText: !_showConfirmPassword,
                              prefixIcon: Icons.lock_outline_rounded,
                              tokens: tokens,
                              showToggle: true,
                              showToggleValue: _showConfirmPassword,
                              onToggle: () => setState(() => _showConfirmPassword = !_showConfirmPassword),
                            ),

                            const SizedBox(height: 28),

                            // ── Button ──
                            TfButton(
                              label: _loading ? 'Creating account...' : 'Create account',
                              onPressed: _submit,
                              isLoading: _loading,
                              width: double.infinity,
                            ),

                            const Spacer(),

                            // ── Footer ──
                            Center(
                              child: Padding(
                                padding: const EdgeInsets.only(bottom: 24),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      'Already have an account? ',
                                      style: GoogleFonts.dmSans(
                                        color: tokens.textSecondary,
                                        fontSize: 13,
                                      ),
                                    ),
                                    GestureDetector(
                                      onTap: () => context.go('/login'),
                                      child: Text(
                                        'Log in',
                                        style: GoogleFonts.dmSans(
                                          color: AppColorsShared.accent,
                                          fontSize: 13,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),

            Positioned(
              top: 8,
              right: 8,
              child: IconButton(
                onPressed: () {
                  final notifier = ref.read(settingsProvider.notifier);
                  final newMode = settings.themeMode == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
                  notifier.setThemeMode(newMode);
                },
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 0, minHeight: 0),
                icon: Icon(
                  Theme.of(context).brightness == Brightness.dark
                      ? Icons.light_mode_outlined
                      : Icons.dark_mode_outlined,
                  size: 20,
                  color: tokens.textMuted,
                ),
                splashRadius: 20,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Label extends StatelessWidget {
  const _Label({required this.text, required this.tokens});
  final String text;
  final AppColorTokens tokens;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: GoogleFonts.dmSans(
        color: tokens.textMuted,
        fontSize: 10,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.9,
      ),
    );
  }
}

class _AuthInput extends StatelessWidget {
  const _AuthInput({
    required this.controller,
    required this.hint,
    required this.prefixIcon,
    required this.tokens,
    this.keyboardType,
    this.obscureText = false,
    this.showToggle = false,
    this.showToggleValue = false,
    this.onToggle,
  });

  final TextEditingController controller;
  final String hint;
  final IconData prefixIcon;
  final AppColorTokens tokens;
  final TextInputType? keyboardType;
  final bool obscureText;
  final bool showToggle;
  final bool showToggleValue;
  final VoidCallback? onToggle;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscureText,
      style: GoogleFonts.dmSans(
        color: tokens.textPrimary,
        fontSize: 14,
        fontWeight: FontWeight.w500,
      ),
      decoration: InputDecoration(
        filled: true,
        fillColor: tokens.bgRaised,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        hintText: hint,
        hintStyle: GoogleFonts.dmSans(
          color: tokens.textMuted,
          fontSize: 14,
          fontWeight: FontWeight.w400,
        ),
        prefixIcon: Padding(
          padding: const EdgeInsets.only(left: 14, right: 10),
          child: Icon(
            prefixIcon,
            color: AppColorsShared.accent.withValues(alpha: 0.55),
            size: 18,
          ),
        ),
        prefixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
        suffixIcon: showToggle
            ? GestureDetector(
                onTap: onToggle,
                child: Padding(
                  padding: const EdgeInsets.only(right: 14),
                  child: Align(
                    widthFactor: 1,
                    alignment: Alignment.center,
                    child: Text(
                      showToggleValue ? 'Hide' : 'Show',
                      style: GoogleFonts.dmSans(
                        color: tokens.textMuted,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              )
            : null,
        suffixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(11),
          borderSide: BorderSide(color: tokens.borderSubtle),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(11),
          borderSide: BorderSide(color: tokens.borderSubtle),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(11),
          borderSide: BorderSide(color: AppColorsShared.accent, width: 1.5),
        ),
      ),
    );
  }
}