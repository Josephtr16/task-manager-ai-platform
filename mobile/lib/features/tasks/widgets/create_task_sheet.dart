import 'package:flutter/material.dart';

import '../../../../core/widgets/tf_button.dart';
import '../../../../core/widgets/tf_input.dart';

class CreateTaskSheet extends StatefulWidget {
  const CreateTaskSheet({super.key});

  @override
  State<CreateTaskSheet> createState() => _CreateTaskSheetState();
}

class _CreateTaskSheetState extends State<CreateTaskSheet> {
  final title = TextEditingController();
  final desc = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.92,
      maxChildSize: 0.98,
      expand: false,
      builder: (_, controller) => Container(
        padding: const EdgeInsets.all(16),
        child: ListView(
          controller: controller,
          children: <Widget>[
            TfInput(label: 'Title', controller: title),
            const SizedBox(height: 10),
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton(onPressed: () {}, child: const Text('✨ AI Writing Assistant')),
            ),
            TfInput(label: 'Description', controller: desc, maxLines: 5),
            const SizedBox(height: 16),
            Row(
              children: <Widget>[
                Expanded(child: TfButton(label: 'Cancel', onPressed: () => Navigator.of(context).pop(), variant: TfButtonVariant.secondary)),
                const SizedBox(width: 10),
                Expanded(child: TfButton(label: 'Create Task', onPressed: () => Navigator.of(context).pop())),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
