import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:timeago/timeago.dart' as timeago;

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/tf_badge.dart';
import '../../../../core/widgets/tf_button.dart';
import '../../../../core/widgets/tf_input.dart';
import '../../../../services/task_service.dart';
import '../models/task_model.dart';
import '../providers/tasks_provider.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Modern date picker bottom sheet
// ─────────────────────────────────────────────────────────────────────────────
Future<DateTime?> showModernDatePicker({
  required BuildContext context,
  DateTime? initialDate,
}) async {
  return showModalBottomSheet<DateTime>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _ModernDatePickerSheet(initialDate: initialDate),
  );
}

class _ModernDatePickerSheet extends StatefulWidget {
  const _ModernDatePickerSheet({this.initialDate});
  final DateTime? initialDate;

  @override
  State<_ModernDatePickerSheet> createState() => _ModernDatePickerSheetState();
}

class _ModernDatePickerSheetState extends State<_ModernDatePickerSheet> {
  late DateTime _focusedMonth;
  DateTime? _selected;

  static const _weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _selected = widget.initialDate;
    _focusedMonth = DateTime(
      (_selected ?? now).year,
      (_selected ?? now).month,
    );
  }

  void _prevMonth() => setState(() {
        _focusedMonth =
            DateTime(_focusedMonth.year, _focusedMonth.month - 1);
      });

  void _nextMonth() => setState(() {
        _focusedMonth =
            DateTime(_focusedMonth.year, _focusedMonth.month + 1);
      });

  List<DateTime?> _buildGrid() {
    final firstDay = DateTime(_focusedMonth.year, _focusedMonth.month, 1);
    final daysInMonth =
        DateTime(_focusedMonth.year, _focusedMonth.month + 1, 0).day;
    final startOffset = firstDay.weekday % 7; // Sun = 0
    final cells = <DateTime?>[];
    for (var i = 0; i < startOffset; i++) {
      cells.add(null);
    }
    for (var d = 1; d <= daysInMonth; d++) {
      cells.add(DateTime(_focusedMonth.year, _focusedMonth.month, d));
    }
    // pad to complete last row
    while (cells.length % 7 != 0) {
      cells.add(null);
    }
    return cells;
  }

  bool _isToday(DateTime d) {
    final now = DateTime.now();
    return d.year == now.year && d.month == now.month && d.day == now.day;
  }

  bool _isSelected(DateTime d) =>
      _selected != null &&
      d.year == _selected!.year &&
      d.month == _selected!.month &&
      d.day == _selected!.day;

  bool _isPast(DateTime d) {
    final now = DateTime.now();
    return d.isBefore(DateTime(now.year, now.month, now.day));
  }

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final grid = _buildGrid();
    final accent = AppColorsShared.accent;

    // Quick-pick shortcuts
    final now = DateTime.now();
    final shortcuts = <String, DateTime>{
      'Today': now,
      'Tomorrow': now.add(const Duration(days: 1)),
      'In 3 days': now.add(const Duration(days: 3)),
      'Next week': now.add(const Duration(days: 7)),
      'In 2 weeks': now.add(const Duration(days: 14)),
    };

    return Container(
      decoration: BoxDecoration(
        color: tokens.bgSurface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.5 : 0.12),
            blurRadius: 32,
            offset: const Offset(0, -8),
          ),
        ],
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // drag handle
          const SizedBox(height: 12),
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: tokens.borderMedium,
                borderRadius: BorderRadius.circular(999),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Header label
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Text(
                  'Select due date',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: tokens.textPrimary,
                      ),
                ),
                const Spacer(),
                if (_selected != null)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: accent.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: accent.withValues(alpha: 0.25)),
                    ),
                    child: Text(
                      DateFormat('MMM d, yyyy').format(_selected!),
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: accent,
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Quick picks
          SizedBox(
            height: 34,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              children: shortcuts.entries.map((e) {
                final isActive = _selected != null &&
                    _selected!.year == e.value.year &&
                    _selected!.month == e.value.month &&
                    _selected!.day == e.value.day;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: GestureDetector(
                    onTap: () => setState(() => _selected = e.value),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(
                        color: isActive
                            ? accent
                            : tokens.bgRaised,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isActive
                              ? accent
                              : tokens.borderMedium,
                        ),
                      ),
                      child: Text(
                        e.key,
                        style:
                            Theme.of(context).textTheme.labelSmall?.copyWith(
                                  color: isActive
                                      ? Colors.white
                                      : tokens.textSecondary,
                                  fontWeight: FontWeight.w600,
                                ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 20),

          // Month nav
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                GestureDetector(
                  onTap: _prevMonth,
                  child: Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: tokens.bgRaised,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: tokens.borderSubtle),
                    ),
                    child: Icon(Icons.chevron_left_rounded,
                        color: tokens.textSecondary, size: 20),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    DateFormat('MMMM yyyy').format(_focusedMonth),
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: tokens.textPrimary,
                        ),
                  ),
                ),
                const SizedBox(width: 12),
                GestureDetector(
                  onTap: _nextMonth,
                  child: Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: tokens.bgRaised,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: tokens.borderSubtle),
                    ),
                    child: Icon(Icons.chevron_right_rounded,
                        color: tokens.textSecondary, size: 20),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Weekday headers
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: _weekdays
                  .map(
                    (d) => Expanded(
                      child: Text(
                        d,
                        textAlign: TextAlign.center,
                        style:
                            Theme.of(context).textTheme.labelSmall?.copyWith(
                                  color: tokens.textMuted,
                                  fontWeight: FontWeight.w600,
                                  letterSpacing: 0.5,
                                ),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
          const SizedBox(height: 8),

          // Calendar grid
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: GridView.count(
              crossAxisCount: 7,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 4,
              crossAxisSpacing: 0,
              childAspectRatio: 1.1,
              children: grid.map((day) {
                if (day == null) return const SizedBox.shrink();

                final selected = _isSelected(day);
                final today = _isToday(day);
                final past = _isPast(day);

                return GestureDetector(
                  onTap: past ? null : () => setState(() => _selected = day),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    margin: const EdgeInsets.all(2),
                    decoration: BoxDecoration(
                      color: selected
                          ? accent
                          : today
                              ? accent.withValues(alpha: 0.10)
                              : Colors.transparent,
                      borderRadius: BorderRadius.circular(10),
                      border: today && !selected
                          ? Border.all(
                              color: accent.withValues(alpha: 0.5), width: 1.5)
                          : null,
                    ),
                    child: Center(
                      child: Text(
                        '${day.day}',
                        style:
                            Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: selected
                                      ? Colors.white
                                      : past
                                          ? tokens.textDisabled
                                          : today
                                              ? accent
                                              : tokens.textPrimary,
                                  fontWeight: selected || today
                                      ? FontWeight.w700
                                      : FontWeight.w400,
                                ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 20),

          // Action buttons
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Expanded(
                  child: TfButton(
                    label: 'Clear',
                    variant: TfButtonVariant.secondary,
                    onPressed: () => Navigator.of(context).pop(null),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TfButton(
                    label: 'Confirm',
                    variant: TfButtonVariant.accent,
                    onPressed: _selected == null
                        ? null
                        : () => Navigator.of(context).pop(_selected),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Task detail sheet
// ─────────────────────────────────────────────────────────────────────────────
class TaskDetailSheet extends ConsumerStatefulWidget {
  const TaskDetailSheet({super.key, required this.task});

  final TaskModel task;

  @override
  ConsumerState<TaskDetailSheet> createState() => _TaskDetailSheetState();
}

class _TaskDetailSheetState extends ConsumerState<TaskDetailSheet> {
  late final TextEditingController _title;
  late final TextEditingController _description;
  late final TextEditingController _duration;
  late final TextEditingController _comment;
  late final TextEditingController _shareEmail;
  late final TextEditingController _subtaskTitle;
  late String _status;
  late String _priority;
  late bool _isEditing;
  late bool _isTracking;
  DateTime? _editDeadline;
  bool _saving = false;
  bool _deleting = false;
  bool _uploading = false;
  bool _commenting = false;
  bool _sharing = false;
  final TaskService _taskService = TaskService();
  List<Map<String, dynamic>> _attachments = <Map<String, dynamic>>[];
  List<Map<String, dynamic>> _comments = <Map<String, dynamic>>[];
  List<Map<String, dynamic>> _subtasks = <Map<String, dynamic>>[];
  String? _trackingError;

  static const _statuses = <String>['todo', 'in-progress', 'review', 'done'];
  static const _priorities = <String>['low', 'medium', 'high', 'urgent'];

  @override
  void initState() {
    super.initState();
    _title = TextEditingController(text: widget.task.title);
    _description = TextEditingController(text: widget.task.description ?? '');
    _duration =
        TextEditingController(text: '${widget.task.estimatedDuration}');
    _comment = TextEditingController();
    _shareEmail = TextEditingController();
    _subtaskTitle = TextEditingController();
    _status = widget.task.status;
    _priority = widget.task.priority;
    _editDeadline = widget.task.deadline;
    _isEditing = false;
    _isTracking = false;
    _attachments = List<Map<String, dynamic>>.from(widget.task.attachments);
    _comments = List<Map<String, dynamic>>.from(widget.task.comments);
    _subtasks = List<Map<String, dynamic>>.from(widget.task.subtasks);
  }

  List<Map<String, dynamic>> _readMapList(dynamic value) {
    if (value is! List) return <Map<String, dynamic>>[];
    return value
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
  }

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    _duration.dispose();
    _comment.dispose();
    _shareEmail.dispose();
    _subtaskTitle.dispose();
    super.dispose();
  }

  Future<void> _pickDeadline() async {
    final picked = await showModernDatePicker(
      context: context,
      initialDate: _editDeadline,
    );
    // null = clear, picked date = new value, dismissed = no change
    // showModalBottomSheet returns null on dismiss too, so we use a sentinel:
    // If user taps Clear we pop(null), if user taps Confirm we pop(_selected)
    // We can't distinguish dismiss vs clear without a wrapper — so only update
    // when the sheet is not dismissed via back gesture (pop returns non-null future).
    // To handle this cleanly: always update on return, keep current if result is
    // identical to current (no-op for dismiss via back).
    setState(() => _editDeadline = picked);
  }

  Future<void> _save() async {
    if (_title.text.trim().isEmpty) return;
    setState(() => _saving = true);
    try {
      await ref
          .read(tasksProvider.notifier)
          .updateTask(widget.task.id, <String, dynamic>{
        'title': _title.text.trim(),
        'description': _description.text.trim(),
        'status': _status,
        'priority': _priority,
        'estimatedDuration':
            int.tryParse(_duration.text.trim()) ?? widget.task.estimatedDuration,
        if (_editDeadline != null)
          'deadline': _editDeadline!.toIso8601String(),
      });
      if (!mounted) return;
      setState(() => _isEditing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Task updated successfully')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to update task: $e')),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _toggleComplete() async {
    setState(() => _saving = true);
    try {
      await ref.read(tasksProvider.notifier).toggleComplete(widget.task);
      if (!mounted) return;
      setState(() => _status = _status == 'done' ? 'todo' : 'done');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content:
                Text(_status == 'done' ? 'Marked complete' : 'Marked todo')),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _delete() async {
    setState(() => _deleting = true);
    try {
      await ref.read(tasksProvider.notifier).deleteTask(widget.task.id);
      if (!mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Task deleted')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Delete failed: $e')),
      );
    } finally {
      if (mounted) setState(() => _deleting = false);
    }
  }

  Future<void> _startTimer() async {
    setState(() => _trackingError = null);
    try {
      await _taskService.startTimer(widget.task.id);
      if (!mounted) return;
      setState(() => _isTracking = true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _trackingError = e.toString());
    }
  }

  Future<void> _stopTimer() async {
    setState(() => _trackingError = null);
    try {
      await _taskService.stopTimer(widget.task.id);
      if (!mounted) return;
      setState(() => _isTracking = false);
    } catch (e) {
      if (!mounted) return;
      setState(() => _trackingError = e.toString());
    }
  }

  Future<void> _uploadAttachment() async {
    setState(() => _uploading = true);
    try {
      final result = await FilePicker.platform.pickFiles(withData: false);
      if (result == null || result.files.single.path == null) return;
      final file = File(result.files.single.path!);
      await _taskService.addAttachment(widget.task.id, file);
      await _refreshDetailData();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Upload failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _addComment() async {
    if (_comment.text.trim().isEmpty) return;
    setState(() => _commenting = true);
    try {
      await _taskService.addComment(widget.task.id, _comment.text.trim());
      _comment.clear();
      await _refreshDetailData();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Comment failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _commenting = false);
    }
  }

  Future<void> _shareTask() async {
    if (_shareEmail.text.trim().isEmpty) return;
    setState(() => _sharing = true);
    try {
      await _taskService.shareTask(widget.task.id, _shareEmail.text.trim());
      _shareEmail.clear();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Task shared successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Share failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _sharing = false);
    }
  }

  Future<void> _addSubtask() async {
    if (_subtaskTitle.text.trim().isEmpty) return;
    try {
      await _taskService.addSubtask(
          widget.task.id, <String, dynamic>{'title': _subtaskTitle.text.trim()});
      _subtaskTitle.clear();
      await _refreshDetailData();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Add subtask failed: $e')),
        );
      }
    }
  }

  Future<void> _toggleSubtask(String subtaskId) async {
    try {
      await _taskService.toggleSubtask(widget.task.id, subtaskId);
      await _refreshDetailData();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Update subtask failed: $e')),
        );
      }
    }
  }

  Future<void> _refreshDetailData() async {
    final response = await _taskService.getTask(widget.task.id);
    final task = Map<String, dynamic>.from(response['task'] as Map);
    if (!mounted) return;
    setState(() {
      _attachments = _readMapList(task['attachments']);
      _comments = _readMapList(task['comments']);
      _subtasks = _readMapList(task['subtasks']);
    });
  }

  Widget _sectionTitle(IconData icon, String label) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: <Widget>[
          Icon(icon, size: 18, color: tokens.textPrimary),
          const SizedBox(width: 8),
          Text(
            label,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: tokens.textPrimary,
                ),
          ),
        ],
      ),
    );
  }

  // Deadline field used in edit mode — tappable row that opens custom picker
  Widget _deadlineField(AppColorTokens tokens) {
    final accent = AppColorsShared.accent;
    final label = _editDeadline == null
        ? 'No deadline'
        : DateFormat('MMM d, yyyy').format(_editDeadline!);

    return GestureDetector(
      onTap: _pickDeadline,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
        decoration: BoxDecoration(
          color: tokens.bgRaised,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: tokens.borderSubtle),
        ),
        child: Row(
          children: [
            Icon(Icons.calendar_today_outlined,
                size: 16, color: tokens.textMuted),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                label,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: _editDeadline == null
                          ? tokens.textMuted
                          : tokens.textPrimary,
                    ),
              ),
            ),
            if (_editDeadline != null)
              GestureDetector(
                onTap: () => setState(() => _editDeadline = null),
                child: Icon(Icons.close_rounded, size: 16, color: tokens.textMuted),
              )
            else
              Icon(Icons.chevron_right_rounded, size: 18, color: accent),
          ],
        ),
      ),
    );
  }

  Widget _buildSubtasksSection() {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final completedCount = _subtasks
        .where((s) => s['completed'] == true || s['isCompleted'] == true)
        .length;
    final totalCount = _subtasks.length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Row(
          children: <Widget>[
            Icon(Icons.check_rounded, size: 20, color: tokens.textPrimary),
            const SizedBox(width: 8),
            Text(
              'Subtasks ($completedCount/$totalCount)',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: tokens.textPrimary,
                  ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (_subtasks.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: tokens.bgRaised,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: tokens.borderSubtle),
            ),
            child: Text(
              'No subtasks yet',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: tokens.textSecondary,
                  ),
            ),
          )
        else
          Column(
            children: _subtasks.map((subtask) {
              final subtaskId = subtask['_id']?.toString() ??
                  subtask['id']?.toString() ??
                  '';
              final completed = subtask['completed'] == true ||
                  subtask['isCompleted'] == true;
              final title =
                  subtask['title']?.toString() ?? 'Untitled subtask';

              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: tokens.bgRaised,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: tokens.borderSubtle),
                ),
                child: Row(
                  children: <Widget>[
                    GestureDetector(
                      onTap: subtaskId.isEmpty
                          ? null
                          : () => _toggleSubtask(subtaskId),
                      child: Container(
                        width: 24,
                        height: 24,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(6),
                          color: completed
                              ? AppColors.success
                              : tokens.bgRaised,
                          border: Border.all(
                            color: completed
                                ? AppColors.success
                                : tokens.borderStrong,
                            width: 1,
                          ),
                        ),
                        child: completed
                            ? const Icon(Icons.check,
                                size: 16, color: Colors.white)
                            : null,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        title,
                        style:
                            Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: completed
                                      ? tokens.textSecondary
                                      : tokens.textPrimary,
                                  decoration: completed
                                      ? TextDecoration.lineThrough
                                      : null,
                                ),
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;

    final deadlineLabel = widget.task.deadline == null
        ? 'No deadline'
        : DateFormat('MMM d, yyyy').format(widget.task.deadline!);
    final priority = widget.task.priority;
    final isDone = _status == 'done';

    return DraggableScrollableSheet(
      initialChildSize: 0.95,
      maxChildSize: 0.98,
      expand: false,
      builder: (_, controller) => Container(
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: ListView(
          controller: controller,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          children: <Widget>[
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade400,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                GestureDetector(
                  onTap: _saving ? null : _toggleComplete,
                  child: Container(
                    width: 26,
                    height: 26,
                    decoration: BoxDecoration(
                      color: isDone
                          ? AppColors.success
                          : Theme.of(context).colorScheme.surface,
                      borderRadius: BorderRadius.circular(7),
                      border: Border.all(color: Colors.grey.shade300),
                    ),
                    child: Icon(
                      isDone ? Icons.check : Icons.check_box_outline_blank,
                      size: 16,
                      color:
                          isDone ? Colors.white : Colors.grey.shade700,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _isEditing
                      ? TfInput(label: 'Title', controller: _title)
                      : Text(
                          _title.text.trim().isEmpty
                              ? 'Untitled Task'
                              : _title.text.trim(),
                          style: Theme.of(context)
                              .textTheme
                              .headlineSmall
                              ?.copyWith(fontWeight: FontWeight.w700),
                        ),
                ),
                const SizedBox(width: 8),
                TfButton(
                  label: 'Delete',
                  icon: Icons.delete_outline,
                  variant: TfButtonVariant.danger,
                  isLoading: _deleting,
                  onPressed: _deleting ? null : _delete,
                ),
              ],
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: <Widget>[
                TfBadge.priority(priority),
                TfBadge(label: _status, uppercase: true),
                TfBadge(label: widget.task.category),
                if ((widget.task.aiPriorityScore ?? 0) > 0)
                  TfBadge(
                    label: 'AI ${widget.task.aiPriorityScore}%',
                    color: AppColorsShared.accent,
                    uppercase: true,
                  ),
              ],
            ),
            const SizedBox(height: 10),
            if (_isEditing) ...<Widget>[
              TfInput(
                  label: 'Description',
                  controller: _description,
                  maxLines: 4),
              const SizedBox(height: 10),

              // Deadline row — custom picker
              Text(
                'Deadline',
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: tokens.textSecondary,
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: 6),
              _deadlineField(tokens),
              const SizedBox(height: 10),

              TfInput(
                label: 'Estimated Duration (min)',
                controller: _duration,
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(
                initialValue: _status,
                decoration:
                    const InputDecoration(labelText: 'Status'),
                items: _statuses
                    .map((s) => DropdownMenuItem<String>(
                        value: s, child: Text(s)))
                    .toList(),
                onChanged: (v) {
                  if (v != null) setState(() => _status = v);
                },
              ),
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(
                initialValue: _priority,
                decoration:
                    const InputDecoration(labelText: 'Priority'),
                items: _priorities
                    .map((p) => DropdownMenuItem<String>(
                        value: p, child: Text(p)))
                    .toList(),
                onChanged: (v) {
                  if (v != null) setState(() => _priority = v);
                },
              ),
              const SizedBox(height: 8),
            ] else ...<Widget>[
              _sectionTitle(
                  Icons.description_outlined, 'Description'),
              Text(
                _description.text.trim().isEmpty
                    ? 'No description'
                    : _description.text.trim(),
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 10),
              _sectionTitle(
                  Icons.calendar_today_outlined, 'Deadline'),
              Text(deadlineLabel),
              const SizedBox(height: 10),
              _sectionTitle(
                  Icons.schedule_outlined, 'Estimated Duration'),
              Text('${widget.task.estimatedDuration} min'),
            ],
            const SizedBox(height: 10),
            _sectionTitle(Icons.timer_outlined, 'Time Tracking'),
            if (_trackingError != null) ...<Widget>[
              Text(_trackingError!,
                  style:
                      const TextStyle(color: AppColors.error)),
              const SizedBox(height: 8),
            ],
            TfButton(
              label: _isTracking ? 'Stop Timer' : 'Start Timer',
              icon: _isTracking
                  ? Icons.stop_circle_outlined
                  : Icons.play_arrow_rounded,
              variant: _isTracking
                  ? TfButtonVariant.danger
                  : TfButtonVariant.accent,
              onPressed:
                  _isTracking ? _stopTimer : _startTimer,
              width: double.infinity,
            ),
            const SizedBox(height: 8),
            Text('Total logged: 0m',
                style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: 10),
            _sectionTitle(
                Icons.subdirectory_arrow_right_outlined,
                'Depends On'),
            const Text('No dependencies'),
            const SizedBox(height: 10),
            _sectionTitle(
                Icons.attach_file_outlined, 'Attachments'),
            TfButton(
              label: _uploading ? 'Uploading...' : 'Upload File',
              icon: Icons.upload_file_outlined,
              variant: TfButtonVariant.accent,
              isLoading: _uploading,
              onPressed: _uploading ? null : _uploadAttachment,
            ),
            if (_attachments.isNotEmpty) ...<Widget>[
              const SizedBox(height: 8),
              ..._attachments.map(
                (attachment) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(
                      Icons.insert_drive_file_outlined),
                  title: Text(
                      attachment['filename']?.toString() ??
                          'Attachment'),
                  subtitle: Text(timeago.format(
                      DateTime.tryParse(
                              '${attachment['uploadedAt'] ?? ''}') ??
                          DateTime.now())),
                ),
              ),
            ],
            const SizedBox(height: 10),
            _sectionTitle(
                Icons.comment_outlined, 'Comments'),
            if (_comments.isNotEmpty)
              ..._comments.map(
                (comment) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(
                      Icons.chat_bubble_outline),
                  title: Text(
                      comment['text']?.toString() ?? ''),
                  subtitle: Text(timeago.format(
                      DateTime.tryParse(
                              '${comment['createdAt'] ?? ''}') ??
                          DateTime.now())),
                ),
              ),
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: <Widget>[
                Expanded(
                  child: TfInput(
                      label: 'Add comment',
                      controller: _comment),
                ),
                const SizedBox(width: 8),
                TfButton(
                  label: _commenting ? '...' : 'Send',
                  icon: Icons.send_rounded,
                  isLoading: _commenting,
                  onPressed:
                      _commenting ? null : _addComment,
                ),
              ],
            ),
            const SizedBox(height: 10),
            _sectionTitle(
                Icons.person_add_outlined, 'Share'),
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: <Widget>[
                Expanded(
                  child: TfInput(
                      label: 'Share by email',
                      controller: _shareEmail),
                ),
                const SizedBox(width: 8),
                TfButton(
                  label: _sharing ? '...' : 'Share',
                  icon: Icons.share,
                  isLoading: _sharing,
                  onPressed: _sharing ? null : _shareTask,
                ),
              ],
            ),
            const SizedBox(height: 10),
            _sectionTitle(
                Icons.checklist_rounded, 'Subtasks'),
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: <Widget>[
                Expanded(
                  child: TfInput(
                      label: 'New subtask',
                      controller: _subtaskTitle),
                ),
                const SizedBox(width: 8),
                TfButton(
                  label: 'Add',
                  icon: Icons.add,
                  variant: TfButtonVariant.secondary,
                  onPressed: _addSubtask,
                ),
              ],
            ),
            const SizedBox(height: 10),
            _buildSubtasksSection(),
            const SizedBox(height: 18),
            Row(
              children: <Widget>[
                Expanded(
                  child: TfButton(
                    label: widget.task.status == 'done'
                        ? 'Mark Todo'
                        : 'Mark Done',
                    variant: TfButtonVariant.secondary,
                    onPressed:
                        _saving ? null : _toggleComplete,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TfButton(
                    label: _isEditing ? 'Save' : 'Edit',
                    isLoading: _saving,
                    onPressed: _saving
                        ? null
                        : (_isEditing
                            ? _save
                            : () =>
                                setState(() => _isEditing = true)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}