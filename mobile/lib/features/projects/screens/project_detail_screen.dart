import 'package:flutter/material.dart';

import '../../../core/widgets/gradient_background.dart';
import '../widgets/ai_breakdown_sheet.dart';
import '../widgets/collaborators_section.dart';

class ProjectDetailScreen extends StatelessWidget {
  const ProjectDetailScreen({super.key, required this.projectId});

  final String projectId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Project Detail')),
      body: GradientBackground(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: <Widget>[
            Text('Project ID: $projectId', style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text('Project Overview', style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 8),
                    const Text('Detailed project view with tasks, metadata, and AI workflows.'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            const CollaboratorsSection(collaborators: <Map<String, dynamic>>[]),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: () => showModalBottomSheet<void>(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (_) => const AiBreakdownSheet(),
              ),
              icon: const Icon(Icons.smart_toy_outlined),
              label: const Text('Generate Tasks with AI'),
            ),
          ],
        ),
      ),
    );
  }
}
