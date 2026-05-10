import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/format_duration.dart';
import '../../tasks/models/task_model.dart';

class TaskCard extends StatefulWidget {
  const TaskCard({super.key, required this.task, required this.onTap});

  final TaskModel task;
  final VoidCallback onTap;

  @override
  State<TaskCard> createState() => _TaskCardState();
}

class _TaskCardState extends State<TaskCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 350),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 0.97, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutQuad),
    );
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  bool _isOverdue(DateTime deadline) {
    final today = DateTime.now();
    final normalizedToday = DateTime(today.year, today.month, today.day);
    final normalizedDeadline =
        DateTime(deadline.year, deadline.month, deadline.day);
    return normalizedDeadline.isBefore(normalizedToday);
  }

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final isCompleted =
        widget.task.status.toLowerCase() == 'done' ||
            widget.task.status.toLowerCase() == 'completed';
    final title = widget.task.title.trim().isEmpty
        ? 'Untitled Task'
        : widget.task.title.trim();
    final durationText = formatDuration(widget.task.estimatedDuration);
    final deadline = widget.task.deadline;
    final overdue = deadline != null && !isCompleted && _isOverdue(deadline);
    final score = widget.task.aiPriorityScore?.toString() ?? '—';

    return AnimatedBuilder(
      animation: _scaleAnimation,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          alignment: Alignment.topCenter,
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            decoration: BoxDecoration(
              color: tokens.bgSurface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: tokens.borderSubtle, width: 0.8),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: widget.onTap,
                borderRadius: BorderRadius.circular(16),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(14, 12, 12, 12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: Container(
                          width: 18,
                          height: 18,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(5),
                            border: Border.all(
                              color: isCompleted
                                  ? AppSemanticColors.sage
                                  : tokens.borderStrong,
                              width: 1.5,
                            ),
                            color: isCompleted
                                ? AppSemanticColors.sage.withValues(alpha: 0.15)
                                : Colors.transparent,
                          ),
                          child: isCompleted
                              ? const Icon(Icons.check_rounded,
                                  size: 11, color: AppSemanticColors.sage)
                              : null,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                letterSpacing: -0.2,
                                color: isCompleted
                                    ? tokens.textMuted
                                    : tokens.textPrimary,
                                decoration: isCompleted
                                    ? TextDecoration.lineThrough
                                    : TextDecoration.none,
                              ),
                            ),
                            const SizedBox(height: 7),
                            Row(
                              children: [
                                _PriorityDot(priority: widget.task.priority),
                                const SizedBox(width: 6),
                                _InlineBadge(
                                  label: widget.task.priority.toUpperCase(),
                                  color: AppPriorityColors.colorFor(
                                      widget.task.priority),
                                ),
                                const SizedBox(width: 6),
                                _InlineBadge(
                                  label: widget.task.category,
                                  color: tokens.textSecondary,
                                  bgColor: tokens.bgRaised,
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Icon(Icons.schedule_rounded,
                                    size: 12, color: tokens.textMuted),
                                const SizedBox(width: 3),
                                Text(
                                  durationText,
                                  style: TextStyle(
                                      fontSize: 11,
                                      color: tokens.textMuted,
                                      fontWeight: FontWeight.w500),
                                ),
                                if (widget.task.subtasks.isNotEmpty) ...[
                                  Padding(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 6),
                                    child: Container(
                                      width: 3,
                                      height: 3,
                                      decoration: BoxDecoration(
                                          color: tokens.borderStrong,
                                          shape: BoxShape.circle),
                                    ),
                                  ),
                                  Icon(Icons.check_circle_outline,
                                      size: 12, color: tokens.textMuted),
                                  const SizedBox(width: 3),
                                  Text(
                                    '${widget.task.completedSubtasks}/${widget.task.totalSubtasks}',
                                    style: TextStyle(
                                        fontSize: 11,
                                        color: tokens.textMuted,
                                        fontWeight: FontWeight.w500),
                                  ),
                                ],
                                const Spacer(),
                                Text(
                                  deadline == null
                                      ? ''
                                      : DateFormat('MMM d').format(deadline),
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: overdue
                                        ? AppSemanticColors.rose
                                        : tokens.textMuted,
                                  ),
                                ),
                              ],
                            ),
                            if (widget.task.totalSubtasks > 0) ...[
                              const SizedBox(height: 8),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(99),
                                child: LinearProgressIndicator(
                                  value: widget.task.totalSubtasks == 0
                                      ? 0
                                      : widget.task.completedSubtasks /
                                          widget.task.totalSubtasks,
                                  minHeight: 2.5,
                                  backgroundColor: tokens.bgOverlay,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    isCompleted
                                        ? AppSemanticColors.sage
                                        : AppSemanticColors.primary,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(width: 10),
                      if (!isCompleted)
                        Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: tokens.bgRaised,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: tokens.borderMedium,
                              width: 0.8,
                            ),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            score,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                              color: AppSemanticColors.primary,
                              letterSpacing: -0.5,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _PriorityDot extends StatelessWidget {
  const _PriorityDot({required this.priority});

  final String priority;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 7,
      height: 7,
      decoration: BoxDecoration(
        color: AppPriorityColors.colorFor(priority),
        shape: BoxShape.circle,
      ),
    );
  }
}

class _InlineBadge extends StatelessWidget {
  const _InlineBadge({required this.label, required this.color, this.bgColor});

  final String label;
  final Color color;
  final Color? bgColor;

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: bgColor ?? color.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: bgColor != null ? tokens.textSecondary : color,
          letterSpacing: 0.2,
        ),
      ),
    );
  }
}
