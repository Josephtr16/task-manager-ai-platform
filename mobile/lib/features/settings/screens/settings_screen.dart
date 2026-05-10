import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/gradient_background.dart';
import '../../../core/widgets/tf_card.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/settings_provider.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  Widget _sectionLabel(String text, AppColorTokens tokens) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 24, 4, 10),
      child: Text(
        text.toUpperCase(),
        style: AppTextStyles.labelSmall.copyWith(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 1.4,
          color: tokens.textMuted,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final settings = ref.watch(settingsProvider);
    final user = ref.watch(authProvider).valueOrNull?.user;

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: GradientBackground(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 52, 16, 120),
            children: <Widget>[
              // ──── 1. HEADER ────
              Text(
                'Settings',
                style: GoogleFonts.fraunces(
                  fontSize: 34,
                  fontWeight: FontWeight.w700,
                  color: tokens.textPrimary,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Manage your account and preferences',
                style: AppTextStyles.bodyMedium.copyWith(
                  fontSize: 14,
                  color: tokens.textSecondary,
                ),
              ),
              const SizedBox(height: 20),

              // ──── 2. USER CARD ────
              TfCard(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: <Widget>[
                    CircleAvatar(
                      radius: 26,
                      backgroundColor: tokens.accent,
                      child: Text(
                        (user != null && user.name.isNotEmpty)
                            ? user.name[0].toUpperCase()
                            : 'U',
                        style: AppTextStyles.labelMedium.copyWith(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text(
                            user?.name ?? 'Unknown',
                            style: AppTextStyles.labelMedium.copyWith(
                              fontSize: 17,
                              fontWeight: FontWeight.w700,
                              color: tokens.textPrimary,
                            ),
                          ),
                          Text(
                            user?.email ?? '',
                            style: AppTextStyles.bodySmall.copyWith(
                              fontSize: 13,
                              color: tokens.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // ──── 3. APPEARANCE SECTION LABEL ────
              _sectionLabel('Appearance', tokens),

              // ──── 4. APPEARANCE CARD ────
              TfCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      'Theme',
                      style: AppTextStyles.labelMedium.copyWith(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: tokens.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      height: 44,
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: tokens.bgRaised,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: tokens.borderSubtle),
                      ),
                      child: Row(
                        children: <Widget>[
                          _ThemeOption(
                            label: 'Light',
                            value: ThemeMode.light,
                            selected: settings.themeMode,
                          ),
                          _ThemeOption(
                            label: 'Dark',
                            value: ThemeMode.dark,
                            selected: settings.themeMode,
                          ),
                          _ThemeOption(
                            label: 'System',
                            value: ThemeMode.system,
                            selected: settings.themeMode,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // ──── 5. ACCOUNT SECTION LABEL ────
              _sectionLabel('Account', tokens),

              // ──── 6. ACCOUNT CARD ────
              TfCard(
                padding: EdgeInsets.zero,
                child: Column(
                  children: <Widget>[
                    _SettingsTile(
                      icon: Icons.person_outline_rounded,
                      title: 'Edit Profile',
                      subtitle: 'Update your name and details',
                      onTap: () {},
                    ),
                    Divider(
                      height: 1,
                      thickness: 0.5,
                      color: tokens.borderSubtle,
                      indent: 56,
                    ),
                    _SettingsTile(
                      icon: Icons.lock_outline_rounded,
                      title: 'Change Password',
                      subtitle: 'Update your account password',
                      onTap: () {},
                    ),
                    Divider(
                      height: 1,
                      thickness: 0.5,
                      color: tokens.borderSubtle,
                      indent: 56,
                    ),
                    _SettingsTile(
                      icon: Icons.notifications_none_rounded,
                      title: 'Notifications',
                      subtitle: 'Manage notification preferences',
                      onTap: () {},
                    ),
                  ],
                ),
              ),

              // ──── 7. DATA SECTION LABEL ────
              _sectionLabel('Data', tokens),

              // ──── 8. DATA CARD ────
              TfCard(
                padding: EdgeInsets.zero,
                child: _SettingsTile(
                  icon: Icons.cloud_download_outlined,
                  title: 'Export Data',
                  subtitle: 'Download your account data',
                  onTap: () {},
                ),
              ),

              // ──── 9. DANGER ZONE SECTION LABEL ────
              _sectionLabel('Danger Zone', tokens),

              // ──── 10. DANGER ZONE CARD ────
              TfCard(
                borderColor: AppSemanticColors.rose.withValues(alpha: 0.3),
                padding: EdgeInsets.zero,
                child: _SettingsTile(
                  icon: Icons.delete_outline_rounded,
                  title: 'Delete Account',
                  subtitle: '',
                  onTap: () async {
                    final confirmed = await showDialog<bool>(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        title: const Text('Delete Account'),
                        content: const Text(
                          'Are you sure? This action cannot be undone.',
                        ),
                        actions: <Widget>[
                          TextButton(
                            onPressed: () => Navigator.of(ctx).pop(false),
                            child: const Text('Cancel'),
                          ),
                          TextButton(
                            onPressed: () => Navigator.of(ctx).pop(true),
                            child: Text(
                              'Delete',
                              style: TextStyle(
                                color: AppSemanticColors.rose,
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                    if (confirmed == true) {
                      // TODO: Handle account deletion
                    }
                  },
                  isDestructive: true,
                ),
              ),

              const SizedBox(height: 12),

              TfCard(
                borderColor: AppSemanticColors.rose.withValues(alpha: 0.3),
                padding: EdgeInsets.zero,
                child: _SettingsTile(
                  icon: Icons.logout_rounded,
                  title: 'Log Out',
                  subtitle: 'Sign out of this device',
                  onTap: () async {
                    final dialogTokens = Theme.of(context).extension<AppColorTokens>()!;
                    final confirmed = await showDialog<bool>(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        backgroundColor: dialogTokens.bgSurface,
                        surfaceTintColor: Colors.transparent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(22),
                          side: BorderSide(color: dialogTokens.borderSubtle),
                        ),
                        titlePadding: const EdgeInsets.fromLTRB(24, 22, 24, 8),
                        contentPadding: const EdgeInsets.fromLTRB(24, 4, 24, 8),
                        actionsPadding: const EdgeInsets.fromLTRB(18, 0, 18, 16),
                        titleTextStyle: AppTextStyles.labelMedium.copyWith(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: dialogTokens.textPrimary,
                        ),
                        contentTextStyle: AppTextStyles.bodyMedium.copyWith(
                          fontSize: 14,
                          height: 1.45,
                          color: dialogTokens.textSecondary,
                        ),
                        title: const Text('Log Out'),
                        content: const Text(
                          'Are you sure you want to log out?',
                        ),
                        actionsAlignment: MainAxisAlignment.end,
                        actions: <Widget>[
                          TextButton(
                            onPressed: () => Navigator.of(ctx).pop(false),
                            style: TextButton.styleFrom(
                              foregroundColor: dialogTokens.textSecondary,
                              textStyle: const TextStyle(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            child: const Text('Cancel'),
                          ),
                          TextButton(
                            onPressed: () => Navigator.of(ctx).pop(true),
                            style: TextButton.styleFrom(
                              foregroundColor: AppSemanticColors.rose,
                              textStyle: const TextStyle(
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            child: const Text('Log Out'),
                          ),
                        ],
                      ),
                    );

                    if (confirmed == true) {
                      await ref.read(authProvider.notifier).logout();
                      if (context.mounted) {
                        context.go('/login');
                      }
                    }
                  },
                  isDestructive: true,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Private widget for rendering individual settings tiles
class _SettingsTile extends StatelessWidget {
  const _SettingsTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.isDestructive = false,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final bool isDestructive;

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final iconColor = isDestructive ? AppSemanticColors.rose : tokens.accent;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: <Widget>[
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: tokens.bgRaised,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: tokens.borderSubtle,
                  ),
                ),
                child: Icon(
                  icon,
                  size: 20,
                  color: iconColor,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      title,
                      style: AppTextStyles.bodyMedium.copyWith(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: isDestructive
                            ? AppSemanticColors.rose
                            : tokens.textPrimary,
                      ),
                    ),
                    if (subtitle.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: Text(
                          subtitle,
                          style: AppTextStyles.bodySmall.copyWith(
                            fontSize: 13,
                            color: tokens.textSecondary,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              if (!isDestructive)
                Icon(
                  Icons.chevron_right_rounded,
                  size: 18,
                  color: tokens.textMuted,
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Private widget for rendering individual theme option buttons
class _ThemeOption extends ConsumerWidget {
  const _ThemeOption({
    required this.label,
    required this.value,
    required this.selected,
  });

  final String label;
  final ThemeMode value;
  final ThemeMode selected;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final notifier = ref.read(settingsProvider.notifier);
    final isSelected = selected == value;

    return Expanded(
      child: GestureDetector(
        onTap: () => notifier.setThemeMode(value),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          margin: const EdgeInsets.symmetric(horizontal: 2),
          decoration: BoxDecoration(
            color: isSelected ? tokens.accent : Colors.transparent,
            borderRadius: BorderRadius.circular(9),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: tokens.accent.withValues(alpha: 0.3),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : [],
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                color: isSelected ? Colors.white : tokens.textSecondary,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
