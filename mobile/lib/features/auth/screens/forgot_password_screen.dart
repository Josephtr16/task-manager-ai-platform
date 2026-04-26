import 'package:flutter/material.dart';

import '../../../core/widgets/gradient_background.dart';
import '../../../core/widgets/tf_button.dart';
import '../../../core/widgets/tf_input.dart';
import '../../../services/auth_service.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _email = TextEditingController();
  bool _loading = false;
  String? _message;

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _message = null;
    });

    try {
      await AuthService().forgotPassword(_email.text.trim());
      setState(() => _message = 'Reset link sent. Please check your inbox.');
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
                Text('Forgot password', style: Theme.of(context).textTheme.displaySmall),
                const SizedBox(height: 12),
                TfInput(label: 'Email', controller: _email, keyboardType: TextInputType.emailAddress),
                const SizedBox(height: 16),
                TfButton(label: 'Send reset link', onPressed: _submit, isLoading: _loading),
                if (_message != null) ...<Widget>[const SizedBox(height: 12), Text(_message!)],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
