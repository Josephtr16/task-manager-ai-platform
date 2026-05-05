import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/widgets/gradient_background.dart';
import '../../../../core/widgets/tf_page_header.dart';
import '../../../../core/theme/app_colors.dart';
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
  static const _labels  = <String>['To Do', 'In Progress', 'Review', 'Done'];

  void _setActive(int idx) => setState(() => _activeIndex = idx);

  @override
  Widget build(BuildContext context) {
    final map    = ref.watch(kanbanProvider);
    final tokens = Theme.of(context).extension<AppColorTokens>()!;

    return Scaffold(
      body: GradientBackground(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            const SizedBox(height: 12),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: TfPageHeader(
                title: 'Kanban',
                subtitle: 'Swipe right to move · Left for options',
              ),
            ),
            const SizedBox(height: 8),

            // ── Tab bar ──
            Container(
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(color: tokens.borderSubtle, width: 0.5),
                ),
              ),
              child: Row(
                children: List<Widget>.generate(_columns.length, (i) {
                  final key    = _columns[i];
                  final active = _activeIndex == i;
                  final count  = (map[key] ?? const <dynamic>[]).length;
                  return Expanded(
                    child: GestureDetector(
                      onTap: () => _setActive(i),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          border: Border(
                            bottom: BorderSide(
                              color: active
                                  ? AppSemanticColors.primary
                                  : Colors.transparent,
                              width: active ? 2 : 0,
                            ),
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: <Widget>[
                            Text(
                              _labels[i],
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: active
                                    ? AppSemanticColors.primary
                                    : tokens.textMuted,
                              ),
                            ),
                            const SizedBox(width: 5),
                            Container(
                              width: 15,
                              height: 15,
                              alignment: Alignment.center,
                              decoration: const BoxDecoration(
                                color: AppSemanticColors.accentDim,
                                shape: BoxShape.circle,
                              ),
                              child: Text(
                                '$count',
                                style: const TextStyle(
                                  fontSize: 9,
                                  fontWeight: FontWeight.w700,
                                  color: AppSemanticColors.accentDark,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }),
              ),
            ),

            // ── Column content ──
            Expanded(
              child: Builder(builder: (context) {
                final key   = _columns[_activeIndex];
                final tasks = List.from(map[key] ?? const <dynamic>[]);

                if (tasks.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: <Widget>[
                        Icon(Icons.inbox_rounded,
                            size: 36, color: tokens.textMuted),
                        const SizedBox(height: 10),
                        Text(
                          'No tasks here',
                          style: TextStyle(
                              fontSize: 13, color: tokens.textMuted),
                        ),
                      ],
                    ),
                  );
                }

                return ListView.builder(
                  // No horizontal padding — SwipeableKanbanCard handles
                  // alignment via TaskCard's own margin (16px each side)
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
    );
  }
}