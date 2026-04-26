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

  Color _priorityColor(String priority) {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return AppColorsShared.rose;
      case 'high':
        return AppColorsShared.accent;
      case 'medium':
        return AppColorsShared.sky;
      case 'low':
        return AppColorsShared.sage;
      default:
        return AppColorsShared.sky;
    }
  }

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final pColor = _priorityColor(task.priority);
    final subtitle = task.deadline == null
        ? '${task.estimatedDuration} min'
        : '${DateFormat('MMM d').format(task.deadline!)} • ${task.estimatedDuration} min';

    final card = Container(
      decoration: BoxDecoration(
        color: tokens.bgSurface,
        borderRadius: BorderRadius.circular(12),
        border: Border(
          left: BorderSide(color: pColor, width: 3),
          top: BorderSide(color: tokens.borderSubtle),
          right: BorderSide(color: tokens.borderSubtle),
          bottom: BorderSide(color: tokens.borderSubtle),
        ),
        boxShadow: [
          BoxShadow(
            color: isDark ? const Color(0x73000000) : const Color(0x143C2D14),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
          BoxShadow(
            color: isDark ? const Color(0x80000000) : const Color(0x0A3C2D14),
            blurRadius: 2,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Stack(
        children: [
          Positioned(
            top: 0,
            left: 0,
            child: Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: AppColorsShared.accentDim,
                border: Border.all(color: AppColorsShared.accentGlow),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Center(
                child: Text(
                  task.aiPriorityScore?.toString() ?? '0',
                  style: AppTextStyles.labelSmall.copyWith(
                    color: AppColorsShared.accent,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(left: 36),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  task.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: AppTextStyles.labelMedium.copyWith(color: tokens.textPrimary),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    TfBadge.priority(task.priority),
                    TfBadge(label: task.category),
                    TfBadge(label: task.projectName ?? 'GENERAL', uppercase: true),
                  ],
                ),
                if ((task.description ?? '').trim().isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Text(
                    task.description!,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AppTextStyles.bodySmall.copyWith(color: tokens.textSecondary),
                  ),
                ],
                const SizedBox(height: 10),
                Row(
                  children: [
                    Icon(Icons.schedule_outlined, size: 14, color: tokens.textMuted),
                    const SizedBox(width: 4),
                    Text(
                      subtitle,
                      style: AppTextStyles.bodySmall.copyWith(color: tokens.textMuted),
                    ),
                    const Spacer(),
                    Icon(Icons.check_circle_outline, size: 14, color: tokens.textMuted),
                    const SizedBox(width: 4),
                    Text(
                      '${task.completedSubtasks}/${task.totalSubtasks}',
                      style: AppTextStyles.bodySmall.copyWith(color: tokens.textMuted),
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
