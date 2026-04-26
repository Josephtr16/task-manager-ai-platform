import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/theme/app_theme.dart';

class UpcomingTasksSection extends StatelessWidget {
  const UpcomingTasksSection({super.key, required this.tasks});

  final List<Map<String, dynamic>> tasks;

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;

    return ConstrainedBox(
      constraints: const BoxConstraints(minWidth: 280, maxWidth: 300),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: tokens.bgSurface,
          borderRadius: BorderRadius.circular(20),
          boxShadow: <BoxShadow>[
            BoxShadow(
              color: tokens.textPrimary.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              children: <Widget>[
                Container(
                  width: 30,
                  height: 30,
                  decoration: BoxDecoration(
                    color: tokens.bgRaised,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.access_time_rounded,
                    size: 16,
                    color: AppSemanticColors.primary,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  'Upcoming',
                  style: AppTextStyles.bodyMedium.copyWith(
                    fontWeight: FontWeight.w700,
                    color: tokens.textPrimary,
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppSemanticColors.primary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    '${tasks.length}',
                    style: AppTextStyles.labelSmall.copyWith(
                      color: AppSemanticColors.primary,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (tasks.isEmpty)
              Text(
                'No upcoming tasks',
                style: AppTextStyles.bodyMedium.copyWith(color: tokens.textSecondary),
              )
            else
              ...tasks.take(3).toList().asMap().entries.map(
                    (entry) => _UpcomingItem(
                      task: entry.value,
                      isLast: entry.key == tasks.take(3).length - 1,
                    ),
                  ),
          ],
        ),
      ),
    );
  }
}

class _UpcomingItem extends StatelessWidget {
  const _UpcomingItem({required this.task, required this.isLast});

  final Map<String, dynamic> task;
  final bool isLast;

  Color _priorityColor(String value) {
    switch (value.toLowerCase()) {
      case 'urgent':
        return AppSemanticColors.rose;
      case 'high':
        return AppSemanticColors.primary;
      case 'low':
        return AppSemanticColors.sage;
      default:
        return AppSemanticColors.sky;
    }
  }

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final title = '${task['title'] ?? 'Task'}';
    final priority = '${task['priority'] ?? 'medium'}';
    final subtasks = task['subtasks'] as List? ?? const <dynamic>[];
    final completedSubtasks =
        subtasks.where((s) => (s as Map)['completed'] == true).length;
    final deadline = DateTime.tryParse('${task['deadline'] ?? ''}');

    return Column(
      children: <Widget>[
        Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Padding(
                padding: const EdgeInsets.only(top: 7),
                child: Container(
                  width: 4,
                  height: 4,
                  decoration: BoxDecoration(
                    color: _priorityColor(priority),
                    shape: BoxShape.circle,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTextStyles.bodySmall.copyWith(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: tokens.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: <Widget>[
                        _chip(context,
                            deadline == null ? 'No date' : DateFormat('MMM d').format(deadline),
                            tokens.bgRaised, tokens.textSecondary),
                        _chip(
                          context,
                          '$completedSubtasks/${subtasks.length}',
                          AppSemanticColors.sage.withValues(alpha: 0.12),
                          AppSemanticColors.sage,
                          icon: Icons.check_circle_outline,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        if (!isLast)
          Divider(
            height: 1,
            thickness: 1,
            color: tokens.borderSubtle,
          ),
      ],
    );
  }

  Widget _chip(BuildContext context, String text, Color bg, Color fg,
      {IconData? icon}) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: tokens.borderSubtle),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          if (icon != null) ...<Widget>[
            Icon(icon, size: 10, color: fg),
            const SizedBox(width: 3),
          ],
          Text(
            text,
            style: AppTextStyles.labelSmall.copyWith(
              fontSize: 10,
              color: fg,
            ),
          ),
        ],
      ),
    );
  }
}
