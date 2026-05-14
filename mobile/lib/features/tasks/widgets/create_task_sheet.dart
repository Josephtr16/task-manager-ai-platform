import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../services/ai_service.dart';
import '../providers/tasks_provider.dart';
import 'task_detail_sheet.dart';

class CreateTaskSheet extends ConsumerStatefulWidget {
  const CreateTaskSheet({super.key, this.projectId});

  final String? projectId;

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
    final picked = await showModernDatePicker(
      context: context,
      initialDate: _deadline,
    );
    if (!mounted) return;
    setState(() => _deadline = picked);
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
          '${response['title'] ?? response['suggestedTitle'] ?? title.text}'
              .trim();
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
        if (widget.projectId != null && widget.projectId!.isNotEmpty)
          'projectId': widget.projectId,
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

  AppColorTokens _tokens(BuildContext context) {
    return Theme.of(context).extension<AppColorTokens>() ??
        AppTheme.lightTokens;
  }

  InputDecoration _inputDecoration(
    BuildContext context,
    String label, {
    String? hintText,
  }) {
    final tokens = _tokens(context);

    return InputDecoration(
      labelText: label,
      floatingLabelBehavior: FloatingLabelBehavior.always,
      hintText: hintText,
      filled: true,
      fillColor: tokens.bgRaised.withValues(alpha: 0.72),
      contentPadding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(22),
        borderSide: BorderSide(color: tokens.borderSubtle),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(22),
        borderSide: BorderSide(color: tokens.borderSubtle),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(22),
        borderSide: BorderSide(color: tokens.accent, width: 1.4),
      ),
      labelStyle: TextStyle(
        color: tokens.textSecondary,
        fontSize: 14,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.35,
      ),
      hintStyle: TextStyle(color: tokens.textMuted, fontSize: 12),
      floatingLabelStyle: TextStyle(
        color: tokens.accent,
        fontSize: 14,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.35,
      ),
    );
  }

  Future<String?> _showSelectionSheet(
    BuildContext context, {
    required String title,
    required List<String> options,
    required String selected,
  }) {
    final tokens = _tokens(context);

    String formatLabel(String value) {
      final normalized = value.replaceAll('-', ' ').trim();
      return normalized
          .split(RegExp(r'\s+'))
          .where((part) => part.isNotEmpty)
          .map((part) => part[0].toUpperCase() + part.substring(1))
          .join(' ');
    }

    IconData optionIcon(String option) {
      final key = option.toLowerCase();
      if (title.toLowerCase().contains('category')) {
        switch (key) {
          case 'work':
            return Icons.work_outline_rounded;
          case 'personal':
            return Icons.person_outline_rounded;
          case 'health':
            return Icons.favorite_outline_rounded;
          case 'shopping':
            return Icons.shopping_bag_outlined;
          case 'learning':
            return Icons.school_outlined;
          case 'family':
            return Icons.groups_rounded;
        }
      }

      if (title.toLowerCase().contains('priority')) {
        switch (key) {
          case 'urgent':
            return Icons.local_fire_department_rounded;
          case 'high':
            return Icons.priority_high_rounded;
          case 'medium':
            return Icons.remove_rounded;
          case 'low':
            return Icons.arrow_downward_rounded;
        }
      }

      return Icons.circle_outlined;
    }

    Color optionColor(String option) {
      final key = option.toLowerCase();
      if (title.toLowerCase().contains('category')) {
        switch (key) {
          case 'work':
            return tokens.accent;
          case 'personal':
            return tokens.sky;
          case 'health':
            return tokens.rose;
          case 'shopping':
            return tokens.sage;
          case 'learning':
            return const Color(0xFF8E6B3E);
          case 'family':
            return const Color(0xFF6E7BC7);
        }
      }

      if (title.toLowerCase().contains('priority')) {
        switch (key) {
          case 'urgent':
            return tokens.rose;
          case 'high':
            return const Color(0xFFD08D2F);
          case 'medium':
            return tokens.accent;
          case 'low':
            return tokens.sage;
        }
      }

      return tokens.accent;
    }

    return showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        return SafeArea(
          top: false,
          child: Container(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(sheetContext).size.height * 0.78,
            ),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: <Color>[
                  tokens.bgSurface,
                  tokens.bgRaised.withValues(alpha: 0.98),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(30)),
              border: Border(top: BorderSide(color: tokens.borderSubtle)),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x22000000),
                  blurRadius: 30,
                  offset: Offset(0, -6),
                ),
              ],
            ),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Center(
                    child: Container(
                      width: 42,
                      height: 4,
                      decoration: BoxDecoration(
                        color: tokens.accentDim,
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                  ),
                  const SizedBox(height: 9),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: tokens.bgRaised.withValues(alpha: 0.8),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: tokens.borderSubtle),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: tokens.accent.withValues(alpha: 0.10),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child:
                              Icon(optionIcon(selected), color: tokens.accent),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: <Widget>[
                              Text(
                                title,
                                style: Theme.of(context)
                                    .textTheme
                                    .titleMedium
                                    ?.copyWith(
                                      fontWeight: FontWeight.w900,
                                      color: tokens.textPrimary,
                                    ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Pick one option to keep your task setup clean.',
                                style: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.copyWith(
                                      color: tokens.textSecondary,
                                      height: 1.35,
                                    ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 9),
                  Flexible(
                    child: ListView.separated(
                      shrinkWrap: true,
                      itemCount: options.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final option = options[index];
                        final isSelected = option == selected;
                        final accent = optionColor(option);
                        final label = formatLabel(option);

                        return Material(
                          color: Colors.transparent,
                          child: InkWell(
                            onTap: () => Navigator.of(sheetContext).pop(option),
                            borderRadius: BorderRadius.circular(22),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 180),
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? accent.withValues(alpha: 0.10)
                                    : tokens.bgRaised.withValues(alpha: 0.76),
                                borderRadius: BorderRadius.circular(22),
                                border: Border.all(
                                  color: isSelected
                                      ? accent.withValues(alpha: 0.32)
                                      : tokens.borderSubtle,
                                ),
                                boxShadow: const [
                                  BoxShadow(
                                    color: Color(0x0C000000),
                                    blurRadius: 12,
                                    offset: Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Row(
                                children: <Widget>[
                                  Container(
                                    width: 42,
                                    height: 42,
                                    decoration: BoxDecoration(
                                      color: accent.withValues(alpha: 0.12),
                                      borderRadius: BorderRadius.circular(14),
                                    ),
                                    child: Icon(
                                      optionIcon(option),
                                      color: accent,
                                      size: 22,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: <Widget>[
                                        Text(
                                          label,
                                          style: Theme.of(context)
                                              .textTheme
                                              .titleSmall
                                              ?.copyWith(
                                                fontWeight: FontWeight.w800,
                                                color: tokens.textPrimary,
                                              ),
                                        ),
                                        const SizedBox(height: 3),
                                        Text(
                                          isSelected
                                              ? 'Currently selected'
                                              : 'Tap to select this value',
                                          style: Theme.of(context)
                                              .textTheme
                                              .bodySmall
                                              ?.copyWith(
                                                color: tokens.textSecondary,
                                              ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  AnimatedContainer(
                                    duration: const Duration(milliseconds: 180),
                                    width: 28,
                                    height: 28,
                                    decoration: BoxDecoration(
                                      color: isSelected
                                          ? accent
                                          : tokens.bgSurface,
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                        color: isSelected
                                            ? accent
                                            : tokens.borderMedium,
                                      ),
                                    ),
                                    child: Icon(
                                      isSelected ? Icons.check_rounded : null,
                                      size: 18,
                                      color: isSelected
                                          ? Colors.white
                                          : tokens.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
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
    final tokens = _tokens(context);
    final deadlineText = _deadline == null
        ? 'No deadline'
        : DateFormat('MMM d, yyyy').format(_deadline!);

    return DraggableScrollableSheet(
      initialChildSize: 0.92,
      maxChildSize: 0.98,
      expand: false,
      builder: (_, controller) {
        return Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: <Color>[
                tokens.bgBase,
                tokens.bgSurface.withValues(alpha: 0.98),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(34)),
            border: Border(top: BorderSide(color: tokens.borderSubtle)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x22000000),
                blurRadius: 30,
                offset: Offset(0, -6),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(18, 12, 18, 12),
            child: Form(
              key: _formKey,
              child: ListView(
                padding: EdgeInsets.zero,
                controller: controller,
                physics: const BouncingScrollPhysics(),
                keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
                children: <Widget>[
                  Center(
                    child: Container(
                      width: 46,
                      height: 4,
                      decoration: BoxDecoration(
                        color: tokens.accentDim.withValues(alpha: 0.95),
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: tokens.accent.withValues(alpha: 0.10),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: tokens.accent.withValues(alpha: 0.12),
                          ),
                        ),
                        child: Icon(
                          Icons.add_task_rounded,
                          color: tokens.accent,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            Row(
                              children: <Widget>[
                                Expanded(
                                  child: Text(
                                    'Create task',
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleLarge
                                        ?.copyWith(
                                          fontWeight: FontWeight.w900,
                                          color: tokens.textPrimary,
                                        ),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 5,
                                  ),
                                  decoration: BoxDecoration(
                                    color: tokens.accent.withValues(alpha: 0.10),
                                    borderRadius: BorderRadius.circular(999),
                                  ),
                                  child: Text(
                                    'New',
                                    style: Theme.of(context)
                                        .textTheme
                                        .labelSmall
                                        ?.copyWith(
                                          color: tokens.accent,
                                          fontWeight: FontWeight.w800,
                                        ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'Build a clear, actionable task with details and deadlines.',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: tokens.textSecondary,
                                    height: 1.4,
                                  ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 10),
                      Material(
                        color: tokens.bgRaised.withValues(alpha: 0.80),
                        shape: const CircleBorder(),
                        child: IconButton(
                          onPressed:
                              _saving ? null : () => Navigator.of(context).pop(),
                          icon: const Icon(Icons.close_rounded),
                          color: tokens.textSecondary,
                          splashRadius: 22,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                        color: tokens.bgSurface.withValues(alpha: 0.96),
                      borderRadius: BorderRadius.circular(28),
                      border: Border.all(color: tokens.borderSubtle),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x10000000),
                          blurRadius: 18,
                          offset: Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Row(
                          children: <Widget>[
                            Container(
                              width: 10,
                              height: 10,
                              decoration: BoxDecoration(
                                color: tokens.accent,
                                borderRadius: BorderRadius.circular(999),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Basics',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.4,
                                color: tokens.textPrimary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        TextField(
                          controller: title,
                          decoration: _inputDecoration(
                            context,
                            'Task name',
                            hintText: 'e.g. Write landing page copy',
                          ),
                          textAlignVertical: TextAlignVertical.center,
                          enabled: !_saving,
                        ),
                        const SizedBox(height: 10),
                        TextField(
                          controller: desc,
                          decoration: _inputDecoration(
                            context,
                            'Description',
                            hintText: 'Briefly describe the task, outcome, and constraints',
                          ),
                          minLines: 3,
                          maxLines: 5,
                          textAlignVertical: TextAlignVertical.top,
                          enabled: !_saving,
                        ),
                        if (!_aiLoading) const SizedBox(height: 10),
                        if (!_aiLoading)
                          Align(
                            alignment: Alignment.center,
                            child: FractionallySizedBox(
                              widthFactor: 0.92,
                              child: FilledButton.icon(
                                onPressed: _aiLoading ? null : _assistWrite,
                                icon: const Icon(Icons.auto_awesome_rounded, size: 18),
                                label: Text(_aiLoading ? 'Enhancing...' : 'AI Writing Assistant'),
                                style: FilledButton.styleFrom(
                                  elevation: 3,
                                  backgroundColor: tokens.accent,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: tokens.bgSurface.withValues(alpha: 0.96),
                      borderRadius: BorderRadius.circular(28),
                      border: Border.all(color: tokens.borderSubtle),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x10000000),
                          blurRadius: 18,
                          offset: Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Row(
                          children: <Widget>[
                            Container(
                              width: 10,
                              height: 10,
                              decoration: BoxDecoration(
                                color: tokens.accent,
                                borderRadius: BorderRadius.circular(999),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Settings',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.4,
                                color: tokens.textPrimary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: <Widget>[
                            Expanded(
                              child: InkWell(
                                onTap: _pickDeadline,
                                borderRadius: BorderRadius.circular(22),
                                child: InputDecorator(
                                  decoration:
                                      _inputDecoration(context, 'Deadline'),
                                  child: Text(
                                    deadlineText,
                                    style: TextStyle(
                                      color: _deadline == null
                                          ? tokens.textMuted
                                          : tokens.textPrimary,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: TextField(
                                controller: duration,
                                decoration:
                                    _inputDecoration(context, 'Minutes'),
                                keyboardType: TextInputType.number,
                                enabled: !_saving,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        InkWell(
                          onTap: _saving
                              ? null
                              : () async {
                                  final picked = await _showSelectionSheet(
                                    context,
                                    title: 'Select category',
                                    options: _categories,
                                    selected: _category,
                                  );
                                  if (picked == null) return;
                                  setState(() => _category = picked);
                                },
                          borderRadius: BorderRadius.circular(22),
                          child: InputDecorator(
                            decoration: _inputDecoration(context, 'Category'),
                            child: Text(
                              _category,
                              style: TextStyle(
                                color: tokens.textPrimary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        InkWell(
                          onTap: _saving
                              ? null
                              : () async {
                                  final picked = await _showSelectionSheet(
                                    context,
                                    title: 'Select priority',
                                    options: _priorities,
                                    selected: _priority,
                                  );
                                  if (picked == null) return;
                                  setState(() => _priority = picked);
                                },
                          borderRadius: BorderRadius.circular(22),
                          child: InputDecorator(
                            decoration: _inputDecoration(context, 'Priority'),
                            child: Text(
                              _priority,
                              style: TextStyle(
                                color: tokens.textPrimary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        TextField(
                          controller: tags,
                          decoration: _inputDecoration(
                            context,
                            'Tags',
                            hintText: 'Comma separated, e.g. fitness, health',
                          ),
                          enabled: !_saving,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),
                  Row(
                    children: <Widget>[
                      Expanded(
                        child: OutlinedButton(
                          onPressed: _saving ? null : () => Navigator.of(context).pop(),
                          style: OutlinedButton.styleFrom(
                            minimumSize: const Size.fromHeight(52),
                            side: BorderSide(color: tokens.borderMedium),
                            foregroundColor: tokens.textSecondary,
                            backgroundColor: tokens.bgBase.withValues(alpha: 0.04),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: const Text('Cancel'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: FilledButton(
                          onPressed: _saving ? null : _create,
                          style: FilledButton.styleFrom(
                            elevation: 6,
                            minimumSize: const Size.fromHeight(52),
                            backgroundColor: tokens.accent,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            shadowColor: tokens.accent.withValues(alpha: 0.28),
                          ),
                          child: Text(_saving ? 'Creating...' : 'Create Task'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
