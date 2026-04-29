import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/theme/app_theme.dart';
import '../../tasks/models/task_model.dart';
import '../../tasks/widgets/task_detail_sheet.dart';

DateTime? _parseDeadline(String raw) {
  final text = raw.trim();
  if (text.isEmpty) return null;

  final parsed = DateTime.tryParse(text);
  if (parsed == null) return null;
  final local = parsed.toLocal();
  return DateTime(local.year, local.month, local.day);
}

class AiRecommendsSection extends StatelessWidget {
  const AiRecommendsSection({super.key, required this.tasks});

  static const int _maxRecommendations = 3;
  final List<Map<String, dynamic>> tasks;

  int _parseScore(dynamic raw) {
    final text = '${raw ?? ''}'.trim();
    if (text.isEmpty) return 0;
    final direct = int.tryParse(text);
    if (direct != null) return direct;
    final match = RegExp(r'(\d{1,3})').firstMatch(text);
    return int.tryParse(match?.group(1) ?? '') ?? 0;
  }

  int _getUrgencyScore(String? deadlineRaw) {
    if (deadlineRaw == null || deadlineRaw.trim().isEmpty) return 5;
    final due = _parseDeadline(deadlineRaw);
    if (due == null) return 5;

    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final target = DateTime(due.year, due.month, due.day);
    final diffDays = target.difference(today).inDays;

    if (diffDays < 0) return 50;
    if (diffDays == 0) return 40;
    if (diffDays <= 2) return 30;
    if (diffDays <= 7) return 18;
    if (diffDays <= 14) return 10;
    return 3;
  }

  int _getPriorityScore(String priority) {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 40;
      case 'high':
        return 28;
      case 'medium':
        return 16;
      case 'low':
        return 8;
      default:
        return 10;
    }
  }

  List<Map<String, dynamic>> _buildRecommendationTasks() {
    final ranked = tasks
        .where((task) => '${task['status'] ?? ''}'.toLowerCase() != 'done')
        .map((task) {
      final priority = '${task['priority'] ?? 'medium'}';
      final deadlineRaw = task['deadline']?.toString();
      final aiBoost = _parseScore(
        task['aiPriorityScore'] ?? task['ai_priority_score'] ?? task['aiScore'],
      );
      final score =
          _getPriorityScore(priority) + _getUrgencyScore(deadlineRaw) + aiBoost;

      return <String, dynamic>{
        ...task,
        '_recommendationScore': score,
      };
    }).toList();

    ranked.sort((a, b) => (b['_recommendationScore'] as int)
        .compareTo(a['_recommendationScore'] as int));

    final seenTitles = <String>{};
    final unique = <Map<String, dynamic>>[];

    for (final task in ranked) {
      final normalizedTitle =
          '${task['title'] ?? task['name'] ?? ''}'.trim().toLowerCase();
      final key = normalizedTitle.isEmpty
          ? '${task['id'] ?? task['_id'] ?? task.hashCode}'
          : normalizedTitle;
      if (seenTitles.contains(key)) continue;
      seenTitles.add(key);
      unique.add(task);
    }

    return unique.take(_maxRecommendations).toList();
  }

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final top = _buildRecommendationTasks();
    final visibleTop = top.take(_maxRecommendations).toList(growable: false);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Row(
          children: <Widget>[
            Container(
              width: 32,
              height: 32,
              margin: const EdgeInsets.only(right: 8),
              decoration: BoxDecoration(
                color: AppSemanticColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                Icons.lightbulb_outline_rounded,
                size: 18,
                color: AppSemanticColors.primary,
              ),
            ),
            Text(
              'AI Recommends',
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: tokens.textPrimary,
              ),
            ),
            const Spacer(),
            TextButton(
              onPressed: () {},
              style: TextButton.styleFrom(
                minimumSize: const Size(44, 44),
                padding: const EdgeInsets.all(0),
              ),
              child: Icon(Icons.arrow_forward_rounded, color: tokens.textMuted),
            ),
          ],
        ),
        const Visibility(visible: false, child: SizedBox(height: 0)),
        const SizedBox(height: 10),
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 260),
          child: visibleTop.isEmpty
              ? Container(
                  key: const ValueKey<String>('empty-ai-recommends'),
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: tokens.bgSurface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: tokens.borderSubtle),
                  ),
                  child: Text(
                    'No recommendations yet.',
                    style: AppTextStyles.bodyMedium
                        .copyWith(color: tokens.textMuted),
                  ),
                )
              : Column(
                  key: ValueKey<int>(visibleTop.length),
                  children: visibleTop
                      .map((task) => _AiTaskCard(task: task, tokens: tokens))
                      .toList(),
                ),
        ),
      ],
    );
  }
}

class _AiTaskCard extends StatefulWidget {
  const _AiTaskCard({required this.task, required this.tokens});

  final Map<String, dynamic> task;
  final AppColorTokens tokens;

  @override
  State<_AiTaskCard> createState() => _AiTaskCardState();
}

class _AiTaskCardState extends State<_AiTaskCard> {
  bool isChecked = false;

  Map<String, dynamic> get task => widget.task;
  AppColorTokens get tokens => widget.tokens;

  Color _priorityColor(String priority) {
    return AppPriorityColors.colorFor(priority);
  }

  String _formatDeadline(String raw) {
    if (raw.trim().isEmpty) return 'No deadline';
    final dt = _parseDeadline(raw);
    if (dt == null) return raw;

    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final target = DateTime(dt.year, dt.month, dt.day);
    final diff = target.difference(today).inDays;

    if (diff < 0) return 'Overdue';
    if (diff == 0) return 'Today';
    if (diff == 1) return 'Tomorrow';
    if (diff < 7) return 'in $diff days';
    return DateFormat('MMM d').format(dt);
  }

