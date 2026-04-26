import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/gradient_background.dart';
import '../providers/focus_provider.dart';

class FocusScreen extends ConsumerWidget {
  const FocusScreen({super.key});

  String _format(int seconds) {
    final m = (seconds ~/ 60).toString().padLeft(2, '0');
    final s = (seconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(focusProvider);
    final notifier = ref.read(focusProvider.notifier);

    final displaySeconds = state.technique == FocusTechnique.simpleTimer ? state.elapsedSeconds : state.pomodoroSecondsLeft;

    return Scaffold(
      appBar: AppBar(title: const Text('Focus')),
      body: GradientBackground(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: <Widget>[
                SegmentedButton<FocusTechnique>(
                  segments: const <ButtonSegment<FocusTechnique>>[
                    ButtonSegment(value: FocusTechnique.simpleTimer, label: Text('Simple Timer')),
                    ButtonSegment(value: FocusTechnique.pomodoro, label: Text('Pomodoro')),
                  ],
                  selected: <FocusTechnique>{state.technique},
                  onSelectionChanged: (v) => notifier.setTechnique(v.first),
                ),
                const SizedBox(height: 24),
                Text(_format(displaySeconds), style: Theme.of(context).textTheme.displayLarge),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 10,
                  children: <Widget>[
                    FilledButton.icon(onPressed: notifier.start, icon: const Icon(Icons.play_arrow), label: const Text('Play')),
                    OutlinedButton.icon(onPressed: notifier.pause, icon: const Icon(Icons.pause), label: const Text('Pause')),
                    OutlinedButton.icon(onPressed: notifier.stop, icon: const Icon(Icons.stop), label: const Text('Stop')),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
