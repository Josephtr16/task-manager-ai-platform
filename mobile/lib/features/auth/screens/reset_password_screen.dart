import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/gradient_background.dart';
import '../../../core/widgets/tf_button.dart';
import '../../../core/widgets/tf_input.dart';
import '../../../services/auth_service.dart';

class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({super.key, this.email, this.token});

  final String? email;
  final String? token;

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _newPassword = TextEditingController();
  bool _loading = false;
  String? _message;

  Future<void> _submit() async {
    if (widget.email == null || widget.token == null) {
      setState(() => _message = 'Missing reset token or email.');
      return;
    }

    setState(() {
      _loading = true;
      _message = null;
    });

    try {
      await AuthService().resetPassword(widget.email!, widget.token!, _newPassword.text);
      setState(() => _message = 'Password reset successful. Redirecting to login...');
      Future<void>.delayed(const Duration(seconds: 2), () {
        if (!mounted) return;
        context.go('/login');
      });
    } catch (e) {
      setState(() => _message = e.toString());
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
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text('Reset password', style: Theme.of(context).textTheme.displaySmall),
                const SizedBox(height: 12),
                TfInput(label: 'New Password', controller: _newPassword, obscureText: true),
                const SizedBox(height: 16),
                TfButton(label: 'Update password', onPressed: _submit, isLoading: _loading),
                if (_message != null) ...<Widget>[const SizedBox(height: 12), Text(_message!)],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
