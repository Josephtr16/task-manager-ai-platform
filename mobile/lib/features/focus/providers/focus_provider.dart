import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

enum FocusTechnique { simpleTimer, pomodoro }
enum PomodoroPhase { work, breakTime }

class FocusState {
  const FocusState({
    this.isFocusMode = false,
    this.sessionActive = false,
    this.sessionPaused = false,
    this.elapsedSeconds = 0,
    this.technique = FocusTechnique.simpleTimer,
    this.pomodoroPhase = PomodoroPhase.work,
    this.pomodoroSecondsLeft = 1500,
    this.pomodoroCompleted = 0,
  });

  final bool isFocusMode;
  final bool sessionActive;
  final bool sessionPaused;
  final int elapsedSeconds;
  final FocusTechnique technique;
  final PomodoroPhase pomodoroPhase;
  final int pomodoroSecondsLeft;
  final int pomodoroCompleted;

  FocusState copyWith({
    bool? isFocusMode,
    bool? sessionActive,
    bool? sessionPaused,
    int? elapsedSeconds,
    FocusTechnique? technique,
    PomodoroPhase? pomodoroPhase,
    int? pomodoroSecondsLeft,
    int? pomodoroCompleted,
  }) {
    return FocusState(
      isFocusMode: isFocusMode ?? this.isFocusMode,
      sessionActive: sessionActive ?? this.sessionActive,
      sessionPaused: sessionPaused ?? this.sessionPaused,
      elapsedSeconds: elapsedSeconds ?? this.elapsedSeconds,
      technique: technique ?? this.technique,
      pomodoroPhase: pomodoroPhase ?? this.pomodoroPhase,
      pomodoroSecondsLeft: pomodoroSecondsLeft ?? this.pomodoroSecondsLeft,
      pomodoroCompleted: pomodoroCompleted ?? this.pomodoroCompleted,
    );
  }
}

final focusProvider = NotifierProvider<FocusNotifier, FocusState>(FocusNotifier.new);

class FocusNotifier extends Notifier<FocusState> {
  Timer? _timer;

  @override
  FocusState build() {
    ref.onDispose(() => _timer?.cancel());
    return const FocusState();
  }

  void setTechnique(FocusTechnique technique) {
    state = state.copyWith(technique: technique);
  }

  void start() {
    state = state.copyWith(sessionActive: true, sessionPaused: false, isFocusMode: true);
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (state.sessionPaused) return;
      if (state.technique == FocusTechnique.simpleTimer) {
        state = state.copyWith(elapsedSeconds: state.elapsedSeconds + 1);
      } else {
        final next = state.pomodoroSecondsLeft - 1;
        if (next <= 0) {
          if (state.pomodoroPhase == PomodoroPhase.work) {
            state = state.copyWith(
              pomodoroPhase: PomodoroPhase.breakTime,
              pomodoroSecondsLeft: 300,
              pomodoroCompleted: state.pomodoroCompleted + 1,
            );
          } else {
            state = state.copyWith(pomodoroPhase: PomodoroPhase.work, pomodoroSecondsLeft: 1500);
          }
        } else {
          state = state.copyWith(pomodoroSecondsLeft: next);
        }
      }
    });
  }

  void pause() => state = state.copyWith(sessionPaused: true);

  void resume() => state = state.copyWith(sessionPaused: false);

  void stop() {
    _timer?.cancel();
    state = const FocusState();
  }
}
