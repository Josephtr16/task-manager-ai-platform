import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../services/api_service.dart';

final insightsTrendDaysProvider = StateProvider<int>((ref) => 7);

dynamic _unwrapData(dynamic raw) {
  var current = raw;
  for (var i = 0; i < 4; i++) {
    if (current is Map && current.containsKey('data')) {
      current = current['data'];
      continue;
    }
    if (current is Map && current.containsKey('metrics')) {
      current = current['metrics'];
      continue;
    }
    break;
  }
  return current;
}

final insightsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  try {
    final dio = ApiService.instance.dio;
    final trendDays = ref.watch(insightsTrendDaysProvider);
    final responses = await Future.wait([
      dio.get('/analytics/productivity-trend', queryParameters: {'days': trendDays}),
      dio.get('/analytics/category-distribution'),
      dio.get('/analytics/time-of-day'),
      dio.get('/analytics/performance-metrics'),
      dio.get('/analytics/best-days'),
      dio.get('/analytics/ai-insights'),
    ]);

    final productivityTrend = _unwrapData(responses[0].data);
    final categoryDistribution = _unwrapData(responses[1].data);
    final timeOfDay = _unwrapData(responses[2].data);
    final performanceMetrics = _unwrapData(responses[3].data);
    final bestDays = _unwrapData(responses[4].data);
    final aiInsights = _unwrapData(responses[5].data);

    return <String, dynamic>{
      'productivityTrend': productivityTrend is List ? productivityTrend : const <dynamic>[],
      'categoryDistribution': categoryDistribution is List ? categoryDistribution : const <dynamic>[],
      'timeOfDay': timeOfDay is List ? timeOfDay : const <dynamic>[],
      'performanceMetrics': performanceMetrics is Map ? performanceMetrics : <String, dynamic>{},
      'bestDays': bestDays is List ? bestDays : const <dynamic>[],
      'aiInsights': aiInsights is List ? aiInsights : (aiInsights is Map && aiInsights['insights'] is List ? aiInsights['insights'] : const <dynamic>[]),
    };
  } catch (e) {
    return <String, dynamic>{
      'productivityTrend': const <dynamic>[],
      'categoryDistribution': const <dynamic>[],
      'timeOfDay': const <dynamic>[],
      'performanceMetrics': <String, dynamic>{},
      'bestDays': const <dynamic>[],
      'aiInsights': const <dynamic>[],
    };
  }
});
