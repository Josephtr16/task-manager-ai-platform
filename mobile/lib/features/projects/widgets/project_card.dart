import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/theme/app_theme.dart';
import '../models/project_model.dart';

class ProjectCard extends StatelessWidget {
  const ProjectCard(
      {super.key, required this.project, required this.onTap});

  final ProjectModel project;
  final VoidCallback onTap;

  IconData _categoryIcon(String? category) {
    switch ((category ?? '').toLowerCase()) {
      case 'work':
        return Icons.monitor_rounded;
      case 'personal':
      case 'health':
        return Icons.favorite_outline_rounded;
      case 'learning':
        return Icons.description_outlined;
      default:
        return Icons.folder_outlined;
    }
  }

  Color _categoryColor(String? category) {
    switch ((category ?? '').toLowerCase()) {
      case 'work':
        return AppSemanticColors.accent;
      case 'personal':
      case 'health':
        return AppSemanticColors.rose;
      case 'learning':
        return AppSemanticColors.sky;
      default:
        return AppSemanticColors.accent;
    }
  }

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final progress = project.progress.clamp(0, 100);
    final due = project.dueDate == null
        ? 'No due date'
        : DateFormat('MMM d, yy').format(project.dueDate!);
    final catIcon = _categoryIcon(project.category);
    final catColor = _categoryColor(project.category);
    final inProgress = project.status.toLowerCase() == 'in-progress';
    final isCompleted = project.status.toLowerCase() == 'completed';

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(15),
        decoration: BoxDecoration(
          color: tokens.bgSurface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: tokens.borderSubtle, width: 0.8),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            // Header row: icon + status badge
            Row(
              children: <Widget>[
                Container(
                  width: 34,
                  height: 34,
                  decoration: BoxDecoration(
                    color: catColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(catIcon, size: 16, color: catColor),
                ),
                const Spacer(),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: isCompleted
                        ? AppSemanticColors.sage.withValues(alpha: 0.12)
                        : AppSemanticColors.primary.withValues(alpha: 0.10),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    isCompleted ? 'COMPLETED' : 'IN-PROGRESS',
                    style: AppTextStyles.labelSmall.copyWith(
                      fontSize: 9,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.4,
                      color: isCompleted
                          ? AppSemanticColors.sage
                          : AppSemanticColors.primary,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 2),
            // Title
            Text(
              project.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTextStyles.bodySmall.copyWith(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: tokens.textPrimary,
                letterSpacing: -0.3,
              ),
            ),
            const SizedBox(height: 2),
            // Description
            Text(
              project.description ?? '',
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: AppTextStyles.bodySmall.copyWith(
                fontSize: 12,
                color: tokens.textSecondary,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 10),
            // Progress label
            Row(
              children: <Widget>[
                Text(
                  'Progress',
                  style: AppTextStyles.labelSmall.copyWith(
                    fontSize: 11,
                    color: tokens.textMuted,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const Spacer(),
                Text(
                  '$progress%',
                  style: AppTextStyles.labelSmall.copyWith(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: isCompleted
                        ? AppSemanticColors.sage
                        : AppSemanticColors.primary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 3),
            // Progress bar
            ClipRRect(
              borderRadius: BorderRadius.circular(99),
              child: LinearProgressIndicator(
                value: progress / 100.0,
                minHeight: 5,
                backgroundColor: tokens.bgOverlay,
                valueColor: AlwaysStoppedAnimation<Color>(
                  isCompleted
                      ? AppSemanticColors.sage
                      : AppSemanticColors.primary,
                ),
              ),
            ),
            const SizedBox(height: 4),
            // Footer: tasks + due
            Row(
              children: <Widget>[
                Icon(Icons.task_alt_rounded,
                    size: 12, color: tokens.textMuted),
                const SizedBox(width: 4),
                Text(
                  '${project.completedTasks}/${project.totalTasks}',
                  style: AppTextStyles.labelSmall.copyWith(
                    fontSize: 11,
                    color: tokens.textMuted,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const Spacer(),
                Icon(Icons.calendar_today_rounded,
                    size: 11, color: tokens.textMuted),
                const SizedBox(width: 4),
                Flexible(
                  child: Text(
                    due,
                    overflow: TextOverflow.ellipsis,
                    style: AppTextStyles.labelSmall.copyWith(
                      fontSize: 11,
                      color: tokens.textMuted,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
