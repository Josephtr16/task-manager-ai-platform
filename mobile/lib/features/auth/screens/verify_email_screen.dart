import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../services/auth_service.dart';
import '../../../core/widgets/gradient_background.dart';

class VerifyEmailScreen extends StatefulWidget {
  const VerifyEmailScreen({super.key, this.email, this.token});

  final String? email;
  final String? token;

  @override
  State<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends State<VerifyEmailScreen> {
  bool _loading = true;
  bool _success = false;
  String? _message;

  @override
  void initState() {
    super.initState();
    _verify();
  }

  Future<void> _verify() async {
    final email = widget.email;
    final token = widget.token;
    if (email == null || token == null) {
      setState(() {
        _loading = false;
        _message = 'Missing verification data.';
      });
      return;
    }

    try {
      await AuthService().verifyEmail(email, token);
      setState(() {
        _loading = false;
        _success = true;
        _message = 'Email verified. Redirecting to login...';
      });
      Timer(const Duration(seconds: 3), () {
        if (mounted) context.go('/login');
      });
    } catch (e) {
      setState(() {
        _loading = false;
        _message = e.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: GradientBackground(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                if (_loading) const CircularProgressIndicator(),
                if (!_loading)
                  Icon(_success ? Icons.check_circle : Icons.error_outline, size: 48, color: _success ? Colors.green : Colors.redAccent),
                const SizedBox(height: 12),
                Text(_message ?? 'Verifying email...'),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
