import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../core/widgets/tf_button.dart';
import '../../../../core/widgets/tf_input.dart';
import '../../../../services/ai_service.dart';
import '../providers/tasks_provider.dart';

class CreateTaskSheet extends ConsumerStatefulWidget {
  const CreateTaskSheet({super.key});

  @override
  ConsumerState<CreateTaskSheet> createState() => _CreateTaskSheetState();
}

class _CreateTaskSheetState extends ConsumerState<CreateTaskSheet> {
  final _formKey = GlobalKey<FormState>();
  final title = TextEditingController();
  final desc = TextEditingController();
  final duration = TextEditingController(text: '60');
  final tags = TextEditingController();

  String _category = 'Work';
  String _priority = 'medium';
  DateTime? _deadline;
  bool _saving = false;
  bool _aiLoading = false;

  static const _categories = <String>[
    'Work',
    'Personal',
    'Health',
    'Shopping',
    'Learning',
    'Family',
  ];

  static const _priorities = <String>['low', 'medium', 'high', 'urgent'];

  Future<void> _pickDeadline() async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: _deadline ?? now,
      firstDate: DateTime(now.year - 1),
      lastDate: DateTime(now.year + 5),
    );
    if (date == null) return;
    if (!mounted) return;
    setState(() => _deadline = date);
  }

  Future<void> _assistWrite() async {
    setState(() => _aiLoading = true);
    try {
      final ai = AiService();
      final response = await ai.assistWrite(
        title: title.text.trim().isEmpty ? null : title.text.trim(),
        category: _category,
        description: desc.text.trim().isEmpty ? null : desc.text.trim(),
      );

      final suggestedTitle =
          '${response['title'] ?? response['suggestedTitle'] ?? title.text}'.trim();
      final suggestedDescription =
          '${response['description'] ?? response['suggestedDescription'] ?? desc.text}'
              .trim();
      final suggestedCategory =
          '${response['category'] ?? response['suggestedCategory'] ?? _category}'
              .trim();
      final suggestedPriority =
          '${response['priority'] ?? response['suggestedPriority'] ?? _priority}'
              .toLowerCase()
              .trim();
      final suggestedMinutes = int.tryParse(
            '${response['estimatedDuration'] ?? response['estimatedMinutes'] ?? duration.text}',
          ) ??
          60;

      if (!mounted) return;
      setState(() {
        title.text = suggestedTitle;
        desc.text = suggestedDescription;
        if (_categories.contains(suggestedCategory)) {
          _category = suggestedCategory;
        }
        if (_priorities.contains(suggestedPriority)) {
          _priority = suggestedPriority;
        }
        duration.text = suggestedMinutes.toString();
      });
    } finally {
      if (mounted) {
        setState(() => _aiLoading = false);
      }
    }
  }

  Future<void> _create() async {
    if (title.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Title is required')),
      );
      return;
    }

    setState(() => _saving = true);
    try {
      final tagValues = tags.text
          .split(',')
          .map((e) => e.trim())
          .where((e) => e.isNotEmpty)
          .toList();

      await ref.read(tasksProvider.notifier).createTask(<String, dynamic>{
        'title': title.text.trim(),
        'description': desc.text.trim(),
        'category': _category,
        'priority': _priority,
        'status': 'todo',
        'deadline': _deadline?.toIso8601String(),
        'estimatedDuration': int.tryParse(duration.text.trim()) ?? 60,
        'tags': tagValues,
      });

      if (!mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Task created successfully')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to create task: $e')),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  void dispose() {
    title.dispose();
    desc.dispose();
    duration.dispose();
    tags.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final deadlineText =
        _deadline == null ? 'No deadline' : DateFormat('MMM d, yyyy').format(_deadline!);

    return DraggableScrollableSheet(
      initialChildSize: 0.92,
      maxChildSize: 0.98,
      expand: false,
      builder: (_, controller) => Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Form(
          key: _formKey,
          child: ListView(
            controller: controller,
            children: <Widget>[
              Center(
                child: Container(
                  width: 48,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade400,
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: <Widget>[
                  Text('New Task', style: Theme.of(context).textTheme.titleLarge),
                  const Spacer(),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              TfInput(label: 'Title', controller: title, hint: 'Task title'),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerLeft,
                child: TfButton(
                  label: _aiLoading ? 'Writing...' : 'AI Writing Assistant',
                  icon: Icons.auto_awesome,
                  variant: TfButtonVariant.ghost,
                  isLoading: _aiLoading,
                  onPressed: _aiLoading ? null : _assistWrite,
                ),
              ),
              const SizedBox(height: 8),
              TfInput(
                label: 'Description',
                controller: desc,
                hint: 'Describe the task',
                maxLines: 4,
              ),
              const SizedBox(height: 12),
              Row(
                children: <Widget>[
                  Expanded(
                    child: InkWell(
                      borderRadius: BorderRadius.circular(8),
                      onTap: _pickDeadline,
                      child: InputDecorator(
                        decoration: const InputDecoration(labelText: 'Deadline'),
                        child: Text(deadlineText),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TfInput(
                      label: 'Duration (min)',
                      controller: duration,
                      keyboardType: TextInputType.number,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: _category,
                decoration: const InputDecoration(labelText: 'Category'),
                items: _categories
                    .map((c) => DropdownMenuItem<String>(value: c, child: Text(c)))
                    .toList(),
                onChanged: (v) {
                  if (v == null) return;
                  setState(() => _category = v);
                },
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: _priority,
                decoration: const InputDecoration(labelText: 'Priority'),
                items: _priorities
                    .map((p) => DropdownMenuItem<String>(value: p, child: Text(p)))
                    .toList(),
                onChanged: (v) {
                  if (v == null) return;
                  setState(() => _priority = v);
                },
              ),
              const SizedBox(height: 12),
              TfInput(
                label: 'Tags',
                controller: tags,
                hint: 'Comma separated, e.g. fitness, health',
              ),
              const SizedBox(height: 16),
              Row(
                children: <Widget>[
                  Expanded(
                    child: TfButton(
                      label: 'Cancel',
                      onPressed: () => Navigator.of(context).pop(),
                      variant: TfButtonVariant.secondary,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TfButton(
                      label: 'Create Task',
                      isLoading: _saving,
                      onPressed: _saving ? null : _create,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
