import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../services/api_service.dart';

final insightsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final dio = ApiService.instance.dio;
  final responses = await Future.wait([
    dio.get('/analytics/productivity-trend', queryParameters: {'days': 7}),
    dio.get('/analytics/category-distribution'),
    dio.get('/analytics/time-of-day'),
    dio.get('/analytics/performance-metrics'),
    dio.get('/analytics/best-days'),
    dio.get('/analytics/ai-insights'),
  ]);

  return <String, dynamic>{
    'productivityTrend': responses[0].data,
    'categoryDistribution': responses[1].data,
    'timeOfDay': responses[2].data,
    'performanceMetrics': responses[3].data,
    'bestDays': responses[4].data,
    'aiInsights': responses[5].data,
  };
});
