import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/gradient_background.dart';
import '../providers/settings_provider.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mode = ref.watch(settingsProvider).themeMode;

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: GradientBackground(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: <Widget>[
            Text('Appearance', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            SegmentedButton<ThemeMode>(
              segments: const <ButtonSegment<ThemeMode>>[
                ButtonSegment(value: ThemeMode.light, label: Text('Light')),
                ButtonSegment(value: ThemeMode.dark, label: Text('Dark')),
                ButtonSegment(value: ThemeMode.system, label: Text('System')),
              ],
              selected: <ThemeMode>{mode},
              onSelectionChanged: (value) =>
                  ref.read(settingsProvider.notifier).setThemeMode(value.first),
            ),
          ],
        ),
      ),
    );
  }
}
