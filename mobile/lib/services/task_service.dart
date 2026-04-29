import 'package:dio/dio.dart';
import 'dart:io';

import 'api_service.dart';

class TaskService {
  TaskService({Dio? dio}) : _dio = dio ?? ApiService.instance.dio;

  final Dio _dio;

  Future<Map<String, dynamic>> getTasks([Map<String, dynamic>? params]) async {
    final res = await _dio.get('/tasks', queryParameters: params);
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> getTask(String id) async {
    final res = await _dio.get('/tasks/$id');
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> createTask(Map<String, dynamic> data) async {
    final res = await _dio.post('/tasks', data: data);
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> updateTask(String id, Map<String, dynamic> data) async {
    final res = await _dio.put('/tasks/$id', data: data);
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<void> deleteTask(String id) async {
    await _dio.delete('/tasks/$id');
  }

  Future<Map<String, dynamic>> getStatistics() async {
    final res = await _dio.get('/tasks/statistics');
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> getUpcoming() async {
    final res = await _dio.get('/tasks/upcoming');
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>?> getDailyPlan() async {
    final res = await _dio.get('/daily-plan');
    return res.data == null ? null : Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>?> saveDailyPlan(Map<String, dynamic> plan) async {
    final res = await _dio.post('/daily-plan', data: plan);
    return res.data == null ? null : Map<String, dynamic>.from(res.data as Map);
  }

  Future<void> deleteDailyPlan() async {
    await _dio.delete('/daily-plan');
  }

  Future<Map<String, dynamic>> addComment(String id, String text) async {
    final res = await _dio.post('/tasks/$id/comments', data: <String, dynamic>{'text': text});
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> addAttachment(String id, File file) async {
    final fileName = file.path.split(Platform.pathSeparator).last;
    final form = FormData.fromMap(<String, dynamic>{
      'file': await MultipartFile.fromFile(file.path, filename: fileName),
    });
    final res = await _dio.post(
      '/tasks/$id/attachments',
      data: form,
      options: Options(contentType: 'multipart/form-data'),
    );
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> shareTask(String id, String email) async {
    final res = await _dio.post('/tasks/$id/share', data: <String, dynamic>{'email': email});
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> startTimer(String id) async {
    final res = await _dio.post('/tasks/$id/time/start');
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> stopTimer(String id) async {
    final res = await _dio.post('/tasks/$id/time/stop');
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> getTimerStatus(String id) async {
    final res = await _dio.get('/tasks/$id/time');
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> toggleSubtask(String taskId, String subtaskId) async {
    final res = await _dio.put('/tasks/$taskId/subtasks/$subtaskId/toggle');
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> addSubtask(String taskId, Map<String, dynamic> data) async {
    final res = await _dio.post('/tasks/$taskId/subtasks', data: data);
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<void> deleteSubtask(String taskId, String subtaskId) async {
    await _dio.delete('/tasks/$taskId/subtasks/$subtaskId');
  }
}
