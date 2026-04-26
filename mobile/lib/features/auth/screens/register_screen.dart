import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/gradient_background.dart';
import '../../../core/widgets/tf_button.dart';
import '../../../core/widgets/tf_input.dart';
import '../providers/auth_provider.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  String? _error;
  bool _loading = false;

  Future<void> _submit() async {
    final emailRegex = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
    if (!emailRegex.hasMatch(_email.text.trim())) {
      setState(() => _error = 'Enter a valid email address.');
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

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      await ref.read(authProvider.notifier).register(_name.text.trim(), _email.text.trim(), _password.text);
      if (mounted) context.go('/login');
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: GradientBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: <Widget>[
                const SizedBox(height: 28),
                Text('Create your account', style: Theme.of(context).textTheme.displaySmall),
                const SizedBox(height: 20),
                TfInput(label: 'Name', controller: _name),
                const SizedBox(height: 12),
                TfInput(label: 'Email', controller: _email, keyboardType: TextInputType.emailAddress),
                const SizedBox(height: 12),
                TfInput(label: 'Password', controller: _password, obscureText: true),
                const SizedBox(height: 12),
                TfInput(label: 'Confirm Password', controller: _confirm, obscureText: true),
                if (_error != null) ...<Widget>[
                  const SizedBox(height: 12),
                  Text(_error!, style: const TextStyle(color: Colors.redAccent)),
                ],
                const SizedBox(height: 16),
                TfButton(label: 'Create account', onPressed: _submit, isLoading: _loading),
                TextButton(onPressed: () => context.go('/login'), child: const Text('Already have an account? Sign in')),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
