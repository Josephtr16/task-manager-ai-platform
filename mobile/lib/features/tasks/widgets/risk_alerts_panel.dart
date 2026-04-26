import 'package:flutter/material.dart';

import '../../../../core/widgets/tf_card.dart';

class RiskAlertsPanel extends StatelessWidget {
  const RiskAlertsPanel({super.key, required this.risk});

  final Map<String, dynamic> risk;

  @override
  Widget build(BuildContext context) {
    final alerts = (risk['alerts'] as List? ?? const <dynamic>[]);
    return TfCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text('Risk Alerts', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Text('${risk['summary'] ?? ''}'),
          const SizedBox(height: 8),
          ...alerts.map((e) => Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Text('• ${(e as Map)['message'] ?? e.toString()}'),
              )),
        ],
      ),
    );
  }
}
