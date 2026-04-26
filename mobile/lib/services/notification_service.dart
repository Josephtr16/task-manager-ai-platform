import 'package:dio/dio.dart';

import 'api_service.dart';

class NotificationService {
  NotificationService({Dio? dio}) : _dio = dio ?? ApiService.instance.dio;

  final Dio _dio;

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
}
