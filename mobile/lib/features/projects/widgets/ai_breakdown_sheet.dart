import 'package:flutter/material.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../services/ai_service.dart';
import '../../../../services/task_service.dart';

class AiBreakdownSheet extends StatefulWidget {
  const AiBreakdownSheet({
    super.key,
    required this.projectId,
    required this.project,
    this.onTasksCreated,
  });

  final String projectId;
  final Map<String, dynamic> project;
  final VoidCallback? onTasksCreated;

  @override
  State<AiBreakdownSheet> createState() => _AiBreakdownSheetState();
}

class _AiBreakdownSheetState extends State<AiBreakdownSheet> {
  final TaskService _taskService = TaskService();
  final ScrollController _tasksScrollController = ScrollController();
  late final TextEditingController _descriptionController;

  String _scope = 'auto';
  int _taskCount = 12;
  bool _generating = false;
  bool _adding = false;
  String? _message;
  List<Map<String, dynamic>> _tasks = <Map<String, dynamic>>[];

  static const _scopeOptions = <String>['auto', 'school', 'basic', 'professional', 'advanced'];
  static const _countOptions = <int>[8, 12, 16, 20];

  @override
  void initState() {
    super.initState();
    _descriptionController = TextEditingController(
      text: '${widget.project['description'] ?? ''}',
    );
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    _tasksScrollController.dispose();
    super.dispose();
  }

  AppColorTokens _tokens(BuildContext context) {
    return Theme.of(context).extension<AppColorTokens>() ?? AppTheme.lightTokens;
  }

  String _projectTitle() {
    final title = '${widget.project['title'] ?? ''}'.trim();
    return title.isEmpty ? 'Untitled Project' : title;
  }

  String? _projectDeadline() {
    final raw = widget.project['dueDate'];
    if (raw == null) return null;
    final parsed = DateTime.tryParse(raw.toString());
    return parsed?.toIso8601String();
  }

  String _normalizeCategory(dynamic value) {
    const allowed = <String>{
      'Work',
      'Personal',
      'Health',
      'Shopping',
      'Learning',
      'Family',
    };

    final raw = '${value ?? ''}'.trim();
    if (raw.isEmpty) {
      return '${widget.project['category'] ?? 'Work'}';
    }

    final normalized = raw[0].toUpperCase() + raw.substring(1).toLowerCase();
    if (allowed.contains(normalized)) {
      return normalized;
    }

    final fallback = '${widget.project['category'] ?? 'Work'}';
    final fallbackNormalized = fallback.isEmpty
        ? 'Work'
        : fallback[0].toUpperCase() + fallback.substring(1).toLowerCase();
    return allowed.contains(fallbackNormalized) ? fallbackNormalized : 'Work';
  }

  String _formatHours(dynamic minutes) {
    final totalMinutes = int.tryParse('$minutes') ?? 0;
    if (totalMinutes <= 0) return '0m';
    final hours = totalMinutes / 60;
    if (hours < 1) return '${totalMinutes}m';
    if (hours == hours.roundToDouble()) return '${hours.toInt()}h';
    return '${hours.toStringAsFixed(1)}h';
  }

