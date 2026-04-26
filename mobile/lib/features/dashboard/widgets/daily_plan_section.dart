import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/theme/app_theme.dart';

class DailyPlanSection extends StatelessWidget {
  const DailyPlanSection({
    super.key,
    required this.plan,
    required this.onGenerate,
  });

  final Map<String, dynamic>? plan;
  final VoidCallback onGenerate;

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;

    if (plan == null) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: tokens.bgSurface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: tokens.borderMedium),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Center(
              child: Column(
                children: <Widget>[
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: AppSemanticColors.primary.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(
                      Icons.auto_awesome,
                      color: AppSemanticColors.primary,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Today\'s Plan',
                    style: AppTextStyles.titleLarge.copyWith(
                      color: tokens.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'No AI plan for today yet.',
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: tokens.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: <Color>[
                      AppSemanticColors.primary,
                      AppSemanticColors.primary.withValues(alpha: 0.8),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(14),
                    onTap: onGenerate,
                    child: Center(
                      child: Text(
                        'Generate Today\'s Plan',
                        style: AppTextStyles.bodyMedium.copyWith(
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                          color: tokens.bgSurface,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    }

    final schedule = (plan?['schedule'] as List? ?? const <dynamic>[]);
    final focusTask = '${plan?['focus_task'] ?? 'No focus task selected'}';
    final advice =
        '${plan?['advice'] ?? 'Stay focused on your high-priority tasks and minimize distractions.'}';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: tokens.bgSurface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppSemanticColors.sage.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Text(
                'Today\'s Plan',
                style: AppTextStyles.titleLarge.copyWith(
                  color: tokens.textPrimary,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppSemanticColors.sage.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  'ACTIVE TODAY',
                  style: AppTextStyles.labelSmall.copyWith(
                    color: AppSemanticColors.sage,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          LayoutBuilder(
            builder: (context, constraints) {
              final shouldStack = constraints.maxWidth < 420;
              if (shouldStack) {
                return Column(
                  children: <Widget>[
                    _InfoBlock(
                      title: 'FOCUS TASK',
                      text: focusTask,
                      textColor: tokens.textPrimary,
                    ),
                    const SizedBox(height: 10),
                    _InfoBlock(
                      title: 'ADVICE',
                      text: advice,
                      textColor: tokens.textPrimary,
                    ),
                  ],
                );
              }

              return Row(
                children: <Widget>[
                  Expanded(
                    child: _InfoBlock(
                      title: 'FOCUS TASK',
                      text: focusTask,
                      textColor: tokens.textPrimary,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _InfoBlock(
                      title: 'ADVICE',
                      text: advice,
                      textColor: tokens.textPrimary,
                    ),
                  ),
                ],
              );
            },
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: tokens.bgRaised,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: tokens.borderSubtle),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  'Schedule',
                  style: AppTextStyles.bodyMedium.copyWith(
                    fontWeight: FontWeight.w700,
                    color: tokens.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                if (schedule.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Text(
                      'No schedule saved.',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: tokens.textMuted,
                      ),
                    ),
                  )
                else
                  ...schedule.take(5).map((item) => _ScheduleRow(item: item)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoBlock extends StatelessWidget {
  const _InfoBlock(
      {required this.title, required this.text, required this.textColor});

  final String title;
  final String text;
  final Color textColor;

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: tokens.bgRaised,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: tokens.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            title,
            style: AppTextStyles.labelSmall.copyWith(
              color: AppSemanticColors.primary,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            text,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            style: AppTextStyles.bodyMedium.copyWith(
              fontWeight: FontWeight.w600,
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }
}

class _ScheduleRow extends StatelessWidget {
  const _ScheduleRow({required this.item});

  final dynamic item;

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final title = '${item['title'] ?? item['task_id'] ?? 'Untitled task'}';
    final start = '${item['suggested_start'] ?? '--:--'}';
    final estimated = item['estimated_duration'];
    final duration = estimated is num ? '${estimated.toStringAsFixed(0)}m' : '';
    final parsed = DateTime.tryParse('${item['deadline'] ?? ''}');

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color: tokens.bgSurface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: tokens.borderSubtle),
      ),
      child: Row(
        children: <Widget>[
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
            decoration: BoxDecoration(
              color: AppSemanticColors.primary.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              start,
              style: AppTextStyles.labelSmall.copyWith(
                color: AppSemanticColors.primary,
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
                  style: AppTextStyles.bodyMedium.copyWith(
                    fontWeight: FontWeight.w600,
                    color: tokens.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  duration.isEmpty
                      ? (parsed == null
                          ? 'No deadline'
                          : DateFormat('MMM d').format(parsed))
                      : duration,
                  style: AppTextStyles.bodySmall.copyWith(
                    color: tokens.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
