import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../constants/api_constants.dart';
import 'api_exception.dart';

typedef UnauthorizedCallback = Future<void> Function();

class DioClient {
  DioClient._();

  static final DioClient instance = DioClient._();
  static const FlutterSecureStorage _storage = FlutterSecureStorage();

  static UnauthorizedCallback? onUnauthorized;

  String _resolveBaseUrl() {
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
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 30),
      headers: const <String, String>{'Content-Type': 'application/json'},
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
          final payload = response.data;
          if (payload is Map<String, dynamic> &&
              payload['success'] == true &&
              payload['data'] != null) {
            response.data = payload['data'];
          }
          handler.next(response);
        },
        onError: (error, handler) async {
          final statusCode = error.response?.statusCode;
          final payload = error.response?.data;

          var message = error.message ?? 'Request failed';
          if (payload is Map<String, dynamic>) {
            final serverMessage = payload['message'];
            if (serverMessage is String && serverMessage.isNotEmpty) {
              message = serverMessage;
            }
          }

          if (statusCode == 401) {
            await _storage.delete(key: kTokenStorageKey);
            if (onUnauthorized != null) {
              await onUnauthorized!();
            }
          }

          handler.next(
            DioException(
              requestOptions: error.requestOptions,
              response: error.response,
              type: error.type,
              error: ApiException(message, statusCode: statusCode),
            ),
          );
        },
      ),
    );
}
