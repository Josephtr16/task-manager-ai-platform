import 'package:dio/dio.dart';

import 'api_service.dart';

class NotificationService {
  NotificationService({Dio? dio}) : _dioOverride = dio;

  final Dio? _dioOverride;

  Dio get _dio => _dioOverride ?? ApiService.instance.dio;

  Future<Map<String, dynamic>> getNotifications() async {
    final res = await _dio.get('/notifications');
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> markRead(String id) async {
    final res = await _dio.patch('/notifications/$id/read');
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> markAllRead() async {
    final res = await _dio.patch('/notifications/read-all');
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<void> deleteNotification(String id) async {
    await _dio.delete('/notifications/$id');
  }

  Future<void> clearAll() async {
    await _dio.delete('/notifications/clear-all');
  }

  Future<void> deleteOne(String id) async {
    await _dio.delete('/notifications/$id');
  }
}
