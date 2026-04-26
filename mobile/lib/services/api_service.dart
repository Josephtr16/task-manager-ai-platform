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
    if (kIsWeb) {
      return kApiBaseUrlIOS;
    }

    return defaultTargetPlatform == TargetPlatform.android
        ? kApiBaseUrlAndroid
        : kApiBaseUrlIOS;
  }

  late final Dio dio = Dio(
    BaseOptions(
      baseUrl: _resolveBaseUrl(),
      connectTimeout: const Duration(seconds: 20),
      receiveTimeout: const Duration(seconds: 25),
      sendTimeout: const Duration(seconds: 25),
      headers: <String, String>{'Content-Type': 'application/json'},
    ),
  )..interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
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
}
