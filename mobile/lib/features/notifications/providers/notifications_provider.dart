import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../services/notification_service.dart';

class NotificationsState {
  const NotificationsState({
    this.items = const <Map<String, dynamic>>[],
    this.unreadCount = 0,
  });

  final List<Map<String, dynamic>> items;
  final int unreadCount;
}

final notificationsProvider = AsyncNotifierProvider<NotificationsNotifier, NotificationsState>(
  NotificationsNotifier.new,
);

class NotificationsNotifier extends AsyncNotifier<NotificationsState> {
  final NotificationService _service = NotificationService();
  Timer? _timer;

  @override
  Future<NotificationsState> build() async {
    ref.onDispose(() => _timer?.cancel());
    _timer = Timer.periodic(const Duration(seconds: 60), (_) {
      refresh();
    });
    return _load();
  }

  Future<NotificationsState> _load() async {
    final res = await _service.getNotifications();
    final list = (res['notifications'] as List? ?? const <dynamic>[])
        .map((e) => Map<String, dynamic>.from(e as Map))
        .toList();
    final unread = int.tryParse('${res['unreadCount'] ?? 0}') ?? 0;
    return NotificationsState(items: list, unreadCount: unread);
  }

  Future<void> refresh() async {
    state = AsyncData(await _load());
  }

  Future<void> markAllRead() async {
    await _service.markAllRead();
    await refresh();
  }

  Future<void> deleteNotification(String id) async {
    await deleteOne(id);
  }

  Future<void> deleteOne(String id) async {
    await _service.deleteOne(id);
    final current = state.valueOrNull ?? const NotificationsState();
    final removed = current.items.where((item) {
      final itemId = '${item['id'] ?? item['_id'] ?? ''}';
      return itemId != id;
    }).toList();
    final deletedItem = current.items.cast<Map<String, dynamic>?>().firstWhere(
          (item) => '${item?['id'] ?? item?['_id'] ?? ''}' == id,
          orElse: () => null,
        );
    final nextUnreadCount = deletedItem == null || deletedItem['read'] == true
        ? current.unreadCount
        : (current.unreadCount - 1).clamp(0, current.unreadCount);

    state = AsyncData(
      NotificationsState(
        items: removed,
        unreadCount: nextUnreadCount,
      ),
    );
  }

  Future<void> clearAll() async {
    await _service.clearAll();
    state = const AsyncData(
      NotificationsState(items: <Map<String, dynamic>>[], unreadCount: 0),
    );
  }
}
