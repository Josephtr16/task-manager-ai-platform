import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/gradient_background.dart';
import '../../../core/widgets/tf_page_header.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_colors.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/settings_provider.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final settings = ref.watch(settingsProvider);
    final notifier = ref.read(settingsProvider.notifier);
    final user = ref.watch(authProvider).valueOrNull?.user;
    final initials = () {
      final name = user?.name ?? '';
      if (name.isEmpty) return 'U';
      final parts = name.split(' ').where((p) => p.isNotEmpty).toList();
      if (parts.isEmpty) return 'U';
      return parts.map((e) => e[0]).take(2).join().toUpperCase();
    }();

    return Scaffold(
      body: GradientBackground(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: <Widget>[
            const TfPageHeader(title: 'Settings'),

            // Profile header
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: <Widget>[
                  Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      color: AppSemanticColors.accentDim,
                      borderRadius: BorderRadius.circular(26),
                      border: Border.all(color: AppSemanticColors.accentGlow, width: 2),
                    ),
                    child: Center(
                      child: Text(
                        initials,
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppSemanticColors.accentDark),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Text(user?.name ?? 'Unknown', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: tokens.textPrimary)),
                        const SizedBox(height: 4),
                        Text(user?.email ?? '', style: TextStyle(fontSize: 12, color: tokens.textMuted)),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Appearance
            _SettingsGroup(label: 'Appearance', child: Column(children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                child: Row(
                  children: <Widget>[
                    const Text('Theme', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                    const Spacer(),
                    Row(children: [
                      _ThemePill(label: 'Light', active: settings.themeMode == ThemeMode.light, onTap: () => notifier.setThemeMode(ThemeMode.light)),
                      const SizedBox(width: 8),
                      _ThemePill(label: 'Dark', active: settings.themeMode == ThemeMode.dark, onTap: () => notifier.setThemeMode(ThemeMode.dark)),
                      const SizedBox(width: 8),
                      _ThemePill(label: 'System', active: settings.themeMode == ThemeMode.system, onTap: () => notifier.setThemeMode(ThemeMode.system)),
                    ])
                  ],
                ),
              ),
            ])),

            // Account
            _SettingsGroup(label: 'Account', child: Column(children: [
              _SettingsRow(
                iconBg: AppSemanticColors.accentDim,
                iconBorder: AppSemanticColors.accentGlow,
                icon: Icons.person_outline_rounded,
                iconColor: AppSemanticColors.accentDark,
                label: 'Edit Profile',
                sub: 'Update your name and details',
                onTap: () {},
              ),
              _SettingsRow(
                iconBg: AppSemanticColors.sky.withValues(alpha: 0.12),
                iconBorder: AppSemanticColors.sky,
                icon: Icons.lock_outline_rounded,
                iconColor: AppSemanticColors.sky,
                label: 'Change Password',
                sub: 'Update your account password',
                onTap: () {},
              ),
              _SettingsRow(
                iconBg: AppSemanticColors.sage.withValues(alpha: 0.12),
                iconBorder: AppSemanticColors.sage,
                icon: Icons.notifications_outlined,
                iconColor: AppSemanticColors.sage,
                label: 'Notifications',
                sub: 'Manage notification preferences',
                onTap: () {},
              ),
            ])),

            // Data
            _SettingsGroup(label: 'Data', child: Column(children: [
              _SettingsRow(
                iconBg: tokens.bgRaised,
                iconBorder: tokens.borderSubtle,
                icon: Icons.cloud_download_outlined,
                iconColor: tokens.textSecondary,
                label: 'Export Data',
                sub: 'Download your account data',
                onTap: () {},
              ),
            ])),

            // Danger zone
            _SettingsGroup(label: 'Danger Zone', child: Column(children: [
              GestureDetector(
                onTap: () async {
                  final ok = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(
                    title: const Text('Delete account'),
                    content: const Text('Are you sure you want to delete your account? This action cannot be undone.'),
                    actions: [
                      TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel')),
                      TextButton(onPressed: () => Navigator.of(ctx).pop(true), child: const Text('Delete', style: TextStyle(color: AppColorsShared.rose))),
                    ],
                  ));
                  if (ok == true) {
                    // trigger deletion flow
                  }
                },
                child: Container(
                  color: Colors.transparent,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    child: Row(children: [
                      Container(width: 32, height: 32, decoration: BoxDecoration(color: AppSemanticColors.rose.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(9), border: Border.all(color: AppSemanticColors.rose)), child: const Icon(Icons.delete_outline_rounded, color: AppSemanticColors.rose)),
                      const SizedBox(width: 12),
                      Text('Delete Account', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppSemanticColors.rose)),
                    ]),
                  ),
                ),
              ),
            ])),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}

class _SettingsGroup extends StatelessWidget {
  const _SettingsGroup({required this.label, required this.child});

  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        TfSectionLabel(label: label),
        Container(
          decoration: BoxDecoration(color: tokens.bgSurface, border: Border(top: BorderSide(color: tokens.borderSubtle), bottom: BorderSide(color: tokens.borderSubtle))),
          child: child,
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}

class _ThemePill extends StatelessWidget {
  const _ThemePill({required this.label, required this.active, required this.onTap});

  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: active ? AppSemanticColors.accentDim : tokens.bgSurface,
          border: Border.all(color: active ? AppSemanticColors.accentGlow : tokens.borderSubtle),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: active ? AppSemanticColors.accentDark : tokens.textSecondary)),
      ),
    );
  }
}

class _SettingsRow extends StatelessWidget {
  const _SettingsRow({required this.iconBg, required this.iconBorder, required this.icon, required this.iconColor, required this.label, required this.sub, this.onTap});

  final Color iconBg;
  final Color iconBorder;
  final IconData icon;
  final Color iconColor;
  final String label;
  final String sub;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        child: Row(children: [
          Container(width: 32, height: 32, decoration: BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(9), border: Border.all(color: iconBorder)), child: Icon(icon, size: 18, color: iconColor)),
          const SizedBox(width: 12),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)), const SizedBox(height: 2), Text(sub, style: TextStyle(fontSize: 11, color: tokens.textMuted))]),
          const Spacer(),
          const Icon(Icons.chevron_right_rounded, size: 20)
        ]),
      ),
    );
  }
}
