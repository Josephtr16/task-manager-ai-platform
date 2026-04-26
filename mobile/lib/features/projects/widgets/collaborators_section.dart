import 'package:flutter/material.dart';

import '../../../../core/widgets/tf_card.dart';

class CollaboratorsSection extends StatelessWidget {
  const CollaboratorsSection({super.key, required this.collaborators});

  final List<Map<String, dynamic>> collaborators;

  @override
  Widget build(BuildContext context) {
    return TfCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text('Collaborators', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          ...collaborators.map((c) => ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const CircleAvatar(child: Icon(Icons.person_outline)),
                title: Text('${c['name'] ?? c['email'] ?? 'User'}'),
                subtitle: Text('${c['permission'] ?? 'view'}'),
              )),
        ],
      ),
    );
  }
}
