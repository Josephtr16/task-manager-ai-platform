import 'package:flutter/material.dart';

import '../../../../core/widgets/tf_button.dart';
import '../../../../core/widgets/tf_input.dart';

class CreateProjectSheet extends StatelessWidget {
  const CreateProjectSheet({super.key});

  @override
  Widget build(BuildContext context) {
    final title = TextEditingController();
    final description = TextEditingController();

    return DraggableScrollableSheet(
      initialChildSize: 0.92,
      expand: false,
      builder: (_, controller) => Padding(
        padding: const EdgeInsets.all(16),
        child: ListView(
          controller: controller,
          children: <Widget>[
            TfInput(label: 'Project title', controller: title),
            const SizedBox(height: 8),
            TextButton(onPressed: () {}, child: const Text('✨ AI Enhance')),
            TfInput(label: 'Description', controller: description, maxLines: 5),
            const SizedBox(height: 14),
            TfButton(label: 'Create Project', onPressed: () => Navigator.of(context).pop()),
          ],
        ),
      ),
    );
  }
}
