import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/gradient_background.dart';
import '../providers/insights_provider.dart';

class InsightsScreen extends ConsumerWidget {
  const InsightsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(insightsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('AI Insights')),
      body: GradientBackground(
        child: async.when(
          data: (_) => ListView(
            padding: const EdgeInsets.all(16),
            children: <Widget>[
              Card(
                child: SizedBox(
                  height: 220,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: LineChart(LineChartData(lineBarsData: <LineChartBarData>[
                      LineChartBarData(spots: const <FlSpot>[FlSpot(0, 2), FlSpot(1, 3), FlSpot(2, 4)]),
                    ])),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Card(
                child: SizedBox(
                  height: 220,
                  child: PieChart(PieChartData(sections: <PieChartSectionData>[
                    PieChartSectionData(value: 40),
                    PieChartSectionData(value: 30),
                    PieChartSectionData(value: 30),
                  ])),
                ),
              ),
            ],
          ),
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, _) => Center(child: Text(err.toString())),
        ),
      ),
    );
  }
}
