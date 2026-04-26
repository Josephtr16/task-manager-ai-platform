import 'package:dio/dio.dart';

import 'api_service.dart';

class AiService {
  AiService({Dio? dio}) : _dio = dio ?? ApiService.instance.dio;

  final Dio _dio;

  Future<Map<String, dynamic>> prioritize(List<Map<String, dynamic>> tasks) async {
    final res = await _dio.post('/ai/prioritize', data: <String, dynamic>{'tasks': tasks});
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> assistWrite({String? title, String? category, String? description}) async {
    final res = await _dio.post('/ai/assist-write', data: <String, dynamic>{
      'title': title,
      'category': category,
      'description': description,
    });
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> predictTime(Map<String, dynamic> task) async {
    final res = await _dio.post('/ai/predict-time', data: <String, dynamic>{'task': task});
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> planDay(
    List<Map<String, dynamic>> tasks,
    String workStart,
    String workEnd,
  ) async {
    final res = await _dio.post('/ai/plan-day', data: <String, dynamic>{
      'tasks': tasks,
      'work_start': workStart,
      'work_end': workEnd,
    });
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> detectRisks(List<Map<String, dynamic>> tasks) async {
    final res = await _dio.post('/ai/detect-risks', data: <String, dynamic>{'tasks': tasks});
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> generateReport(Map<String, dynamic> stats) async {
    final res = await _dio.post('/ai/reports', data: stats);
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> projectBreakdown(
    String name,
    String description,
    String projectType,
    String team,
    String scope,
    int taskCount,
    String? deadline,
  ) async {
    final payload = <String, dynamic>{
      'name': name,
      'description': description,
      'project_type': projectType,
      'team': team,
      'scope': scope,
      'task_count': taskCount,
    };
    if (deadline != null && deadline.isNotEmpty) payload['project_deadline'] = deadline;
    final res = await _dio.post('/ai/project-breakdown', data: payload);
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> generateSubtasks(
    String projectContext,
    String taskTitle,
    String taskDescription,
    String category,
    String phase,
    int estimatedMinutes,
  ) async {
    final res = await _dio.post('/ai/generate-subtasks', data: <String, dynamic>{
      'project_context': projectContext,
      'task_title': taskTitle,
      'task_description': taskDescription,
      'category': category,
      'phase': phase,
      'estimated_minutes': estimatedMinutes,
    });
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> enhanceProject(String name, String description) async {
    final res = await _dio.post('/ai/enhance-project', data: <String, dynamic>{
      'name': name,
      'description': description,
    });
    return Map<String, dynamic>.from(res.data as Map);
  }
}
