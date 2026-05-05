import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../tasks/widgets/create_task_sheet.dart';
import '../../../shared/widgets/bottom_nav_bar.dart';

class MainShell extends StatelessWidget {
  const MainShell({super.key, required this.child});

  final Widget child;

  int _indexFromLocation(String loc) {
    if (loc.startsWith('/dashboard')) return 0;
    if (loc.startsWith('/tasks')) return 1;
    if (loc.startsWith('/projects')) return 2;
    if (loc.startsWith('/kanban')) return 4;
    if (loc.startsWith('/calendar')) return 4;
    if (loc.startsWith('/focus')) return 4;
    if (loc.startsWith('/settings')) return 4;
    if (loc.startsWith('/insights')) return 4;
    return 0; // dashboard
  }

  void _onTab(BuildContext context, int index) {
    switch (index) {
      case 0:
        context.go('/dashboard');
        break;
      case 1:
        context.go('/tasks');
        break;
      case 2:
        context.go('/projects');
        break;
      case 3:
        context.go('/insights');
        break;
      case 4:
        _openMoreMenu(context);
        break;
      default:
        break;
    }
  }

  void _openMoreMenu(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _MoreMenu(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    final idx = _indexFromLocation(location);

    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavBar(
        currentIndex: idx,
        onTabSelected: (index) => _onTab(context, index),
        onFabTap: () {
          showModalBottomSheet<void>(
            context: context,
            isScrollControlled: true,
            backgroundColor: Colors.transparent,
            builder: (_) => const CreateTaskSheet(),
          );
        },
      ),
    );
  }
}

class _MoreMenu extends StatelessWidget {
  const _MoreMenu();

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;

    Widget destinationCard({
      required IconData icon,
      required String title,
      required String subtitle,
      required Color tint,
      required String route,
    }) {
      return Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {
            Navigator.of(context).pop();
            context.go(route);
          },
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: tokens.bgOverlay,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: tokens.borderSubtle),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: tint.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(11),
                  ),
                  child: Icon(icon, size: 18, color: tint),
                ),
                const SizedBox(height: 10),
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: tokens.textPrimary,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        fontSize: 11,
                        color: tokens.textMuted,
                        height: 1.25,
                      ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
      decoration: BoxDecoration(
        color: tokens.bgSurface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Center(
              child: Container(
                width: 36,
                height: 4,
                margin: const EdgeInsets.only(top: 12),
                decoration: BoxDecoration(
                  color: tokens.borderMedium,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
            const SizedBox(height: 16),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 1.25,
              children: <Widget>[
                destinationCard(
                  icon: Icons.view_kanban_rounded,
                  title: 'Kanban',
                  subtitle: 'Track progress visually',
                  tint: AppSemanticColors.primary,
                  route: '/kanban',
                ),
                destinationCard(
                  icon: Icons.calendar_month_rounded,
                  title: 'Calendar',
                  subtitle: 'Plan deadlines and events',
                  tint: AppSemanticColors.sky,
                  route: '/calendar',
                ),
                destinationCard(
                  icon: Icons.auto_graph_rounded,
                  title: 'AI Insights',
                  subtitle: 'See smart recommendations',
                  tint: AppSemanticColors.sage,
                  route: '/insights',
                ),
                destinationCard(
                  icon: Icons.my_location_rounded,
                  title: 'Focus',
                  subtitle: 'Stay on the next action',
                  tint: AppSemanticColors.rose,
                  route: '/focus',
                ),
              ],
            ),
            const SizedBox(height: 14),
            Material(
              color: Colors.transparent,
              child: InkWell(
                borderRadius: BorderRadius.circular(16),
                onTap: () {
                  Navigator.of(context).pop();
                  context.go('/settings');
                },
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 14,
                  ),
                  decoration: BoxDecoration(
                    color: tokens.bgOverlay,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: tokens.borderSubtle),
                  ),
                  child: Row(
                    children: <Widget>[
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: tokens.textMuted.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(11),
                        ),
                        child: Icon(
                          Icons.settings_rounded,
                          size: 18,
                          color: tokens.textMuted,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            Text(
                              'Settings',
                              style: Theme.of(context)
                                  .textTheme
                                  .titleSmall
                                  ?.copyWith(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w800,
                                    color: tokens.textPrimary,
                                  ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'App preferences & account',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(
                                    fontSize: 11,
                                    color: tokens.textMuted,
                                  ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Icon(
                        Icons.chevron_right_rounded,
                        color: tokens.textMuted,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
