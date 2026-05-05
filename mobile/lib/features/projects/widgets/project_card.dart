import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_theme.dart';
import '../models/project_model.dart';

class ProjectCard extends StatelessWidget {
  const ProjectCard({super.key, required this.project, required this.onTap});

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
        return const Color(0xFFBDBDBD);
    }
  }

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final progress = project.progress.clamp(0, 100);
    final due = project.dueDate == null ? 'No due date' : DateFormat('MMM d, yyyy').format(project.dueDate!);
    final catIcon = _categoryIcon(project.category);
    final catColor = _categoryColor(project.category);

    final inProgress = project.status.toLowerCase() == 'in-progress';

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: tokens.bgSurface, borderRadius: BorderRadius.circular(16), border: Border.all(color: tokens.borderSubtle, width: 0.5)),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: <Widget>[
          // Row 1
          Row(children: <Widget>[
            Container(
              width: 30,
              height: 30,
              decoration: BoxDecoration(color: catColor.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(9)),
              child: Center(child: Icon(catIcon, size: 14, color: catColor)),
            ),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
              decoration: BoxDecoration(color: inProgress ? AppSemanticColors.accentDim : AppSemanticColors.sage.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(4)),
              child: Text(inProgress ? 'IN-PROGRESS' : 'COMPLETED', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: inProgress ? AppSemanticColors.accentDark : AppSemanticColors.sage)),
            ),
          ]),

          // Row 2 - title
          Container(margin: const EdgeInsets.only(top: 10), child: Text(project.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: tokens.textPrimary))),

          // Row 3 - description
          Container(margin: const EdgeInsets.only(top: 4), child: Text(project.description ?? '', maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 11, color: tokens.textSecondary))),

          // Row 4 - progress label
          Container(margin: const EdgeInsets.only(top: 10), child: Row(children: [Text('Progress', style: TextStyle(fontSize: 10, color: tokens.textMuted)), const Spacer(), Text('$progress%', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppSemanticColors.primary))])),

          // Row 5 - progress bar
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(99),
            child: LinearProgressIndicator(value: progress / 100.0, minHeight: 3, backgroundColor: tokens.bgOverlay, valueColor: AlwaysStoppedAnimation<Color>(AppSemanticColors.primary)),
          ),

          // Row 6 - tasks and due
          Container(margin: const EdgeInsets.only(top: 8), child: Row(children: [Text('Tasks ${project.completedTasks}/${project.totalTasks}', style: TextStyle(fontSize: 10, color: tokens.textMuted)), const Spacer(), Flexible(child: Text(due, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 10, color: tokens.textMuted)))])),
        ]),
      ),
    );
  }
}
