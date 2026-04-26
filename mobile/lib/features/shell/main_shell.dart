import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../auth/providers/auth_provider.dart';
import '../notifications/providers/notifications_provider.dart';
import 'notification_sheet.dart';

class MainShell extends ConsumerWidget {
  const MainShell({super.key, required this.child});

  final Widget child;

  int _indexFromLocation(String loc) {
    if (loc.startsWith('/tasks')) return 1;
    if (loc.startsWith('/focus')) return 2;
    if (loc.startsWith('/projects')) return 3;
    return 0;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final location = GoRouterState.of(context).uri.toString();
    final idx = _indexFromLocation(location);
    final unread =
        ref.watch(notificationsProvider).valueOrNull?.unreadCount ?? 0;

    return Scaffold(
      body: child,
      bottomNavigationBar: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(height: 1, color: tokens.borderSubtle),
            NavigationBar(
              height: 68,
              backgroundColor: tokens.bgSurface,
              indicatorColor: AppColorsShared.accentDim,
              shadowColor: Colors.transparent,
              surfaceTintColor: Colors.transparent,
              selectedIndex: idx,
              labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
              onDestinationSelected: (value) {
                switch (value) {
                  case 0:
                    context.go('/dashboard');
                  case 1:
                    context.go('/tasks');
                  case 2:
                    context.go('/focus');
                  case 3:
                    context.go('/projects');
                  case 4:
                    showModalBottomSheet<void>(
                      context: context,
                      backgroundColor: Colors.transparent,
                      builder: (_) => _MoreMenu(unreadCount: unread),
                    );
                }
              },
              destinations: const [
                NavigationDestination(
                  icon: Icon(Icons.home_outlined),
                  selectedIcon: Icon(Icons.home, color: AppColorsShared.accent),
                  label: 'Dashboard',
                ),
                NavigationDestination(
                  icon: Icon(Icons.checklist_outlined),
                  selectedIcon: Icon(Icons.checklist, color: AppColorsShared.accent),
                  label: 'Tasks',
                ),
                NavigationDestination(
                  icon: Icon(Icons.my_location_outlined),
                  selectedIcon: Icon(Icons.my_location, color: AppColorsShared.accent),
                  label: 'Focus',
                ),
                NavigationDestination(
                  icon: Icon(Icons.folder_outlined),
                  selectedIcon: Icon(Icons.folder, color: AppColorsShared.accent),
                  label: 'Projects',
                ),
                NavigationDestination(
                  icon: Icon(Icons.menu),
                  label: 'More',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _MoreMenu extends ConsumerWidget {
  const _MoreMenu({required this.unreadCount});

  final int unreadCount;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.read(authProvider.notifier);
    final user = ref.watch(authProvider).valueOrNull?.user;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: Color(0xFF121110),
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          ListTile(
            leading: CircleAvatar(child: Text(user?.initials ?? 'U')),
            title: Text(user?.name ?? 'User'),
            subtitle: Text(user?.email ?? ''),
          ),
          _menu(context,
              icon: Icons.view_kanban_outlined,
              label: 'Kanban',
              route: '/kanban'),
          _menu(context,
              icon: Icons.calendar_today_outlined,
              label: 'Calendar',
              route: '/calendar'),
          _menu(context,
              icon: Icons.smart_toy_outlined,
              label: 'AI Insights',
              route: '/insights'),
          ListTile(
            leading: const Icon(Icons.notifications_none),
            title:
                Text('Notifications ${unreadCount > 99 ? "99+" : unreadCount}'),
            onTap: () {
              Navigator.of(context).pop();
              showModalBottomSheet<void>(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (_) => const NotificationSheet(),
              );
            },
          ),
          _menu(context,
              icon: Icons.settings_outlined,
              label: 'Settings',
              route: '/settings'),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.redAccent),
            title:
                const Text('Logout', style: TextStyle(color: Colors.redAccent)),
            onTap: () async {
              await auth.logout();
              if (context.mounted) context.go('/login');
            },
          ),
        ],
      ),
    );
  }

  Widget _menu(BuildContext context,
      {required IconData icon, required String label, required String route}) {
    return ListTile(
      leading: Icon(icon),
      title: Text(label),
      onTap: () {
        Navigator.of(context).pop();
        context.go(route);
      },
    );
  }
}
