import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/tf_page_header.dart';

class UpcomingTasksSection extends StatelessWidget {
  const UpcomingTasksSection({super.key, required this.tasks});

  final List<Map<String, dynamic>> tasks;

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final visibleTasks = tasks.take(5).toList(growable: false);
    final visibleCount = visibleTasks.length;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: tokens.bgSurface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: tokens.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Row(
              children: <Widget>[
                const TfSectionLabel(label: 'Upcoming'),
                const Spacer(),
                Padding(
                  padding: const EdgeInsets.only(right: 16),
                  child: Text(
                    '$visibleCount tasks',
                    style: AppTextStyles.labelSmall.copyWith(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: AppSemanticColors.primary,
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (tasks.isEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
              child: Text(
                'No upcoming tasks',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: tokens.textSecondary,
                ),
              ),
            )
          else
            ...visibleTasks.asMap().entries.map(
                  (entry) => _UpcomingItem(
                    task: entry.value,
                    isLast: entry.key == visibleTasks.length - 1,
                  ),
                ),
        ],
      ),
    );
  }
}

class _UpcomingItem extends StatelessWidget {
  const _UpcomingItem({required this.task, required this.isLast});

  final Map<String, dynamic> task;
  final bool isLast;

  Color _priorityColor(String value) {
    return AppPriorityColors.colorFor(value);
  }

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final title = '${task['title'] ?? 'Task'}';
    final priority = '${task['priority'] ?? 'medium'}';
    final deadline = DateTime.tryParse('${task['deadline'] ?? ''}');

    Color dotColor;
    switch (priority.toLowerCase()) {
      case 'high':
      case 'urgent':
        dotColor = AppSemanticColors.primary;
        break;
      case 'low':
        dotColor = AppSemanticColors.sage;
        break;
      case 'medium':
      default:
        dotColor = AppSemanticColors.sky;
        break;
    }

    return Column(
      children: <Widget>[
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: <Widget>[
              Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(
                  color: dotColor,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTextStyles.bodySmall.copyWith(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: tokens.textPrimary,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                deadline == null ? 'No date' : DateFormat('MMM d').format(deadline),
                style: AppTextStyles.bodySmall.copyWith(
                  fontSize: 11,
                  color: tokens.textMuted,
                ),
              ),
            ],
          ),
        ),
        if (!isLast)
          Divider(
            height: 1,
            thickness: 0.5,
            color: tokens.borderSubtle,
          ),
      ],
    );
  }
}