  int? _resolveEstimatedMinutes() {
    final candidates = <dynamic>[
      task['estimatedDuration'],
      task['estimated_duration'],
      task['aiPredictedDuration'],
      task['ai_predicted_duration'],
      task['duration'],
      task['scheduleDurationMinutes'],
      task['schedule_duration_minutes'],
    ];

    for (final candidate in candidates) {
      if (candidate is num && candidate > 0) {
        return candidate.round();
      }
      if (candidate is String) {
        final parsed = int.tryParse(candidate);
        if (parsed != null && parsed > 0) return parsed;
      }
    }
    return null;
  }

  String _formatDuration(int? minutes) {
    if (minutes == null || minutes <= 0) return 'No estimate';
    if (minutes < 60) return '${minutes}m';
    final hours = minutes / 60;
    return hours % 1 == 0
        ? '${hours.toInt()}h'
        : '${hours.toStringAsFixed(1)}h';
  }

  int? _resolveAiScore() {
    final candidates = <dynamic>[
      task['aiPriorityScore'],
      task['ai_priority_score'],
      task['aiScore'],
      task['ai_score'],
      task['score'],
    ];
    for (final candidate in candidates) {
      if (candidate is num) {
        return candidate.round();
      }
      if (candidate is String) {
        final parsed = int.tryParse(candidate);
        if (parsed != null) return parsed;
      }
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final priority = '${task['priority'] ?? 'medium'}';
    final priorityColor = _priorityColor(priority);
    final category = '${task['category'] ?? task['type'] ?? 'General'}'.trim();
    final aiInsight = '${task['aiInsight'] ?? task['ai_insight'] ?? ''}'.trim();
    final deadlineRaw = '${task['deadline'] ?? ''}'.trim();
    final formattedDeadline = _formatDeadline(deadlineRaw);
    final estimatedMinutes = _resolveEstimatedMinutes();
    final aiScore = _resolveAiScore();
    final taskTitle =
        '${task['title'] ?? task['name'] ?? 'Untitled Task'}'.trim();
    final description =
        '${task['description'] ?? 'Smart recommendation from your activity.'}'
            .trim();

    final taskModel = TaskModel.fromJson(task);

    return GestureDetector(
      onTap: () {
        showModalBottomSheet<void>(
          context: context,
          isScrollControlled: true,
          builder: (_) => TaskDetailSheet(task: taskModel),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: tokens.bgSurface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: tokens.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          // Main row: checkbox, content, and right metadata
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              // Custom styled checkbox
              GestureDetector(
                onTap: () {
                  setState(() => isChecked = !isChecked);
                },
                child: Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(6),
                    color: isChecked ? AppColors.success : tokens.bgRaised,
                    border: Border.all(
                      color: isChecked ? AppColors.success : tokens.borderStrong,
                      width: 1,
                    ),
                  ),
                  child: isChecked
                      ? const Icon(Icons.check, size: 16, color: Colors.white)
                      : null,
                ),
              ),
              const SizedBox(width: 8),
              // Main content (flex)
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    // Task title
                    Text(
                      taskTitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTextStyles.labelMedium.copyWith(
                        color: tokens.textPrimary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    // Badges (Priority, Category, AI Score)
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: <Widget>[
                        _badgeChip(
                          label: priority.toUpperCase(),
                          color: priorityColor,
                        ),
                        _badgeChip(
                          label: category,
                          color: AppSemanticColors.primary,
                          backgroundColor:
                              AppSemanticColors.primary.withValues(alpha: 0.1),
                        ),
                        if (aiScore != null)
                          _badgeChip(
                            label: 'AI $aiScore%',
                            color: AppSemanticColors.sky,
                            backgroundColor:
                                AppSemanticColors.sky.withValues(alpha: 0.1),
                            isAi: true,
                          ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    // Description
                    Text(
                      description,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppTextStyles.bodySmall.copyWith(
                        fontSize: 12,
                        color: tokens.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              // Right side: deadline and duration (vertical)
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: <Widget>[
                  _rightMetaItem(
                    icon: Icons.event_outlined,
                    text: formattedDeadline,
                  ),
                  const SizedBox(height: 6),
                  _rightMetaItem(
                    icon: Icons.timer_outlined,
                    text: _formatDuration(estimatedMinutes),
                  ),
                ],
              ),
            ],
          ),
          // AI Insight (if available) - full width below
          if (aiInsight.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                border: Border(
                  left: BorderSide(
                    color: const Color(0xFFD4A574),
                    width: 3,
                  ),
                ),
                color: const Color(0xFFFBF4ED),
                borderRadius: const BorderRadius.only(
                  topRight: Radius.circular(8),
                  bottomRight: Radius.circular(8),
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Icon(
                    Icons.lightbulb_outline_rounded,
                    size: 16,
                    color: const Color(0xFFD4A574),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      aiInsight,
                      style: AppTextStyles.bodySmall.copyWith(
                        fontSize: 11,
                        color: const Color(0xFF6B5344),
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
      ),
    );
  }

  Widget _badgeChip({
    required String label,
    required Color color,
    Color? backgroundColor,
    bool isAi = false,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor ?? color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: AppTextStyles.labelSmall.copyWith(
          fontSize: 10,
          color: color,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  Widget _rightMetaItem({
    required IconData icon,
    required String text,
  }) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        Icon(icon, size: 14, color: tokens.textMuted),
        const SizedBox(width: 4),
        Text(
          text,
          style: AppTextStyles.bodySmall.copyWith(
            fontSize: 11,
            color: tokens.textSecondary,
          ),
        ),
      ],
    );
  }

}
