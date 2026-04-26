import 'package:flutter/material.dart';

import '../../../../core/widgets/tf_button.dart';
import '../../../../core/widgets/tf_input.dart';

class AiBreakdownSheet extends StatelessWidget {
  const AiBreakdownSheet({super.key});

  @override
  Widget build(BuildContext context) {
    final desc = TextEditingController();

    return DraggableScrollableSheet(
      initialChildSize: 0.92,
      maxChildSize: 0.98,
      expand: false,
      builder: (_, controller) => ListView(
        controller: controller,
        padding: const EdgeInsets.all(16),
        children: <Widget>[
          Text('AI Project Breakdown', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          TfInput(label: 'Project description', controller: desc, maxLines: 5),
          const SizedBox(height: 10),
          const Text('Scope'),
          const SizedBox(height: 8),
          Wrap(spacing: 8, children: const <Widget>[Chip(label: Text('auto')), Chip(label: Text('basic')), Chip(label: Text('advanced'))]),
          const SizedBox(height: 12),
          TfButton(label: 'Generate', onPressed: () {}),
        ],
      ),
    );
  }
}
