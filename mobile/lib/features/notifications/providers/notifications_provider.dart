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
}
