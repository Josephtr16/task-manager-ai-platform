import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/format_duration.dart';
import '../../../../core/widgets/tf_badge.dart';
import '../../tasks/models/task_model.dart';

class TaskCard extends StatefulWidget {
  const TaskCard({super.key, required this.task, required this.onTap});

  final TaskModel task;
  final VoidCallback onTap;

  @override
  State<TaskCard> createState() => _TaskCardState();
}

class _TaskCardState extends State<TaskCard> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  bool _isHovered = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 400),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(begin: 0.95, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutQuad),
    );

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final isCompleted =
        widget.task.status.toLowerCase() == 'done' ||
        widget.task.status.toLowerCase() == 'completed';
    final title = widget.task.title.trim().isEmpty ? 'Untitled Task' : widget.task.title.trim();
    final durationText = formatDuration(widget.task.estimatedDuration);
    final deadline = widget.task.deadline;
    final overdue = deadline != null && !isCompleted && _isOverdue(deadline);
    final score = widget.task.aiPriorityScore?.toString() ?? '0';

    return AnimatedBuilder(
      animation: _scaleAnimation,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          alignment: Alignment.topCenter,
          child: MouseRegion(
            onEnter: (_) => setState(() => _isHovered = true),
            onExit: (_) => setState(() => _isHovered = false),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              decoration: BoxDecoration(
                color: tokens.bgSurface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: _isHovered
                      ? AppSemanticColors.accentGlow.withValues(alpha: 0.3)
                      : (isCompleted ? tokens.borderSubtle : tokens.borderMedium),
                  width: 1.2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(
                      alpha: _isHovered ? 0.12 : 0.08,
                    ),
                    blurRadius: _isHovered ? 16 : 12,
                    offset: Offset(0, _isHovered ? 4 : 2),
                  ),
                  if (!isCompleted && _isHovered)
                    BoxShadow(
                      color: AppSemanticColors.accentGlow.withValues(alpha: 0.08),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                ],
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: widget.onTap,
                  borderRadius: BorderRadius.circular(16),
                  splashColor: AppColorsShared.accentDim.withValues(alpha: 0.4),
                  highlightColor: AppColorsShared.accentDim.withValues(alpha: 0.2),
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            Container(
                              width: 20,
                              height: 20,
                              margin: const EdgeInsets.only(top: 2),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(
                                  color: isCompleted ? AppSemanticColors.sage : tokens.borderMedium,
                                  width: 1.5,
                                ),
                                color: isCompleted
                                    ? AppSemanticColors.sage.withValues(alpha: 0.15)
                                    : Colors.transparent,
                              ),
                              child: isCompleted
                                  ? const Icon(Icons.check_rounded, size: 13, color: AppSemanticColors.sage)
                                  : null,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: <Widget>[
                                  Text(
                                    title,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: AppTextStyles.bodySmall.copyWith(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      letterSpacing: -0.2,
                                      color: tokens.textSecondary,
                                      decoration: isCompleted
                                          ? TextDecoration.lineThrough
                                          : TextDecoration.none,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            if (!isCompleted) ...<Widget>[
                              const SizedBox(width: 12),
                              Container(
                                width: 40,
                                height: 40,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: AppSemanticColors.accentDim.withValues(alpha: 0.8),
                                  border: Border.all(
                                    color: overdue ? AppSemanticColors.rose : tokens.textSecondary,
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppSemanticColors.accentGlow.withValues(alpha: 0.15),
                                      blurRadius: 8,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  score,
                                  style: AppTextStyles.labelSmall.copyWith(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w800,
                                    color: AppSemanticColors.accentDark,
                                    letterSpacing: -0.3,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 10),
                        Padding(
                          padding: const EdgeInsets.only(left: 32),
                          child: Wrap(
                            spacing: 7,
                            runSpacing: 7,
                            children: <Widget>[
                              TfBadge.priority(widget.task.priority),
                              TfBadge(label: widget.task.category),
                            ],
                          ),
                        ),
                        const SizedBox(height: 10),
                        Padding(
                          padding: const EdgeInsets.only(left: 32),
                          child: Row(
                            children: <Widget>[
                              Icon(
                                Icons.schedule_rounded,
                                size: 15,
                                color: tokens.textSecondary,
                              ),
                              const SizedBox(width: 5),
                              Text(
                                durationText,
                                style: AppTextStyles.bodySmall.copyWith(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                  color: tokens.textSecondary,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Text(
                                '•',
                                style: AppTextStyles.bodySmall.copyWith(
                                  fontSize: 12,
                                  color: tokens.textSecondary,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Icon(
                                Icons.check_circle_outline,
                                size: 15,
                                color: tokens.textSecondary,
                              ),
                              const SizedBox(width: 5),
                              Text(
                                '${widget.task.completedSubtasks}/${widget.task.totalSubtasks}',
                                style: AppTextStyles.bodySmall.copyWith(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                  color: tokens.textSecondary,
                                ),
                              ),
                              const Spacer(),
                              Text(
                                deadline == null
                                    ? 'No date'
                                    : DateFormat('MMM d').format(deadline),
                                style: AppTextStyles.bodySmall.copyWith(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                  color: overdue ? AppSemanticColors.rose : tokens.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (widget.task.totalSubtasks > 0) ...<Widget>[
                          const SizedBox(height: 10),
                          Padding(
                            padding: const EdgeInsets.only(left: 32),
                            child: Row(
                              children: <Widget>[
                                Expanded(
                                  child: ClipRRect(
                                    borderRadius: BorderRadius.circular(99),
                                    child: LinearProgressIndicator(
                                      value: widget.task.totalSubtasks == 0
                                          ? 0
                                          : widget.task.completedSubtasks / widget.task.totalSubtasks,
                                      minHeight: 4,
                                      backgroundColor: tokens.bgOverlay,
                                      valueColor: AlwaysStoppedAnimation<Color>(
                                        isCompleted
                                            ? AppSemanticColors.sage
                                            : AppSemanticColors.accentGlow,
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Text(
                                  '${(widget.task.totalSubtasks == 0 ? 0 : (widget.task.completedSubtasks / widget.task.totalSubtasks * 100)).toStringAsFixed(0)}%',
                                  style: AppTextStyles.labelSmall.copyWith(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: tokens.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  bool _isOverdue(DateTime deadline) {
    final today = DateTime.now();
    final normalizedToday = DateTime(today.year, today.month, today.day);
    final normalizedDeadline = DateTime(deadline.year, deadline.month, deadline.day);
    return normalizedDeadline.isBefore(normalizedToday);
  }
}
