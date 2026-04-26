import 'package:flutter/material.dart';

class FilterBottomSheet extends StatelessWidget {
  const FilterBottomSheet({
    super.key,
    required this.title,
    required this.options,
    required this.current,
    required this.onSelect,
  });

  final String title;
  final List<String> options;
  final String current;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.5,
      maxChildSize: 0.8,
      expand: false,
      builder: (_, controller) => ListView(
        controller: controller,
        children: <Widget>[
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(title, style: Theme.of(context).textTheme.titleLarge),
          ),
          ...options.map(
            (value) => ListTile(
              title: Text(value),
              trailing: current == value ? const Icon(Icons.check_circle) : const Icon(Icons.circle_outlined),
              onTap: () {
                onSelect(value);
                Navigator.of(context).pop();
              },
            ),
          ),
        ],
      ),
    );
  }
}
