import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
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
  final AiService _aiService = AiService();
  final ScrollController _tasksScrollController = ScrollController();
  late final TextEditingController _descriptionController;

  String _scope = 'auto';
  bool _generating = false;
  bool _adding = false;
  bool _generatingSubtasksAll = false;
  String? _message;
  List<Map<String, dynamic>> _tasks = <Map<String, dynamic>>[];

  static const _scopeOptions = <String>[
    'auto', 'school', 'basic', 'professional', 'advanced'
  ];

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

  AppColorTokens _tokens(BuildContext context) =>
      Theme.of(context).extension<AppColorTokens>() ?? AppTheme.lightTokens;

  String _projectTitle() {
    final title = '${widget.project['title'] ?? ''}'.trim();
    return title.isEmpty ? 'Untitled Project' : title;
  }

  String? _projectDeadline() {
    final raw = widget.project['dueDate'];
    if (raw == null) return null;
    final parsed = DateTime.tryParse(raw.toString());
    if (parsed == null) return null;
    return '${parsed.year}-${parsed.month.toString().padLeft(2, '0')}-${parsed.day.toString().padLeft(2, '0')}';
  }

  String _normalizeCategory(dynamic value) {
    const allowed = <String>{
      'Work', 'Personal', 'Health', 'Shopping', 'Learning', 'Family',
    };
    final raw = '${value ?? ''}'.trim();
    if (raw.isNotEmpty) {
      final normalized =
          raw[0].toUpperCase() + raw.substring(1).toLowerCase();
      if (allowed.contains(normalized)) return normalized;
    }
    final fallback = '${widget.project['category'] ?? 'Work'}';
    final fn = fallback.isEmpty
        ? 'Work'
        : fallback[0].toUpperCase() + fallback.substring(1).toLowerCase();
    return allowed.contains(fn) ? fn : 'Work';
  }

  String _formatHours(dynamic minutes) {
    final total = int.tryParse('$minutes') ?? 0;
    if (total <= 0) return '0m';
    final hours = total / 60;
    if (hours < 1) return '${total}m';
    if (hours == hours.roundToDouble()) return '${hours.toInt()}h';
    return '${hours.toStringAsFixed(1)}h';
  }

  Color _priorityColor(String priority) {
    switch (priority.toLowerCase()) {
      case 'urgent': return const Color(0xFFC65B4C);
      case 'high':   return const Color(0xFFD08D2F);
      case 'low':    return const Color(0xFF4F8A67);
      default:       return const Color(0xFF3D7CF4);
    }
  }

  // ── Generate task plan ────────────────────────────────────────────────────
  Future<void> _generateTasks() async {
    setState(() {
      _generating = true;
      _message = null;
      _tasks = <Map<String, dynamic>>[];
    });

    try {
      final response = await _aiService.projectBreakdown(
        _projectTitle(),
        _descriptionController.text.trim(),
        '${widget.project['category'] ?? 'work'}'.toLowerCase(),
        'solo',
        _scope,
        // 12 is the web default — the AI naturally adjusts based on scope
        12,
        _projectDeadline(),
      );

      if (response.isEmpty) throw StateError('AI returned no data.');

      final rawTasks = (response['tasks'] as List? ?? const <dynamic>[])
          .whereType<Map>()
          .map((t) => <String, dynamic>{
                'id': 'ai-${DateTime.now().millisecondsSinceEpoch}-${_tasks.length}',
                'title': '${t['title'] ?? t['name'] ?? 'Generated Task'}',
                'description': '${t['description'] ?? ''}',
                'estimated_minutes':
                    int.tryParse('${t['estimated_minutes'] ?? t['estimatedMinutes'] ?? 240}') ?? 240,
                'priority': '${t['priority'] ?? 'medium'}'.toLowerCase(),
                'category': _normalizeCategory(t['category']),
                'phase': '${t['phase'] ?? 'development'}',
                'deadline': t['deadline']?.toString(),
                'accepted': true,
                'subtasks': <Map<String, dynamic>>[],
                'subtasksLoading': false,
              })
          .toList();

      setState(() {
        _tasks = rawTasks;
        _message = rawTasks.isEmpty
            ? 'No tasks were returned by the AI.'
            : null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _message = 'Failed to generate AI breakdown: $e');
    } finally {
      if (mounted) setState(() => _generating = false);
    }
  }

  // ── Generate subtasks for a single task ──────────────────────────────────
  Future<void> _generateSubtasksForTask(int index) async {
    final task = _tasks[index];
    setState(() => _tasks[index] = {...task, 'subtasksLoading': true});

    try {
      final response = await _aiService.generateSubtasks(
        '${_projectTitle()}\n${_descriptionController.text.trim()}',
        '${task['title']}',
        '${task['description']}',
        '${task['category']}',
        '${task['phase']}',
        task['estimated_minutes'] as int,
      );

      final subtasks = (response['subtasks'] as List? ?? const <dynamic>[])
          .whereType<Map>()
          .map((s) => Map<String, dynamic>.from(s))
          .toList();

      setState(() {
        _tasks[index] = {
          ..._tasks[index],
          'subtasks': subtasks,
          'subtasksLoading': false,
        };
      });
    } catch (e) {
      setState(() => _tasks[index] = {
            ..._tasks[index],
            'subtasksLoading': false,
          });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Subtask generation failed: $e')),
        );
      }
    }
  }

  // ── Generate subtasks for all accepted tasks ──────────────────────────────
  Future<void> _generateSubtasksForAll() async {
    final indices = <int>[];
    for (var i = 0; i < _tasks.length; i++) {
      if (_tasks[i]['accepted'] == true &&
          (_tasks[i]['subtasks'] as List).isEmpty) {
        indices.add(i);
      }
    }
    if (indices.isEmpty) return;

    setState(() => _generatingSubtasksAll = true);

    for (final i in indices) {
      if (!mounted) break;
      await _generateSubtasksForTask(i);
    }

    if (mounted) setState(() => _generatingSubtasksAll = false);
  }

  // ── Add accepted tasks to project ─────────────────────────────────────────
  Future<void> _addAcceptedTasks() async {
    final accepted =
        _tasks.where((t) => t['accepted'] == true).toList();
    if (accepted.isEmpty) {
      setState(() =>
          _message = 'Select at least one task before adding.');
      return;
    }

    setState(() {
      _adding = true;
      _message = null;
    });

    try {
      for (final task in accepted) {
        final subtasks = (task['subtasks'] as List? ?? const <dynamic>[])
            .whereType<Map>()
            .map((s) => <String, dynamic>{
                  'title': '${s['title'] ?? ''}',
                  'completed': false,
                })
            .toList();

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
          'subtasks': subtasks,
        });
      }

      widget.onTasksCreated?.call();
      if (!mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content:
                Text('Added ${accepted.length} AI tasks to the project')),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _message = 'Failed to add tasks: $e');
    } finally {
      if (mounted) setState(() => _adding = false);
    }
  }

  // ── Scope pill ────────────────────────────────────────────────────────────
  Widget _scopePill(String scope) {
    final tokens = _tokens(context);
    final selected = _scope == scope;
    return InkWell(
      borderRadius: BorderRadius.circular(10),
      onTap: _generating ? null : () => setState(() => _scope = scope),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: selected
              ? AppColorsShared.accent.withValues(alpha: 0.12)
              : tokens.bgSurface,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: selected
                ? AppColorsShared.accent.withValues(alpha: 0.40)
                : tokens.borderSubtle,
            width: selected ? 1.4 : 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            if (selected) ...[
              Icon(Icons.check_rounded,
                  size: 13, color: AppColorsShared.accent),
              const SizedBox(width: 5),
            ],
            Text(
              scope,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: selected
                    ? AppColorsShared.accent
                    : tokens.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Info chip ─────────────────────────────────────────────────────────────
  Widget _infoChip(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.18)),
      ),
      child: Text(text,
          style: TextStyle(
              fontSize: 11, color: color, fontWeight: FontWeight.w600)),
    );
  }

  // ── Single task card ──────────────────────────────────────────────────────
  Widget _taskCard(int index) {
    final tokens = _tokens(context);
    final task = _tasks[index];
    final accepted = task['accepted'] == true;
    final priority = '${task['priority']}'.toLowerCase();
    final accent = _priorityColor(priority);
    final subtasks =
        (task['subtasks'] as List? ?? const <dynamic>[]).cast<Map>();
    final subtasksLoading = task['subtasksLoading'] == true;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: accepted
            ? accent.withValues(alpha: 0.06)
            : tokens.bgRaised,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: accepted
              ? accent.withValues(alpha: 0.18)
              : tokens.borderSubtle,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          // Title row + accept toggle
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      '${index + 1}. ${task['title']}',
                      style: TextStyle(
                          fontWeight: FontWeight.w800,
                          color: tokens.textPrimary),
                    ),
                    if ('${task['description']}'.trim().isNotEmpty) ...[
                      const SizedBox(height: 5),
                      Text(
                        '${task['description']}'.trim(),
                        style: TextStyle(
                            color: tokens.textSecondary,
                            height: 1.35,
                            fontSize: 13),
                      ),
                    ],
                  ],
                ),
              ),
              Switch(
                value: accepted,
                activeColor: AppColorsShared.accent,
                onChanged: _adding
                    ? null
                    : (v) => setState(() => task['accepted'] = v),
              ),
            ],
          ),

          const SizedBox(height: 8),

          // Meta chips
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: <Widget>[
              _infoChip('${task['priority']}', accent),
              _infoChip('${task['category']}',
                  AppColorsShared.accent),
              _infoChip(_formatHours(task['estimated_minutes']),
                  AppColorsShared.sage),
              if (task['deadline'] != null &&
                  '${task['deadline']}'.isNotEmpty)
                _infoChip('Due: ${task['deadline']}',
                    AppColorsShared.rose),
            ],
          ),

          const SizedBox(height: 10),

          // Generate subtasks button
          if (!subtasksLoading && subtasks.isEmpty)
            GestureDetector(
              onTap: (_adding || _generatingSubtasksAll)
                  ? null
                  : () => _generateSubtasksForTask(index),
              child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 10, vertical: 7),
                decoration: BoxDecoration(
                  color: tokens.bgSurface,
                  borderRadius: BorderRadius.circular(8),
                  border:
                      Border.all(color: tokens.borderSubtle),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: <Widget>[
                    Icon(Icons.auto_awesome_rounded,
                        size: 13, color: tokens.textSecondary),
                    const SizedBox(width: 6),
                    Text(
                      'Generate subtasks',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: tokens.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else if (subtasksLoading)
            Row(
              children: <Widget>[
                const SizedBox(
                  width: 14,
                  height: 14,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
                const SizedBox(width: 8),
                Text('Generating subtasks...',
                    style: TextStyle(
                        fontSize: 12,
                        color: tokens.textSecondary)),
              ],
            )
          else ...[
            // Subtask list
            ...subtasks.map((s) => Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Icon(Icons.check_circle_outline_rounded,
                          size: 14,
                          color: AppColorsShared.sage),
                      const SizedBox(width: 7),
                      Expanded(
                        child: Text(
                          '${s['title'] ?? s['description'] ?? ''}',
                          style: TextStyle(
                            fontSize: 12,
                            color: tokens.textSecondary,
                            height: 1.3,
                          ),
                        ),
                      ),
                    ],
                  ),
                )),
          ],
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final tokens = _tokens(context);
    final totalMinutes = _tasks.fold<int>(
      0,
      (sum, t) =>
          sum + (int.tryParse('${t['estimated_minutes']}') ?? 0),
    );
    final acceptedCount =
        _tasks.where((t) => t['accepted'] == true).length;
    final hasSubtaskableTask = _tasks.any(
      (t) =>
          t['accepted'] == true &&
          (t['subtasks'] as List).isEmpty &&
          t['subtasksLoading'] == false,
    );

    return DraggableScrollableSheet(
      initialChildSize: 0.90,
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
                padding:
                    const EdgeInsets.fromLTRB(14, 10, 14, 14),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    // Drag handle
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

                    // Header
                    Row(
                      children: <Widget>[
                        Container(
                          width: 34,
                          height: 34,
                          decoration: BoxDecoration(
                            color: tokens.accent
                                .withValues(alpha: 0.14),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(
                              Icons.auto_awesome_rounded,
                              size: 18,
                              color: tokens.accent),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment:
                                CrossAxisAlignment.start,
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
                                style: TextStyle(
                                    fontSize: 12,
                                    color: tokens.textSecondary),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          onPressed: _generating || _adding
                              ? null
                              : () => Navigator.of(context).pop(),
                          icon: Icon(Icons.close_rounded,
                              color: tokens.textSecondary),
                        ),
                      ],
                    ),

                    // Message banner
                    if (_message != null) ...[
                      const SizedBox(height: 10),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 10),
                        decoration: BoxDecoration(
                          color: tokens.bgRaised,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                              color: tokens.borderSubtle),
                        ),
                        child: Text(_message!,
                            style: TextStyle(
                              color: tokens.textSecondary,
                              fontWeight: FontWeight.w600,
                            )),
                      ),
                    ],

                    const SizedBox(height: 10),

                    // Project snapshot card
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
                                  style: TextStyle(
                                      fontWeight: FontWeight.w900,
                                      color: tokens.textPrimary),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              Container(
                                padding:
                                    const EdgeInsets.symmetric(
                                        horizontal: 10, vertical: 5),
                                decoration: BoxDecoration(
                                  color: tokens.accent
                                      .withValues(alpha: 0.08),
                                  borderRadius:
                                      BorderRadius.circular(20),
                                ),
                                child: Text(
                                  'Project snapshot',
                                  style: TextStyle(
                                      fontSize: 11,
                                      color: tokens.accent,
                                      fontWeight: FontWeight.w700),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: <Widget>[
                              _infoChip('Scope: $_scope',
                                  AppColorsShared.accent),
                              _infoChip(
                                  _tasks.isEmpty
                                      ? 'Tasks: AI decides'
                                      : 'Tasks: ${_tasks.length}',
                                  tokens.textSecondary),
                              _infoChip(
                                  'Est. ${_formatHours(totalMinutes)}',
                                  AppColorsShared.sage),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text('Project description',
                              style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: tokens.textSecondary,
                                  fontSize: 12)),
                          const SizedBox(height: 6),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: tokens.bgSurface,
                              borderRadius:
                                  BorderRadius.circular(10),
                              border: Border.all(
                                  color: tokens.borderSubtle),
                            ),
                            child: Text(
                              _descriptionController.text
                                      .trim()
                                      .isEmpty
                                  ? 'No description provided.'
                                  : _descriptionController.text
                                      .trim(),
                              style: TextStyle(
                                  color: tokens.textPrimary,
                                  height: 1.35),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 12),

                    // Scope selector
                    Text('Scope',
                        style: TextStyle(
                            fontWeight: FontWeight.w800,
                            color: tokens.textPrimary)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _scopeOptions
                          .map((s) => _scopePill(s))
                          .toList(),
                    ),

                    // ── No manual task count — AI decides ────────────────
                    const SizedBox(height: 4),
                    Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: Row(
                        children: <Widget>[
                          Icon(Icons.info_outline_rounded,
                              size: 13,
                              color: tokens.textMuted),
                          const SizedBox(width: 6),
                          Text(
                            'Task count is decided by AI based on scope & project complexity.',
                            style: TextStyle(
                              fontSize: 11,
                              color: tokens.textMuted,
                              height: 1.3,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 12),

                    // Generate button
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColorsShared.accent,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                              vertical: 14),
                          shape: RoundedRectangleBorder(
                              borderRadius:
                                  BorderRadius.circular(14)),
                        ),
                        onPressed:
                            _generating || _adding ? null : _generateTasks,
                        icon: _generating
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white),
                              )
                            : const Icon(
                                Icons.auto_awesome_rounded,
                                size: 16),
                        label: Text(_generating
                            ? 'Generating...'
                            : 'Generate Tasks'),
                      ),
                    ),

                    const SizedBox(height: 10),

                    // Stats bar
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: tokens.bgRaised,
                        borderRadius: BorderRadius.circular(12),
                        border:
                            Border.all(color: tokens.borderSubtle),
                      ),
                      child: Row(
                        children: <Widget>[
                          Expanded(
                            child: Text(
                              '${_tasks.length} tasks generated • ${_formatHours(totalMinutes)} total',
                              style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  color: tokens.textPrimary),
                            ),
                          ),
                          Text('$acceptedCount accepted',
                              style: TextStyle(
                                  color: tokens.textSecondary)),
                        ],
                      ),
                    ),

                    // ── Generate Subtasks for All button ─────────────────
                    if (_tasks.isNotEmpty && hasSubtaskableTask) ...[
                      const SizedBox(height: 8),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColorsShared.accent,
                            side: BorderSide(
                                color: AppColorsShared.accent
                                    .withValues(alpha: 0.40)),
                            padding: const EdgeInsets.symmetric(
                                vertical: 12),
                            shape: RoundedRectangleBorder(
                                borderRadius:
                                    BorderRadius.circular(14)),
                          ),
                          onPressed: (_adding ||
                                  _generatingSubtasksAll ||
                                  _generating)
                              ? null
                              : _generateSubtasksForAll,
                          icon: _generatingSubtasksAll
                              ? SizedBox(
                                  width: 15,
                                  height: 15,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: AppColorsShared.accent,
                                  ),
                                )
                              : const Icon(
                                  Icons.account_tree_outlined,
                                  size: 15),
                          label: Text(
                            _generatingSubtasksAll
                                ? 'Generating subtasks...'
                                : 'Generate Subtasks for All',
                            style: const TextStyle(
                                fontWeight: FontWeight.w700),
                          ),
                        ),
                      ),
                    ],

                    const SizedBox(height: 10),

                    // Task list or empty state
                    if (_tasks.isNotEmpty) ...[
                      // Accept all / Deny all row
                      Row(
                        children: <Widget>[
                          Text(
                            '$acceptedCount of ${_tasks.length} accepted',
                            style: TextStyle(
                                fontSize: 12,
                                color: tokens.textSecondary),
                          ),
                          const Spacer(),
                          GestureDetector(
                            onTap: () => setState(() {
                              for (final t in _tasks) {
                                t['accepted'] = true;
                              }
                            }),
                            child: Text('Accept all',
                                style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: AppColorsShared.accent)),
                          ),
                          const SizedBox(width: 12),
                          GestureDetector(
                            onTap: () => setState(() {
                              for (final t in _tasks) {
                                t['accepted'] = false;
                              }
                            }),
                            child: Text('Deny all',
                                style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: tokens.textSecondary)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      ...List.generate(
                        _tasks.length,
                        (i) => _taskCard(i),
                      ),
                    ] else
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: tokens.bgRaised,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                              color: tokens.borderSubtle),
                        ),
                        child: Column(
                          crossAxisAlignment:
                              CrossAxisAlignment.start,
                          children: <Widget>[
                            Text('No generated tasks yet',
                                style: TextStyle(
                                    fontWeight: FontWeight.w800,
                                    color: tokens.textPrimary)),
                            const SizedBox(height: 6),
                            Text(
                              'Tap Generate to create a structured task plan for this project.',
                              style: TextStyle(
                                  color: tokens.textSecondary),
                            ),
                          ],
                        ),
                      ),

                    const SizedBox(height: 12),

                    // Footer actions
                    Row(
                      children: <Widget>[
                        Expanded(
                          child: OutlinedButton(
                            onPressed: _generating || _adding
                                ? null
                                : () => Navigator.of(context).pop(),
                            style: OutlinedButton.styleFrom(
                              minimumSize:
                                  const Size.fromHeight(48),
                              side: BorderSide(
                                  color: tokens.borderMedium),
                              foregroundColor: tokens.textSecondary,
                              shape: RoundedRectangleBorder(
                                  borderRadius:
                                      BorderRadius.circular(14)),
                            ),
                            child: const Text('Close'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          flex: 2,
                          child: FilledButton(
                            onPressed:
                                (_tasks.isEmpty || _adding || acceptedCount == 0)
                                    ? null
                                    : _addAcceptedTasks,
                            style: FilledButton.styleFrom(
                              minimumSize:
                                  const Size.fromHeight(48),
                              backgroundColor:
                                  AppColorsShared.accent,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                  borderRadius:
                                      BorderRadius.circular(14)),
                            ),
                            child: Text(
                              _adding
                                  ? 'Adding...'
                                  : acceptedCount > 0
                                      ? 'Add $acceptedCount Task${acceptedCount == 1 ? '' : 's'}'
                                      : 'No Tasks Accepted',
                              style: const TextStyle(
                                  fontWeight: FontWeight.w700),
                            ),
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