  Color _priorityColor(String priority) {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return const Color(0xFFC65B4C);
      case 'high':
        return const Color(0xFFD08D2F);
      case 'medium':
        return const Color(0xFF3D7CF4);
      case 'low':
        return const Color(0xFF4F8A67);
      default:
        return const Color(0xFF3D7CF4);
    }
  }

  Widget _infoChip(String text, dynamic tokenColor) {
    final Color bg = tokenColor is Color
        ? tokenColor.withOpacity(0.06)
        : (tokenColor?.withValues(alpha: 0.06) ?? Colors.grey.withOpacity(0.06));
    final Color border = tokenColor is Color
        ? tokenColor.withOpacity(0.12)
        : (tokenColor?.withValues(alpha: 0.12) ?? Colors.grey.withOpacity(0.12));
    final Color fg = tokenColor is Color
        ? tokenColor
        : (Theme.of(context).textTheme.bodySmall?.color ?? Colors.black);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: border),
      ),
      child: Text(
        text,
        style: TextStyle(fontSize: 12, color: fg, height: 1.05),
      ),
    );
  }

  Widget _pillOption({
    required String label,
    required bool selected,
    required VoidCallback onTap,
    bool showCheck = false,
  }) {
    final tokens = _tokens(context);

    return InkWell(
      borderRadius: BorderRadius.circular(10),
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? tokens.bgRaised : tokens.bgSurface,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: selected ? tokens.borderMedium : tokens.borderSubtle,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            if (selected && showCheck) ...[
              Icon(Icons.check, size: 14, color: tokens.textSecondary),
              const SizedBox(width: 6),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: selected ? tokens.textPrimary : tokens.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _generateTasks() async {
    setState(() {
      _generating = true;
      _message = null;
      _tasks = <Map<String, dynamic>>[];
    });

    try {
      final response = await AiService().projectBreakdown(
        _projectTitle(),
        _descriptionController.text.trim(),
        '${widget.project['category'] ?? 'work'}'.toLowerCase(),
        'solo',
        _scope,
        _taskCount,
        _projectDeadline(),
      );

      if (response.isEmpty) {
        throw StateError('AI service returned no data.');
      }

      final rawTasks = (response['tasks'] as List? ?? const <dynamic>[])
          .whereType<Map>()
          .map((task) => <String, dynamic>{
                'title': '${task['title'] ?? task['name'] ?? 'Generated Task'}',
                'description': '${task['description'] ?? ''}',
                'estimated_minutes': int.tryParse('${task['estimated_minutes'] ?? task['estimatedMinutes'] ?? 240}') ?? 240,
                'priority': '${task['priority'] ?? 'medium'}'.toLowerCase(),
                'category': _normalizeCategory(task['category']),
                'phase': '${task['phase'] ?? 'development'}',
                'deadline': task['deadline']?.toString(),
                'accepted': true,
              })
          .toList();

      setState(() {
        _tasks = rawTasks;
        _message = rawTasks.isEmpty
            ? 'No tasks were returned by the AI service.'
            : 'AI task breakdown generated successfully.';
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _message = 'Failed to generate AI project breakdown: $error';
      });
    } finally {
      if (mounted) {
        setState(() => _generating = false);
      }
    }
  }

  Future<void> _addAcceptedTasks() async {
    final acceptedTasks = _tasks.where((task) => task['accepted'] == true).toList();
    if (acceptedTasks.isEmpty) {
      setState(() => _message = 'Select at least one task before adding it to the project.');
      return;
    }

    setState(() {
      _adding = true;
      _message = null;
    });

    try {
      for (final task in acceptedTasks) {
        await _taskService.createTask(<String, dynamic>{
          'title': task['title'],
          'description': task['description'],
          'category': _normalizeCategory(task['category']),
          'priority': task['priority'],
          'status': 'todo',
          'deadline': task['deadline'],
          'projectId': widget.projectId,
          'estimatedDuration': task['estimated_minutes'],
          'tags': const <String>[],
          'subtasks': const <Map<String, dynamic>>[],
        });
      }

      widget.onTasksCreated?.call();
      if (!mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Added ${acceptedTasks.length} AI tasks to the project')),
      );
    } catch (error) {
      if (!mounted) return;
      setState(() => _message = 'Failed to add AI tasks: $error');
    } finally {
      if (mounted) {
        setState(() => _adding = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final tokens = _tokens(context);
    final totalEstimatedMinutes = _tasks.fold<int>(
      0,
      (sum, task) => sum + (int.tryParse('${task['estimated_minutes']}') ?? 0),
    );
    final acceptedCount = _tasks.where((t) => t['accepted'] == true).length;

    return DraggableScrollableSheet(
      initialChildSize: 0.88,
      minChildSize: 0.45,
      maxChildSize: 0.98,
      expand: false,
      builder: (sheetContext, sheetScrollController) {
        return SafeArea(
          top: false,
          child: Container(
            margin: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: tokens.bgSurface,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: tokens.borderSubtle),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: SingleChildScrollView(
                controller: sheetScrollController,
                padding: const EdgeInsets.fromLTRB(14, 10, 14, 14),
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
                    const SizedBox(height: 10),
                    Row(
                      children: <Widget>[
                        Container(
                          width: 34,
                          height: 34,
                          decoration: BoxDecoration(
                            color: tokens.accent.withValues(alpha: 0.14),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(Icons.auto_awesome_rounded, size: 18, color: tokens.accent),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: <Widget>[
                              Text(
                                'AI Project Breakdown',
                                style: TextStyle(
                                  fontWeight: FontWeight.w900,
                                  color: tokens.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Generate a structured task plan for ${_projectTitle()}.',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(fontSize: 12, color: tokens.textSecondary),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          onPressed: _generating || _adding ? null : () => Navigator.of(context).pop(),
                          icon: Icon(Icons.close_rounded, color: tokens.textSecondary),
                        ),
                      ],
                    ),
                    if (_message != null) ...[
                      const SizedBox(height: 10),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        decoration: BoxDecoration(
                          color: tokens.bgRaised,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: tokens.borderSubtle),
                        ),
                        child: Text(
                          _message!,
                          style: TextStyle(
                            color: tokens.textSecondary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],

                    const SizedBox(height: 10),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: tokens.bgRaised,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: tokens.borderSubtle),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Row(
                            children: <Widget>[
                              Expanded(
                                child: Text(
                                  _projectTitle(),
                                  style: TextStyle(fontWeight: FontWeight.w900, color: tokens.textPrimary),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: tokens.accent.withValues(alpha: 0.08),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  'Project snapshot',
                                  style: TextStyle(fontSize: 12, color: tokens.accent, fontWeight: FontWeight.w700),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: <Widget>[
                              _infoChip('Scope: $_scope', tokens.accent),
                              _infoChip('Tasks: $_taskCount', tokens.textSecondary),
                              _infoChip('Est. ${_formatHours(totalEstimatedMinutes)}', tokens.sage),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Project description',
                            style: TextStyle(fontWeight: FontWeight.w600, color: tokens.textSecondary),
                          ),
                          const SizedBox(height: 6),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: tokens.bgSurface,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: tokens.borderSubtle),
                            ),
                            child: Text(
                              _descriptionController.text.trim().isEmpty
                                  ? 'No description provided.'
                                  : _descriptionController.text.trim(),
                              style: TextStyle(color: tokens.textPrimary, height: 1.35),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 10),
                    Text('Scope', style: TextStyle(fontWeight: FontWeight.w800, color: tokens.textPrimary)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _scopeOptions
                          .map(
                            (scope) => _pillOption(
                              label: scope,
                              selected: _scope == scope,
                              onTap: _generating
                                  ? () {}
                                  : () => setState(() {
                                      _scope = scope;
                                    }),
                              showCheck: true,
                            ),
                          )
                          .toList(),
                    ),

                    const SizedBox(height: 10),
                    Text('Task count', style: TextStyle(fontWeight: FontWeight.w800, color: tokens.textPrimary)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _countOptions
                          .map(
                            (count) => _pillOption(
                              label: '$count',
                              selected: _taskCount == count,
                              onTap: _generating
                                  ? () {}
                                  : () => setState(() {
                                      _taskCount = count;
                                    }),
                              showCheck: true,
                            ),
                          )
                          .toList(),
                    ),

                    const SizedBox(height: 10),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                        onPressed: _generating || _adding ? null : _generateTasks,
                        icon: _generating
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Icon(Icons.auto_awesome_rounded, size: 16),
                        label: Text(_generating ? 'Generating...' : 'Generate Tasks'),
                      ),
                    ),

                    const SizedBox(height: 10),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: tokens.bgRaised,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: tokens.borderSubtle),
                      ),
                      child: Row(
                        children: <Widget>[
                          Expanded(
                            child: Text(
                              '${_tasks.length} tasks generated • ${_formatHours(totalEstimatedMinutes)} total',
                              style: TextStyle(fontWeight: FontWeight.w700, color: tokens.textPrimary),
                            ),
                          ),
                          Text(
                            '$acceptedCount accepted',
                            style: TextStyle(color: tokens.textSecondary),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 10),

                    if (_tasks.isNotEmpty)
                      ConstrainedBox(
                        constraints: BoxConstraints(
                            maxHeight: MediaQuery.of(sheetContext).size.height * 0.33),
                        child: Scrollbar(
                          controller: _tasksScrollController,
                          thumbVisibility: true,
                          child: ListView.separated(
                            controller: _tasksScrollController,
                            shrinkWrap: true,
                            physics: const BouncingScrollPhysics(),
                            itemCount: _tasks.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 10),
                            itemBuilder: (context, index) {
                              final task = _tasks[index];
                              final accepted = task['accepted'] == true;
                              final priority = '${task['priority']}'.toLowerCase();
                              final accent = _priorityColor(priority);

                              return Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: accepted ? accent.withValues(alpha: 0.06) : tokens.bgRaised,
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(color: accepted ? accent.withValues(alpha: 0.16) : tokens.borderSubtle),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: <Widget>[
                                    Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: <Widget>[
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: <Widget>[
                                              Text('${index + 1}. ${task['title']}',
                                                  style: TextStyle(fontWeight: FontWeight.w800, color: tokens.textPrimary)),
                                              const SizedBox(height: 6),
                                              Text('${task['description']}'.trim(),
                                                  style: TextStyle(color: tokens.textSecondary, height: 1.3)),
                                            ],
                                          ),
                                        ),
                                        Switch(
                                          value: accepted,
                                          onChanged: _adding
                                              ? null
                                              : (value) => setState(() {
                                                  task['accepted'] = value;
                                                }),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Wrap(
                                      spacing: 8,
                                      runSpacing: 6,
                                      children: <Widget>[
                                        _infoChip('Priority: ${task['priority']}', accent),
                                        _infoChip('Category: ${task['category']}', tokens.accent),
                                        _infoChip('Est: ${_formatHours(task['estimated_minutes'])}', tokens.sage),
                                        if (task['deadline'] != null && '${task['deadline']}'.isNotEmpty)
                                          _infoChip('Due: ${task['deadline']}', tokens.rose),
                                      ],
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                        ),
                      )
                    else
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: tokens.bgRaised,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: tokens.borderSubtle),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            Text('No generated tasks yet', style: TextStyle(fontWeight: FontWeight.w800, color: tokens.textPrimary)),
                            const SizedBox(height: 6),
                            Text('Tap Generate to create a structured task plan for this project.', style: TextStyle(color: tokens.textSecondary)),
                          ],
                        ),
                      ),

                    const SizedBox(height: 14),
                    Row(
                      children: <Widget>[
                        Expanded(
                          child: OutlinedButton(
                            onPressed: _generating || _adding ? null : () => Navigator.of(context).pop(),
                            style: OutlinedButton.styleFrom(
                              minimumSize: const Size.fromHeight(48),
                              side: BorderSide(color: tokens.borderMedium),
                              foregroundColor: tokens.textSecondary,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                            ),
                            child: const Text('Close'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          flex: 2,
                          child: FilledButton(
                            onPressed: _tasks.isEmpty || _adding ? null : _addAcceptedTasks,
                            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18))),
                            child: Text(_adding ? 'Adding...' : 'Add Accepted Tasks'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
