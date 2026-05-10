import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SharedPreferences.getInstance();
  final view = WidgetsBinding.instance.platformDispatcher.views.first;
  runApp(
    MediaQuery(
      data: MediaQueryData.fromView(view).copyWith(
        textScaler: TextScaler.noScaling,
      ),
      child: const ProviderScope(child: TaskFlowApp()),
    ),
  );
}
