import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/theme/app_theme.dart';

class AiRecommendsSection extends StatelessWidget {
  const AiRecommendsSection({super.key, required this.tasks});

  final List<Map<String, dynamic>> tasks;

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final top = tasks.take(4).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Row(
          children: <Widget>[
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
          child: top.isEmpty
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
                    style:
                        AppTextStyles.bodyMedium.copyWith(color: tokens.textMuted),
                  ),
                )
              : Column(
                  key: ValueKey<int>(top.length),
                  children: top
                      .map((task) => _AiTaskCard(task: task, tokens: tokens))
                      .toList(),
                ),
        ),
      ],
    );
  }
}

class _AiTaskCard extends StatelessWidget {
  const _AiTaskCard({required this.task, required this.tokens});

  final Map<String, dynamic> task;
  final AppColorTokens tokens;

  Color _priorityColor(String priority) {
    switch (priority.toLowerCase()) {
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

  String _formatDeadline(String raw) {
    if (raw.trim().isEmpty) return 'No deadline';
    final dt = DateTime.tryParse(raw);
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
    return hours % 1 == 0 ? '${hours.toInt()}h' : '${hours.toStringAsFixed(1)}h';
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
    final aiInsight = '${task['aiInsight'] ?? task['ai_insight'] ?? ''}'.trim();
    final deadlineRaw = '${task['deadline'] ?? ''}'.trim();
    final formattedDeadline = _formatDeadline(deadlineRaw);
    final estimatedMinutes = _resolveEstimatedMinutes();
    final aiScore = _resolveAiScore();

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: <Widget>[
                        if (aiScore != null)
                          Container(
                            margin: const EdgeInsets.only(right: 6),
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppSemanticColors.sky.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              'AI $aiScore',
                              style: AppTextStyles.labelSmall.copyWith(
                                color: AppSemanticColors.sky,
                              ),
                            ),
                          ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: priorityColor.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            priority.toUpperCase(),
                            style: AppTextStyles.labelSmall.copyWith(color: priorityColor),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  '${task['description'] ?? 'Smart recommendation from your activity.'}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTextStyles.bodySmall.copyWith(
                    fontSize: 12,
                    color: tokens.textSecondary,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: <Widget>[
                    _metaChip(
                      text: formattedDeadline,
                      icon: Icons.event_outlined,
                    ),
                    _metaChip(
                      text: _formatDuration(estimatedMinutes),
                      icon: Icons.timer_outlined,
                    ),
                  ],
                ),
                if (aiInsight.isNotEmpty)
                  Container(
                    margin: const EdgeInsets.only(top: 8),
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      border: Border(
                        left: BorderSide(
                          color: AppSemanticColors.sky,
                          width: 3,
                        ),
        ],
                      color: AppSemanticColors.sky.withValues(alpha: 0.06),
                      borderRadius: const BorderRadius.only(
                        topRight: Radius.circular(8),
                        bottomRight: Radius.circular(8),
                      ),
      ),
      child: Column(
                      aiInsight,
            decoration: BoxDecoration(
                        fontSize: 11,
                        color: AppSemanticColors.sky,
                        fontStyle: FontStyle.italic,
            ),
          ),
                        color: priorityColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        priority.toUpperCase(),
                        style: AppTextStyles.labelSmall.copyWith(color: priorityColor),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  '${task['description'] ?? 'Smart recommendation from your activity.'}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTextStyles.bodySmall.copyWith(
                    fontSize: 12,
                    color: tokens.textSecondary,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: <Widget>[
                    _metaChip(
                      text: deadlineRaw.isEmpty ? 'No deadline' : deadlineRaw,
                      icon: Icons.event_outlined,
                    ),
                    _metaChip(
                      text: '$durationRaw min',
                      icon: Icons.timer_outlined,
                    ),
                  ],
                ),
                if (aiInsight.isNotEmpty)
                  Container(
                    margin: const EdgeInsets.only(top: 8),
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      border: Border(
                        left: BorderSide(
                          color: AppSemanticColors.sky,
                          width: 3,
                        ),
                      ),
                      color: AppSemanticColors.sky.withValues(alpha: 0.06),
                      borderRadius: const BorderRadius.only(
                        topRight: Radius.circular(8),
                        bottomRight: Radius.circular(8),
                      ),
                    ),
                    child: Text(
                      aiInsight,
                      style: AppTextStyles.bodySmall.copyWith(
                        fontSize: 11,
                        color: AppSemanticColors.sky,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _metaChip({required String text, required IconData icon}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        color: tokens.bgRaised,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: tokens.borderSubtle),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Icon(icon, size: 12, color: tokens.textMuted),
          const SizedBox(width: 4),
          Text(
            text,
            style: AppTextStyles.bodySmall.copyWith(
              fontSize: 11,
              color: tokens.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
