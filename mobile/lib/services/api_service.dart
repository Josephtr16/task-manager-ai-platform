import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../core/constants/api_constants.dart';

class ApiException implements Exception {
  ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => 'ApiException($statusCode): $message';
}

typedef UnauthorizedHandler = Future<void> Function();

class ApiService {
  ApiService._();

  static final ApiService instance = ApiService._();
  static const FlutterSecureStorage _storage = FlutterSecureStorage();

  static UnauthorizedHandler? onUnauthorized;

  static String _resolveBaseUrl() {
    if (kApiBaseUrlOverride.isNotEmpty) {
      print('🌐 [ApiService] Using override base URL: $kApiBaseUrlOverride');
      return kApiBaseUrlOverride;
    }

    if (kIsWeb) {
      print('🌐 [ApiService] Using iOS base URL (web): $kApiBaseUrlIOS');
      return kApiBaseUrlIOS;
    }

    final url = defaultTargetPlatform == TargetPlatform.android
        ? kApiBaseUrlAndroid
        : kApiBaseUrlIOS;
    print('🌐 [ApiService] Using ${defaultTargetPlatform == TargetPlatform.android ? 'Android' : 'iOS'} base URL: $url');
    return url;
  }

  Dio get dio => _createDio();

  Dio _createDio() {
    final dio = Dio(
      BaseOptions(
        baseUrl: _resolveBaseUrl(),
        connectTimeout: const Duration(seconds: 5),
        receiveTimeout: const Duration(seconds: 10),
        sendTimeout: const Duration(seconds: 10),
        headers: <String, String>{'Content-Type': 'application/json'},
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          print('🔵 [Dio] Requesting: ${options.method} ${options.baseUrl}${options.path}');
          final token = await _storage.read(key: kTokenStorageKey);
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onResponse: (response, handler) {
          final data = response.data;
          if (data is Map<String, dynamic> && data.containsKey('data')) {
            response.data = data['data'];
          }
          handler.next(response);
        },
        onError: (error, handler) async {
          print('❌ [Dio] Error: ${error.type} - ${error.message}');
          if (error.response != null) {
            print('   Status: ${error.response?.statusCode}');
          }
          final status = error.response?.statusCode;
          final payload = error.response?.data;

          String message = error.message ?? 'Request failed';
          if (payload is Map<String, dynamic>) {
            final serverMessage = payload['message'];
            if (serverMessage is String && serverMessage.isNotEmpty) {
              message = serverMessage;
            }
          }

          if (status == 401) {
            await _storage.delete(key: kTokenStorageKey);
            if (onUnauthorized != null) {
              await onUnauthorized!();
            }
          }

          handler.reject(
            DioException(
              requestOptions: error.requestOptions,
              response: error.response,
              type: error.type,
              error: ApiException(message, statusCode: status),
            ),
          );
        },
      ),
    );

    return dio;
  }
}
