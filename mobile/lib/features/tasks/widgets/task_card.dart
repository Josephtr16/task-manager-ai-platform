import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/tf_badge.dart';
import '../../tasks/models/task_model.dart';

class TaskCard extends StatelessWidget {
  const TaskCard({super.key, required this.task, required this.onTap});

  final TaskModel task;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isCompleted =
        task.status.toLowerCase() == 'done' || task.status.toLowerCase() == 'completed';
    final title = task.title.trim().isEmpty ? 'Untitled Task' : task.title.trim();
    final subtitle = task.deadline == null
        ? '${task.estimatedDuration} min'
        : '${DateFormat('MMM d').format(task.deadline!)} • ${task.estimatedDuration} min';

    final card = Container(
      decoration: BoxDecoration(
        color: tokens.bgSurface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: tokens.borderSubtle),
        boxShadow: [
          BoxShadow(
            color: isDark ? const Color(0x4D000000) : const Color(0x12000000),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: isCompleted ? AppSemanticColors.sage.withValues(alpha: 0.14) : AppColorsShared.accentDim,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: isCompleted
                    ? AppSemanticColors.sage.withValues(alpha: 0.45)
                    : AppColorsShared.accentGlow,
              ),
            ),
            child: Center(
              child: isCompleted
                  ? Icon(
                      Icons.check_rounded,
                      size: 18,
                      color: AppSemanticColors.sage,
                    )
                  : Text(
                      (task.aiPriorityScore ?? 0).toString(),
                      style: AppTextStyles.labelSmall.copyWith(
                        color: AppColorsShared.accent,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
            ),
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
                  style: AppTextStyles.labelMedium.copyWith(
                    color: tokens.textPrimary,
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: <Widget>[
                    TfBadge.priority(task.priority),
                    TfBadge(label: task.category),
                    TfBadge(
                      label: task.projectName ?? 'GENERAL',
                      uppercase: true,
                    ),
                  ],
                ),
                if ((task.description ?? '').trim().isNotEmpty) ...<Widget>[
                  const SizedBox(height: 10),
                  Text(
                    task.description!,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AppTextStyles.bodySmall.copyWith(
                      color: tokens.textSecondary,
                      fontSize: 13,
                      height: 1.4,
                    ),
                  ),
                ],
                const SizedBox(height: 10),
                Wrap(
                  spacing: 12,
                  runSpacing: 8,
                  children: <Widget>[
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: <Widget>[
                        Icon(Icons.schedule_outlined, size: 14, color: tokens.textMuted),
                        const SizedBox(width: 4),
                        Text(
                          subtitle,
                          style: AppTextStyles.bodySmall.copyWith(
                            color: tokens.textMuted,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: <Widget>[
                        Icon(Icons.check_circle_outline, size: 14, color: tokens.textMuted),
                        const SizedBox(width: 4),
                        Text(
                          '${task.completedSubtasks}/${task.totalSubtasks}',
                          style: AppTextStyles.bodySmall.copyWith(
                            color: tokens.textMuted,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );

    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        splashColor: AppColorsShared.accentDim,
        highlightColor: AppColorsShared.accentDim.withValues(alpha: 0.5),
        child: card,
      ),
    );
  }
}
