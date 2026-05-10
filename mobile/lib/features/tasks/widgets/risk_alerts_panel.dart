import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_theme.dart';

class RiskAlertsPanel extends StatelessWidget {
  const RiskAlertsPanel({super.key, required this.risk});

  final Map<String, dynamic> risk;

  String _cleanRiskText(String raw) => raw;

  List<Map<String, dynamic>> _riskAlerts() {
    final rawAlerts = risk['alerts'];
    if (rawAlerts is! List) return const <Map<String, dynamic>>[];

    return rawAlerts
        .map((alert) {
          if (alert is Map) {
            return Map<String, dynamic>.from(alert);
          }

          return <String, dynamic>{
            'type': 'risk',
            'severity': 'medium',
            'message': alert.toString(),
            'affected_task_ids': <String>[],
          };
        })
        .where((alert) => '${alert['message'] ?? ''}'.trim().isNotEmpty)
        .toList(growable: false);
  }

  Color _severityColor(String severity, AppColorTokens tokens) {
    switch (severity.toLowerCase()) {
      case 'high':
        return const Color(0xFFB85C5C);
      case 'medium':
        return const Color(0xFFC9924A);
      case 'low':
      default:
        return tokens.textMuted;
    }
  }

  String _summary() => '${risk['summary'] ?? ''}'.trim();

  String _badgeLabel(String value) {
    final label = value.trim();
    if (label.isEmpty) return 'RISK';
    return label.toUpperCase();
  }

  void _showRiskSheet(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final alerts = _riskAlerts();
    final summary = _summary();

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: tokens.bgSurface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) {
        return DraggableScrollableSheet(
          initialChildSize: 0.6,
          maxChildSize: 0.92,
          minChildSize: 0.4,
          expand: false,
          builder: (context, scrollController) {
            return Material(
              color: tokens.bgSurface,
              child: CustomScrollView(
                controller: scrollController,
                slivers: <Widget>[
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Align(
                            child: Container(
                              width: 36,
                              height: 4,
                              margin: const EdgeInsets.only(bottom: 16),
                              decoration: BoxDecoration(
                                color: tokens.borderSubtle,
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                          ),
                          Row(
                            children: <Widget>[
                              const Icon(
                                Icons.warning_amber_rounded,
                                size: 20,
                                color: Color(0xFFB85C5C),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Risk Alerts',
                                style: GoogleFonts.fraunces(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w700,
                                  color: tokens.textPrimary,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            summary,
                            style: TextStyle(
                              fontSize: 13,
                              color: tokens.textMuted,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Divider(color: tokens.borderSubtle),
                          const SizedBox(height: 12),
                        ],
                      ),
                    ),
                  ),
                  if (alerts.isEmpty)
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: <Widget>[
                            Icon(
                              Icons.check_circle_outline_rounded,
                              size: 48,
                              color: AppSemanticColors.sage,
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'No risks detected',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: tokens.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Your tasks look healthy!',
                              style: TextStyle(
                                fontSize: 13,
                                color: tokens.textMuted,
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  else
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                      sliver: SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            final alert = alerts[index];
                            final severity = '${alert['severity'] ?? 'low'}';
                            final accent = _severityColor(severity, tokens);
                            final message = '${alert['message'] ?? ''}'.trim();
                            final typeLabel = _badgeLabel('${alert['type'] ?? 'risk'}');
                            return Container(
                              margin: const EdgeInsets.only(bottom: 10),
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFFF5F5),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: accent.withOpacity(0.2),
                                  width: 1,
                                ),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: <Widget>[
                                  Container(
                                    width: 6,
                                    height: 6,
                                    margin: const EdgeInsets.only(top: 6, right: 10),
                                    decoration: BoxDecoration(
                                      color: accent,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  Expanded(
                                    child: Text(
                                      message,
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w500,
                                        color: tokens.textPrimary,
                                        height: 1.5,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: accent.withOpacity(0.08),
                                      borderRadius: BorderRadius.circular(999),
                                      border: Border.all(color: accent.withOpacity(0.18)),
                                    ),
                                    child: Text(
                                      typeLabel,
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w700,
                                        letterSpacing: 0.5,
                                        color: accent,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                          childCount: alerts.length,
                        ),
                      ),
                    ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final alerts = _riskAlerts();

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => _showRiskSheet(context),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: tokens.bgSurface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: tokens.borderSubtle, width: 1),
          ),
          child: Row(
            children: <Widget>[
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: const Color(0xFFB85C5C).withOpacity(0.10),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.warning_amber_rounded,
                  color: Color(0xFFB85C5C),
                  size: 18,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      'Risk Alerts',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: tokens.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      alerts.isEmpty
                          ? 'No risks detected'
                          : '${alerts.length} issues detected',
                      style: TextStyle(
                        fontSize: 13,
                        color: tokens.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right_rounded, color: tokens.textMuted),
            ],
          ),
        ),
      ),
    );
  }
}