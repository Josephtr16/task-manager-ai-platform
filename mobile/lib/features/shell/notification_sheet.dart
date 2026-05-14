import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/utils/format_date.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/theme/app_theme.dart';
import '../notifications/providers/notifications_provider.dart';

class NotificationSheet extends ConsumerWidget {
  final ThemeData themeData;

  const NotificationSheet({
    super.key,
    required this.themeData,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(notificationsProvider);
    final tokens = themeData.extension<AppColorTokens>()!;

    return DraggableScrollableSheet(
      initialChildSize: 0.72,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, controller) {
        return Container(
          decoration: BoxDecoration(
            color: tokens.bgSurface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          ),
          child: state.when(
            data: (data) {
              final items = data.items;
              final unreadCount = items.where((n) => n['read'] != true).length;

              return Column(
                children: <Widget>[
                  // Drag handle
                  Padding(
                    padding: const EdgeInsets.only(top: 12, bottom: 4),
                    child: Center(
                      child: Container(
                        width: 36,
                        height: 4,
                        decoration: BoxDecoration(
                          color: tokens.borderMedium,
                          borderRadius: BorderRadius.circular(99),
                        ),
                      ),
                    ),
                  ),

                  // Header section
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 20, 16, 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Text(
                          'Notifications',
                          style: GoogleFonts.fraunces(
                            fontSize: 28,
                            fontWeight: FontWeight.w700,
                            color: tokens.textPrimary,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: <Widget>[
                            if (unreadCount > 0)
                              Text(
                                '$unreadCount unread',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: tokens.textSecondary,
                                ),
                              )
                            else
                              const SizedBox.shrink(),
                            Row(
                              children: <Widget>[
                                _headerBtn(
                                  'Mark all read',
                                  () => ref
                                      .read(notificationsProvider.notifier)
                                      .markAllRead(),
                                  tokens,
                                  backgroundColor: tokens.accent.withOpacity(0.08),
                                  borderColor: tokens.accent.withOpacity(0.22),
                                  textColor: tokens.accent,
                                ),
                                const SizedBox(width: 8),
                                _headerBtn(
                                  'Clear all',
                                  () => ref
                                      .read(notificationsProvider.notifier)
                                      .clearAll(),
                                  tokens,
                                  backgroundColor: Colors.red.withOpacity(0.06),
                                  borderColor: Colors.red.withOpacity(0.28),
                                  textColor: Colors.red,
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Divider
                  Divider(
                    height: 1,
                    thickness: 1,
                    color: tokens.borderSubtle,
                  ),

                  // Notification list or empty state
                  Expanded(
                    child: items.isEmpty
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.all(40),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: <Widget>[
                                  Icon(
                                    Icons.notifications_none_rounded,
                                    size: 52,
                                    color: tokens.borderMedium,
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    'All caught up',
                                    style: AppTextStyles.titleLarge.copyWith(
                                      color: tokens.textSecondary,
                                      fontSize: 16,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'No new notifications',
                                    style: AppTextStyles.bodySmall.copyWith(
                                      color: tokens.textMuted,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : ListView.builder(
                            controller: controller,
                            padding: const EdgeInsets.only(
                              top: 8,
                              bottom: 16,
                              left: 16,
                              right: 16,
                            ),
                            itemCount: items.length,
                            itemBuilder: (context, index) {
                              final item = items[index];
                              final id =
                                  '${item['id'] ?? item['_id'] ?? index}';
                              final message = '${item['message'] ?? ''}';
                              final createdAt = DateTime.tryParse(
                                      '${item['createdAt'] ?? ''}') ??
                                  DateTime.now();
                              final read = item['read'] == true;

                              return Container(
                                margin: const EdgeInsets.symmetric(vertical: 5),
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: read
                                      ? tokens.bgRaised
                                      : tokens.accent.withValues(alpha: 0.07),
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(
                                    color: tokens.borderSubtle,
                                    width: 1,
                                  ),
                                ),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: <Widget>[
                                    SizedBox(
                                      width: 20,
                                      child: !read
                                          ? Padding(
                                              padding:
                                                  const EdgeInsets.only(top: 5),
                                              child: Align(
                                                alignment: Alignment.topCenter,
                                                child: Container(
                                                  width: 6,
                                                  height: 6,
                                                  decoration: BoxDecoration(
                                                    color: tokens.accent,
                                                    shape: BoxShape.circle,
                                                  ),
                                                ),
                                              ),
                                            )
                                          : const SizedBox.shrink(),
                                    ),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: <Widget>[
                                          RichText(
                                            text: _buildNotificationText(
                                              message,
                                              AppTextStyles.bodyMedium.copyWith(
                                                color: tokens.textPrimary,
                                                height: 1.4,
                                              ),
                                              tokens,
                                            ),
                                          ),
                                          const SizedBox(height: 5),
                                          Text(
                                            formatTimeAgo(createdAt),
                                            style: AppTextStyles.bodySmall
                                                .copyWith(
                                              color: tokens.textMuted,
                                              fontSize: 11,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    IconButton(
                                      onPressed: () {
                                        unawaited(
                                          ref
                                              .read(
                                                notificationsProvider.notifier,
                                              )
                                              .deleteNotification(id),
                                        );
                                      },
                                      icon: Icon(
                                        Icons.delete_outline_rounded,
                                        size: 18,
                                        color: tokens.textMuted,
                                      ),
                                      visualDensity: VisualDensity.compact,
                                      padding: EdgeInsets.zero,
                                      constraints: const BoxConstraints(
                                        minWidth: 32,
                                        minHeight: 32,
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                  ),
                ],
              );
            },
            loading: () => Center(
              child: CircularProgressIndicator(
                color: tokens.accent,
                strokeWidth: 2,
              ),
            ),
            error: (err, _) => Center(child: Text(err.toString())),
          ),
        );
      },
    );
  }

  Widget _headerBtn(
    String label,
    VoidCallback onTap,
    AppColorTokens tokens, {
    required Color backgroundColor,
    required Color borderColor,
    required Color textColor,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 10,
        ),
        decoration: BoxDecoration(
          color: backgroundColor,
          border: Border.all(color: borderColor),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: textColor,
          ),
        ),
      ),
    );
  }

  static TextSpan _buildNotificationText(
    String message,
    TextStyle baseStyle,
    AppColorTokens tokens,
  ) {
    final parts = <InlineSpan>[];
    final regex = RegExp(r'"([^"]*)"');
    int lastEnd = 0;

    for (final match in regex.allMatches(message)) {
      // Add text before the quoted part
      if (match.start > lastEnd) {
        parts.add(TextSpan(
          text: message.substring(lastEnd, match.start),
          style: baseStyle.copyWith(fontWeight: FontWeight.w600),
        ));
      }

      // Add the quoted part in bold
      parts.add(TextSpan(
        text: match.group(0),
        style: baseStyle.copyWith(fontWeight: FontWeight.w700),
      ));

      lastEnd = match.end;
    }

    // Add remaining text
    if (lastEnd < message.length) {
      parts.add(TextSpan(
        text: message.substring(lastEnd),
        style: baseStyle.copyWith(fontWeight: FontWeight.w600),
      ));
    }

    return TextSpan(children: parts);
  }
}
