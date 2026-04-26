import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/gradient_background.dart';
import '../../../core/widgets/tf_button.dart';
import '../../../core/widgets/tf_input.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  String? _error;
  bool _loading = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      await ref.read(authProvider.notifier).login(_email.text.trim(), _password.text);
      if (mounted) context.go('/dashboard');
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;

    return Scaffold(
      body: GradientBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 520),
              child: Center(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: <Widget>[
                    const SizedBox(height: 28),
                    Text('TaskFlow AI', style: Theme.of(context).textTheme.displaySmall),
                    const SizedBox(height: 6),
                    Text('Welcome back.', style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: tokens.textSecondary)),
                    const SizedBox(height: 28),
                    TfInput(label: 'Email', controller: _email, hint: 'you@example.com', keyboardType: TextInputType.emailAddress),
                    const SizedBox(height: 14),
                    TfInput(label: 'Password', controller: _password, hint: '••••••••', obscureText: true),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(onPressed: () => context.push('/forgot-password'), child: const Text('Forgot password?')),
                    ),
                    if (_error != null)
                      Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: tokens.rose.withValues(alpha: 0.12),
                          border: Border.all(color: tokens.rose.withValues(alpha: 0.4)),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(_error!, style: TextStyle(color: tokens.rose)),
                      ),
                    TfButton(label: 'Sign In', onPressed: _submit, isLoading: _loading, width: double.infinity),
                    const SizedBox(height: 16),
                    TextButton(
                      onPressed: () => context.push('/register'),
                      child: const Text("Don't have an account? Sign up"),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
