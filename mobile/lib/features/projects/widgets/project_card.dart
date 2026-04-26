import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/tf_badge.dart';
import '../../../../core/widgets/tf_card.dart';
import '../models/project_model.dart';

class ProjectCard extends StatelessWidget {
  const ProjectCard({super.key, required this.project, required this.onTap});

  final ProjectModel project;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final due = project.dueDate == null
        ? 'No due date'
        : DateFormat('MMM d, yyyy').format(project.dueDate!);

    return TfCard(
      onTap: onTap,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            project.title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppTextStyles.labelMedium.copyWith(
              color: tokens.textPrimary,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            project.description ?? '',
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: AppTextStyles.bodySmall.copyWith(color: tokens.textSecondary),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              TfBadge.status(project.status),
              TfBadge(
                label: project.category.toUpperCase(),
                prefixIcon: Icons.sell_outlined,
                uppercase: true,
              ),
              TfBadge.priority(project.priority),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            height: 4,
            decoration: BoxDecoration(
              color: tokens.bgRaised,
              borderRadius: BorderRadius.circular(999),
            ),
            child: FractionallySizedBox(
              alignment: Alignment.centerLeft,
              widthFactor: (project.progress / 100).clamp(0.0, 1.0).toDouble(),
              child: Container(
                decoration: BoxDecoration(
                  color: AppColorsShared.accent,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Icon(Icons.checklist_rounded, size: 12, color: tokens.textMuted),
              const SizedBox(width: 4),
              Text(
                'Tasks ${project.completedTasks}/${project.totalTasks}',
                style: AppTextStyles.bodySmall.copyWith(color: tokens.textMuted),
              ),
              const Spacer(),
              Icon(Icons.event_outlined, size: 12, color: tokens.textMuted),
              const SizedBox(width: 4),
              Text(
                'Due: $due',
                style: AppTextStyles.bodySmall.copyWith(color: tokens.textMuted),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
