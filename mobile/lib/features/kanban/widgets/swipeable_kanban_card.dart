import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_theme.dart';
import '../../tasks/models/task_model.dart';
import '../../tasks/providers/tasks_provider.dart';
import '../../tasks/widgets/task_card.dart';
import '../../tasks/widgets/task_detail_sheet.dart';

// TaskCard has margin: symmetric(horizontal:16, vertical:6) internally.
// Positioned boxes must use the same insets to align with the visual card.
const double _hm = 16.0;
const double _vm = 6.0;

class SwipeableKanbanCard extends ConsumerStatefulWidget {
  const SwipeableKanbanCard({
    super.key,
    required this.task,
    required this.currentColumn,
    this.isInProgress = false,
  });

  final TaskModel task;
  final String currentColumn;
  final bool isInProgress;

  @override
  ConsumerState<SwipeableKanbanCard> createState() =>
      _SwipeableKanbanCardState();
}

class _SwipeableKanbanCardState extends ConsumerState<SwipeableKanbanCard>
    with SingleTickerProviderStateMixin {
  static const double _maxOffset    = 88.0;
  static const double _triggerOffset = 55.0;

  late final AnimationController _ctrl;
  late Animation<double> _snapAnim;
  double _offset = 0;

  static const _columnKeys   = ['todo', 'in-progress', 'review', 'done'];
  static const _columnLabels = ['To Do', 'In Progress', 'Review', 'Done'];

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 320),
    );
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _onDragUpdate(DragUpdateDetails d) {
    setState(() {
      _offset = (_offset + d.delta.dx).clamp(-_maxOffset, _maxOffset);
    });
  }

  void _onDragEnd(DragEndDetails d) {
    if (_offset > _triggerOffset) {
      HapticFeedback.lightImpact();
      _snapBack();
      _showMoveSheet();
    } else if (_offset < -_triggerOffset) {
      HapticFeedback.lightImpact();
      _snapBack();
      _showActionSheet();
    } else {
      _snapBack();
    }
  }

  void _snapBack() {
    final double start = _offset;
    _ctrl.reset();
    _snapAnim = Tween<double>(begin: start, end: 0).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.elasticOut),
    )..addListener(() => setState(() => _offset = _snapAnim.value));
    _ctrl.forward();
  }

  // ── RIGHT swipe: move to another column ─────────────────────
  void _showMoveSheet() {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    showModalBottomSheet(
      context: context,
      backgroundColor: tokens.bgSurface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Container(
              width: 36, height: 4,
              margin: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: tokens.borderMedium,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    'Move task to',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.10,
                      color: tokens.textMuted,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    widget.task.title,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: tokens.textPrimary,
                    ),
                  ),
                ],
              ),
            ),
            ...List<Widget>.generate(_columnKeys.length, (i) {
              final key   = _columnKeys[i];
              final label = _columnLabels[i];
              final isCurrent = key == widget.currentColumn;
              final colors = <String, Color>{
                'todo':        AppSemanticColors.sky,
                'in-progress': AppSemanticColors.primary,
                'review':      AppSemanticColors.sage,
                'done':        AppSemanticColors.rose,
              };
              final color = colors[key] ?? AppSemanticColors.primary;
              return ListTile(
                enabled: !isCurrent,
                leading: Container(
                  width: 34, height: 34,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(Icons.arrow_forward_rounded, size: 16, color: color),
                ),
                title: Text(
                  label,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: isCurrent ? tokens.textMuted : tokens.textPrimary,
                  ),
                ),
                trailing: isCurrent
                    ? Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: tokens.bgOverlay,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          'Current',
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: tokens.textMuted),
                        ),
                      )
                    : Icon(Icons.chevron_right_rounded, color: tokens.textMuted),
                onTap: isCurrent
                    ? null
                    : () {
                        Navigator.pop(ctx);
                        ref.read(tasksProvider.notifier).updateTask(
                          widget.task.id,
                          {'status': key},
                        );
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                          content: Text('Moved to $label'),
                          backgroundColor: color,
                          duration: const Duration(seconds: 2),
                          behavior: SnackBarBehavior.floating,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ));
                      },
              );
            }),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  // ── LEFT swipe: focus or delete ──────────────────────────────
  void _showActionSheet() {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    showModalBottomSheet(
      context: context,
      backgroundColor: tokens.bgSurface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Container(
              width: 36, height: 4,
              margin: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: tokens.borderMedium,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
              child: Text(
                widget.task.title,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: tokens.textPrimary,
                ),
              ),
            ),
            // View detail
            ListTile(
              leading: Container(
                width: 42, height: 42,
                decoration: BoxDecoration(
                  color: AppSemanticColors.sky.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(13),
                ),
                child: Icon(Icons.open_in_new_rounded, color: AppSemanticColors.sky, size: 20),
              ),
              title: Text('View Details',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: tokens.textPrimary)),
              subtitle: Text('Open task detail sheet',
                  style: TextStyle(fontSize: 12, color: tokens.textMuted)),
              trailing: Icon(Icons.chevron_right_rounded, color: tokens.textMuted),
              onTap: () {
                Navigator.pop(ctx);
                showModalBottomSheet<void>(
                  context: context,
                  isScrollControlled: true,
                  backgroundColor: Colors.transparent,
                  builder: (_) => TaskDetailSheet(task: widget.task),
                );
              },
            ),
            // Start focus
            ListTile(
              leading: Container(
                width: 42, height: 42,
                decoration: BoxDecoration(
                  color: AppSemanticColors.sage.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(13),
                ),
                child: Icon(Icons.my_location_rounded, color: AppSemanticColors.sage, size: 20),
              ),
              title: Text('Start Focus Mode',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: tokens.textPrimary)),
              subtitle: Text('Focus on this task with a timer',
                  style: TextStyle(fontSize: 12, color: tokens.textMuted)),
              trailing: Icon(Icons.chevron_right_rounded, color: tokens.textMuted),
              onTap: () {
                Navigator.pop(ctx);
                context.go('/focus', extra: {
                  'taskId': widget.task.id,
                  'taskTitle': widget.task.title,
                  'taskPriority': widget.task.priority,
                });
              },
            ),
            // Delete
            ListTile(
              leading: Container(
                width: 42, height: 42,
                decoration: BoxDecoration(
                  color: AppSemanticColors.rose.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(13),
                ),
                child: Icon(Icons.delete_outline_rounded, color: AppSemanticColors.rose, size: 20),
              ),
              title: Text('Delete Task',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppSemanticColors.rose)),
              subtitle: Text('Remove this task permanently',
                  style: TextStyle(fontSize: 12, color: tokens.textMuted)),
              onTap: () {
                Navigator.pop(ctx);
                ref.read(tasksProvider.notifier).deleteTask(widget.task.id);
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                  content: const Text('Task deleted'),
                  backgroundColor: AppSemanticColors.rose,
                  duration: const Duration(seconds: 2),
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ));
              },
            ),
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text('Cancel',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: tokens.textMuted)),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.translucent,
      onHorizontalDragUpdate: _onDragUpdate,
      onHorizontalDragEnd: _onDragEnd,
      child: IntrinsicHeight(
        child: Stack(
          clipBehavior: Clip.none,
          children: <Widget>[

            // ── Move box (amber) — only when swiping RIGHT ──
            if (_offset > 0)
              Positioned(
                left:   _hm,
                top:    _vm,
                bottom: _vm,
                width:  _offset,
                child: Container(
                  decoration: BoxDecoration(
                    color: AppColorsShared.accent,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: _offset > 36
                      ? Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: const <Widget>[
                            Icon(Icons.arrow_forward_rounded,
                                color: Colors.white, size: 22),
                            SizedBox(height: 3),
                            Text('Move',
                                style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700)),
                          ],
                        )
                      : const SizedBox.shrink(),
                ),
              ),

            // ── Options box (rose) — only when swiping LEFT ──
            if (_offset < 0)
              Positioned(
                right:  _hm,
                top:    _vm,
                bottom: _vm,
                width:  -_offset,
                child: Container(
                  decoration: BoxDecoration(
                    color: AppSemanticColors.rose,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: _offset.abs() > 36
                      ? Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: const <Widget>[
                            Icon(Icons.more_horiz_rounded,
                                color: Colors.white, size: 22),
                            SizedBox(height: 3),
                            Text('Options',
                                style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700)),
                          ],
                        )
                      : const SizedBox.shrink(),
                ),
              ),

            // ── Card slides on top ──
            Transform.translate(
              offset: Offset(_offset, 0),
              child: widget.isInProgress
                  ? Container(
                      decoration: const BoxDecoration(
                        border: Border(
                          left: BorderSide(
                              width: 3, color: AppSemanticColors.primary),
                        ),
                      ),
                      child: TaskCard(
                        task: widget.task,
                        onTap: () => showModalBottomSheet<void>(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (_) => TaskDetailSheet(task: widget.task),
                        ),
                      ),
                    )
                  : TaskCard(
                      task: widget.task,
                      onTap: () => showModalBottomSheet<void>(
                        context: context,
                        isScrollControlled: true,
                        backgroundColor: Colors.transparent,
                        builder: (_) => TaskDetailSheet(task: widget.task),
                      ),
                    ),
            ),

          ],
        ),
      ),
    );
  }
}