import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/utils/format_date.dart';
import '../../../core/widgets/tf_button.dart';
import '../../../core/theme/app_theme.dart';
import '../notifications/providers/notifications_provider.dart';

class NotificationSheet extends ConsumerWidget {
  const NotificationSheet({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(notificationsProvider);
    final tokens = Theme.of(context).extension<AppColorTokens>()!;

    return DraggableScrollableSheet(
      initialChildSize: 0.72,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, controller) {
        return Container(
          decoration: BoxDecoration(
            color: tokens.bgSurface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
          ),
          child: state.when(
            data: (data) => Column(
              children: <Widget>[
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: <Widget>[
                      const Expanded(child: Text('Notifications', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700))),
                      TfButton(
                        label: 'Mark all read',
                        variant: TfButtonVariant.secondary,
                        onPressed: () => ref.read(notificationsProvider.notifier).markAllRead(),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: ListView.builder(
                    controller: controller,
                    itemCount: data.items.length,
                    itemBuilder: (context, index) {
                      final item = data.items[index];
                      final createdAt = DateTime.tryParse('${item['createdAt'] ?? ''}') ?? DateTime.now();
                      final read = item['read'] == true;
                      return Container(
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          border: Border(left: BorderSide(color: read ? tokens.borderSubtle : tokens.accent, width: 2)),
                          color: tokens.bgRaised,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            Text('${item['message'] ?? ''}'),
                            const SizedBox(height: 4),
                            Text(formatTimeAgo(createdAt), style: TextStyle(color: tokens.textSecondary, fontSize: 12)),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (err, _) => Center(child: Text(err.toString())),
          ),
        );
      },
    );
  }
}
