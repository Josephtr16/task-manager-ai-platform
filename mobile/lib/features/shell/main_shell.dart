import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../tasks/widgets/create_task_sheet.dart';
import '../../../shared/widgets/bottom_nav_bar.dart';

class MainShell extends StatelessWidget {
  const MainShell({super.key, required this.child});

  final Widget child;

  int _indexFromLocation(String loc) {
    if (loc.startsWith('/tasks')) return 1;
    if (loc.startsWith('/projects')) return 3;
    if (loc.startsWith('/insights')) return 4;
    if (loc.startsWith('/kanban')) return 4;
    if (loc.startsWith('/calendar')) return 4;
    if (loc.startsWith('/focus')) return 4;
    if (loc.startsWith('/settings')) return 4;
    return 0;
  }

  void _onTab(BuildContext context, int index) {
    switch (index) {
      case 0:
        context.go('/dashboard');
      case 1:
        context.go('/tasks');
      case 3:
        context.go('/projects');
      case 4:
        _openMoreMenu(context);
    }
  }

  void _openMoreMenu(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => _MoreMenu(),
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
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 20),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Container(
            width: 44,
            height: 4,
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: Colors.grey.shade400,
              borderRadius: BorderRadius.circular(999),
            ),
          ),
          _menuItem(context, Icons.psychology_rounded, 'Insights', '/insights'),
          _menuItem(context, Icons.view_kanban_rounded, 'Kanban', '/kanban'),
          _menuItem(context, Icons.calendar_month_rounded, 'Calendar', '/calendar'),
          _menuItem(context, Icons.my_location_rounded, 'Focus', '/focus'),
          _menuItem(context, Icons.settings_rounded, 'Settings', '/settings'),
        ],
      ),
    );
  }

  Widget _menuItem(
    BuildContext context,
    IconData icon,
    String label,
    String route,
  ) {
    return ListTile(
      leading: Icon(icon),
      title: Text(label),
      trailing: const Icon(Icons.chevron_right),
      onTap: () {
        Navigator.of(context).pop();
        context.go(route);
      },
    );
  }
}
