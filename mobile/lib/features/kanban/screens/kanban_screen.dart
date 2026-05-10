import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/widgets/gradient_background.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/kanban_provider.dart';
import '../widgets/swipeable_kanban_card.dart';

class KanbanScreen extends ConsumerStatefulWidget {
  const KanbanScreen({super.key});

  @override
  ConsumerState<KanbanScreen> createState() => _KanbanScreenState();
}

class _KanbanScreenState extends ConsumerState<KanbanScreen>
    with TickerProviderStateMixin {
  int _activeIndex = 0;

  static const _columns = <String>['todo', 'in-progress', 'review', 'done'];
  static const _labels = <String>['To Do', 'In Progress', 'Review', 'Done'];

  void _setActive(int idx) => setState(() => _activeIndex = idx);

  @override
  Widget build(BuildContext context) {
    final map = ref.watch(kanbanProvider);
    final tokens = Theme.of(context).extension<AppColorTokens>()!;

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: GradientBackground(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 24, 16, 4),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      'Kanban',
                      style: GoogleFonts.fraunces(
                        fontSize: 36,
                        fontWeight: FontWeight.w700,
                        color: tokens.textPrimary,
                        height: 1.1,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Swipe right to move  ·  Left for options',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: tokens.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // ── Pill-style tab bar ──
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  height: 72,
                  padding: const EdgeInsets.all(5),
                  decoration: BoxDecoration(
                    color: tokens.bgSurface,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: tokens.borderSubtle, width: 0.8),
                  ),
                  child: Row(
                    children: List<Widget>.generate(_columns.length, (i) {
                      final key = _columns[i];
                      final active = _activeIndex == i;
                      final count = (map[key] ?? const <dynamic>[]).length;
                      return Expanded(
                        child: GestureDetector(
                          onTap: () => _setActive(i),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            curve: Curves.easeOut,
                            padding: const EdgeInsets.symmetric(
                                vertical: 6, horizontal: 6),
                            decoration: BoxDecoration(
                              color: active
                                  ? AppSemanticColors.primary
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: <Widget>[
                                  Text(
                                    _labels[i],
                                    textAlign: TextAlign.center,
                                    style: AppTextStyles.labelSmall.copyWith(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w800,
                                      color: active
                                          ? Colors.white
                                          : tokens.textPrimary,
                                    ),
                                  ),
                                  const SizedBox(height: 3),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 8, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: active
                                          ? Colors.white.withValues(alpha: 0.25)
                                          : AppSemanticColors.primary
                                              .withValues(alpha: 0.12),
                                      borderRadius: BorderRadius.circular(99),
                                    ),
                                    child: Text(
                                      '$count',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w800,
                                        color: active
                                            ? Colors.white
                                            : AppSemanticColors.primary,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      );
                    }),
                  ),
                ),
              ),

              const SizedBox(height: 8),

              // ── Column content ──
              Expanded(
                child: Builder(builder: (context) {
                  final key = _columns[_activeIndex];
                  final tasks = List.from(map[key] ?? const <dynamic>[]);

                  if (tasks.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: <Widget>[
                          Container(
                            width: 60,
                            height: 60,
                            decoration: BoxDecoration(
                              color: tokens.bgSurface,
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(color: tokens.borderSubtle),
                            ),
                            child: Icon(Icons.inbox_rounded,
                                size: 28, color: tokens.textMuted),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'No tasks here',
                            style: AppTextStyles.bodyMedium.copyWith(
                              fontSize: 14,
                              color: tokens.textSecondary,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    );
                  }

                  return ListView.builder(
                    padding: const EdgeInsets.only(top: 4, bottom: 24),
                    itemCount: tasks.length,
                    itemBuilder: (context, idx) {
                      final task = tasks[idx];
                      return SwipeableKanbanCard(
                        key: ValueKey(task.id),
                        task: task,
                        currentColumn: key,
                        isInProgress: key == 'in-progress',
                      );
                    },
                  );
                }),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
