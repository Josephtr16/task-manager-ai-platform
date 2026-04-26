import 'package:dio/dio.dart';

import 'api_service.dart';

class ProjectService {
  ProjectService({Dio? dio}) : _dio = dio ?? ApiService.instance.dio;

  final Dio _dio;

  Future<Map<String, dynamic>> getProjects() async {
    final res = await _dio.get('/projects');
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> getProject(String id) async {
    final res = await _dio.get('/projects/$id');
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> createProject(Map<String, dynamic> data) async {
    final res = await _dio.post('/projects', data: data);
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> updateProject(String id, Map<String, dynamic> data) async {
    final res = await _dio.put('/projects/$id', data: data);
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<void> deleteProject(String id, bool deleteTasks) async {
    await _dio.delete('/projects/$id', queryParameters: <String, dynamic>{'deleteTasks': deleteTasks});
  }

  Future<Map<String, dynamic>> shareProject(String id, String email) async {
    final res = await _dio.post('/projects/$id/share', data: <String, dynamic>{'email': email});
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> getPendingInvites() async {
    final res = await _dio.get('/projects/invites');
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> respondToInvite(String id, String action) async {
    final res = await _dio.post('/projects/$id/respond-share', data: <String, dynamic>{'action': action});
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<void> removeCollaborator(String id, String userId) async {
    await _dio.delete('/projects/$id/share/$userId');
  }

  Future<Map<String, dynamic>> updatePermission(String id, String userId, String permission) async {
    final res = await _dio.patch('/projects/$id/share/$userId/permission', data: <String, dynamic>{'permission': permission});
    return Map<String, dynamic>.from(res.data as Map);
  }
}
