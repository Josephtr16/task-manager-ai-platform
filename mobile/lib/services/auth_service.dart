import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../core/constants/api_constants.dart';
import 'api_service.dart';

class AuthService {
  AuthService({Dio? dio}) : _dio = dio ?? ApiService.instance.dio;

  final Dio _dio;
  static const FlutterSecureStorage _storage = FlutterSecureStorage();

  Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await _dio.post('/auth/login', data: <String, dynamic>{
      'email': email,
      'password': password,
    });

    final data = Map<String, dynamic>.from(res.data as Map);
    final token = data['token'] as String?;
    if (token != null && token.isNotEmpty) {
      await _storage.write(key: kTokenStorageKey, value: token);
    }
    return data;
  }

  Future<Map<String, dynamic>> register(String name, String email, String password) async {
    final res = await _dio.post('/auth/register', data: <String, dynamic>{
      'name': name,
      'email': email,
      'password': password,
    });
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> verifyEmail(String email, String token) async {
    final res = await _dio.post('/auth/verify-email', data: <String, dynamic>{'email': email, 'token': token});
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> resendVerification(String email) async {
    final res = await _dio.post('/auth/resend-verification', data: <String, dynamic>{'email': email});
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> forgotPassword(String email) async {
    final res = await _dio.post('/auth/forgot-password', data: <String, dynamic>{'email': email});
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> resetPassword(String email, String token, String newPassword) async {
    final res = await _dio.post('/auth/reset-password', data: <String, dynamic>{
      'email': email,
      'token': token,
      'newPassword': newPassword,
    });
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> getMe() async {
    final res = await _dio.get('/auth/me');
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> updatePreferences(Map<String, dynamic> preferences) async {
    final res = await _dio.patch('/auth/preferences', data: <String, dynamic>{'preferences': preferences});
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) async {
    final res = await _dio.patch('/auth/profile', data: data);
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<void> logout() => _storage.delete(key: kTokenStorageKey);

  Future<String?> getToken() => _storage.read(key: kTokenStorageKey);
}
