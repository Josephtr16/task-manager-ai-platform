import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../core/widgets/gradient_background.dart';
import '../../../core/theme/app_theme.dart';
import '../../../services/project_service.dart';
import '../../../services/task_service.dart';
import '../../tasks/widgets/create_task_sheet.dart';
import '../../tasks/widgets/task_detail_sheet.dart';
import '../../tasks/models/task_model.dart';
import '../widgets/ai_breakdown_sheet.dart';

class ProjectDetailScreen extends StatefulWidget {
  const ProjectDetailScreen({super.key, required this.projectId});

  final String projectId;

  @override
  State<ProjectDetailScreen> createState() => _ProjectDetailScreenState();
}

class _ProjectDetailScreenState extends State<ProjectDetailScreen> {
  final ProjectService _projectService = ProjectService();
  final TaskService _taskService = TaskService();
  late Future<Map<String, dynamic>> _projectFuture;

  @override
  void initState() {
    super.initState();
    _projectFuture = _projectService.getProject(widget.projectId);
  }

  void _reloadProject() {
    setState(() {
      _projectFuture = _projectService.getProject(widget.projectId);
    });
  }

  Future<void> _toggleTaskCompletion(Map<String, dynamic> task) async {
    try {
      final taskId = '${task['_id'] ?? task['id'] ?? ''}';
      if (taskId.isEmpty) return;

      final currentStatus = '${task['status'] ?? 'todo'}'.toLowerCase();
      final newStatus = (currentStatus == 'done' || currentStatus == 'completed') ? 'todo' : 'done';

      await _taskService.updateTask(taskId, <String, dynamic>{'status': newStatus});
      _reloadProject();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error updating task: $e')),
      );
    }
  }

  String _formatDate(dynamic value) {
    if (value == null) return 'No due date';
    final parsed = DateTime.tryParse(value.toString());
    if (parsed == null) return value.toString();
    return DateFormat('MMM d, yyyy').format(parsed);
  }

  DateTime? _taskDeadline(Map<String, dynamic> task) {
    final raw = task['deadline'];
    if (raw == null) return null;
    return DateTime.tryParse(raw.toString());
  }

  List<Map<String, dynamic>> _sortByClosestDeadline(List<Map<String, dynamic>> tasks) {
    final sorted = List<Map<String, dynamic>>.from(tasks);
    sorted.sort((left, right) {
      final leftDeadline = _taskDeadline(left);
      final rightDeadline = _taskDeadline(right);

      if (leftDeadline == null && rightDeadline == null) return 0;
      if (leftDeadline == null) return 1;
      if (rightDeadline == null) return -1;
      return leftDeadline.compareTo(rightDeadline);
    });
    return sorted;
  }

  Color _statusColor(String value) {
    switch (value.toLowerCase()) {
      case 'completed':
      case 'done':
        return const Color(0xFF4F8A67);
      case 'in-progress':
      case 'in progress':
        return const Color(0xFFD08D2F);
      case 'blocked':
        return const Color(0xFFC65B4C);
      default:
        return const Color(0xFF9B7B4F);
    }
  }

  Color _priorityColor(String value) {
    switch (value.toLowerCase()) {
      case 'urgent':
        return const Color(0xFFC65B4C);
      case 'high':
        return const Color(0xFFD08D2F);
      case 'medium':
        return const Color(0xFF5A7FA0);
      case 'low':
        return const Color(0xFF4F8A67);
      default:
        return const Color(0xFF5A7FA0);
    }
  }

  Color _hoursColor(double? hours) {
    if (hours == null || hours == 0) {
      return const Color(0xFF7C634A);
    }
    if (hours <= 4) {
      return const Color(0xFF4F8A67);
    } else if (hours <= 12) {
      return const Color(0xFFD08D2F);
    } else {
      return const Color(0xFFC65B4C);
    }
  }

  AppColorTokens _tokens(BuildContext context) {
    return Theme.of(context).extension<AppColorTokens>() ??
        AppTheme.lightTokens;
  }

  Widget _sectionTitle(BuildContext context, String title, {String? subtitle}) {
    return Text(
      subtitle == null ? title : '$title\n$subtitle',
      style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w800,
            height: subtitle == null ? 1.2 : 1.4,
          ),
    );
  }

  Widget _metricCard(BuildContext context,
      {required IconData icon, required String label, required String value}) {
    final theme = Theme.of(context);
    final tokens = _tokens(context);
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: tokens.bgRaised.withValues(alpha: 0.85),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: tokens.borderSubtle),
        boxShadow: const [
          BoxShadow(
              color: Color(0x0D000000), blurRadius: 10, offset: Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Icon(icon, size: 16, color: tokens.accent),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  label,
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: tokens.textSecondary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w800,
              color: tokens.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _chip(String text, {Color? backgroundColor, Color? textColor}) {
    return Builder(
      builder: (context) {
        final tokens = _tokens(context);
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: backgroundColor ?? tokens.bgSurface.withValues(alpha: 0.6),
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: tokens.borderSubtle),
          ),
          child: Text(
            text,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: textColor ?? tokens.textSecondary,
            ),
          ),
        );
      },
    );
  }

  Widget _settingsSection(
    BuildContext context, {
    required String title,
    required Widget child,
  }) {
    final tokens = _tokens(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: tokens.bgRaised.withValues(alpha: 0.92),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: tokens.borderSubtle),
        boxShadow: const [
          BoxShadow(
            color: Color(0x12000000),
            blurRadius: 16,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            title,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.4,
              color: tokens.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }

  InputDecoration _settingsInputDecoration(String label, {String? hintText}) {
    final tokens = _tokens(context);
    return InputDecoration(
      labelText: label,
      hintText: hintText,
      filled: true,
      fillColor: tokens.bgSurface,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(20),
        borderSide: BorderSide(color: tokens.borderSubtle),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(20),
        borderSide: BorderSide(color: tokens.borderSubtle),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(20),
        borderSide: BorderSide(color: tokens.accent, width: 1.4),
      ),
      labelStyle: TextStyle(
        color: tokens.textSecondary,
        fontWeight: FontWeight.w700,
      ),
    );
  }

  Widget _compactSettingTile({
    required BuildContext context,
    required String label,
    required String value,
    required IconData icon,
    required VoidCallback onTap,
    Color? accentColor,
    Widget? trailing,
  }) {
    final tokens = _tokens(context);
    final color = accentColor ?? tokens.accent;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: tokens.bgSurface,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: tokens.borderSubtle),
            boxShadow: const [
              BoxShadow(
                color: Color(0x08000000),
                blurRadius: 8,
                offset: Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              Row(
                children: <Widget>[
                  Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(icon, size: 14, color: color),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: tokens.textSecondary,
                      ),
                    ),
                  ),
                  trailing ??
                      Icon(
                        Icons.keyboard_arrow_down_rounded,
                        size: 18,
                        color: color,
                      ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                value,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: tokens.textPrimary,
                ),
              ),
            ],
          ),
        ),
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

      switch (key) {
        case 'completed':
        case 'done':
          return Icons.check_circle_outline_rounded;
        case 'in-progress':
        case 'in progress':
          return Icons.autorenew_rounded;
        case 'not-started':
        case 'not started':
          return Icons.radio_button_unchecked_rounded;
        case 'blocked':
          return Icons.block_rounded;
        default:
          return Icons.circle_outlined;
      }
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

      switch (key) {
        case 'completed':
        case 'done':
          return tokens.sage;
        case 'in-progress':
        case 'in progress':
          return const Color(0xFFD08D2F);
        case 'blocked':
          return tokens.rose;
        default:
          return tokens.accent;
      }
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
                  const SizedBox(height: 14),
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
                                'Pick one option to keep the project setup clean and consistent.',
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
                  const SizedBox(height: 14),
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
                                      isSelected
                                          ? Icons.check_rounded
                                        : null,
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

  Widget _taskCard(BuildContext context, Map<String, dynamic> task) {
    final status = '${task['status'] ?? 'todo'}';
    final due = task['deadline'] == null ? null : _formatDate(task['deadline']);
    final completed =
        status.toLowerCase() == 'done' || status.toLowerCase() == 'completed';
    final tokens = _tokens(context);
    final priority = '${task['priority'] ?? 'medium'}';
    final title = '${task['title'] ?? 'Untitled task'}'.trim();
    final description = '${task['description'] ?? ''}'.trim();
    final taskModel = TaskModel.fromJson(task);
    final estimatedHours = double.tryParse('${task['estimatedHours'] ?? 0}') ?? 0;

    return Material(
      color: Colors.transparent,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: tokens.bgRaised.withValues(alpha: 0.96),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: tokens.borderSubtle),
          boxShadow: const [
            BoxShadow(
              color: Color(0x12000000),
              blurRadius: 14,
              offset: Offset(0, 6),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            GestureDetector(
              onTap: () => _toggleTaskCompletion(task),
              child: Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: completed
                      ? const Color(0xFF4F8A67)
                      : Colors.transparent,
                  border: Border.all(
                    color: completed
                        ? const Color(0xFF4F8A67)
                        : const Color(0xFFD0D0D0),
                    width: 2,
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: completed
                    ? const Icon(
                        Icons.check_rounded,
                        size: 16,
                        color: Colors.white,
                      )
                    : null,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Expanded(
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            onTap: () {
                              showModalBottomSheet<void>(
                                context: context,
                                isScrollControlled: true,
                                backgroundColor: Colors.transparent,
                                builder: (_) => TaskDetailSheet(task: taskModel),
                              ).then((_) => _reloadProject());
                            },
                            borderRadius: BorderRadius.circular(12),
                            child: Text(
                              title,
                              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: -0.2,
                                    color: completed
                                        ? tokens.textSecondary
                                        : tokens.textPrimary,
                                    decoration: completed
                                        ? TextDecoration.lineThrough
                                        : TextDecoration.none,
                                  ),
                            ),
                          ),
                        ),
                      ),
                      Icon(
                        Icons.chevron_right_rounded,
                        size: 22,
                        color: tokens.textMuted,
                      ),
                    ],
                  ),
                  if (description.isNotEmpty) ...<Widget>[
                    const SizedBox(height: 6),
                    Text(
                      description,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            height: 1.45,
                            color: tokens.textSecondary,
                          ),
                    ),
                  ],
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: <Widget>[
                      _chip('Status: $status'),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: _priorityColor(priority).withValues(alpha: 0.14),
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(
                            color: _priorityColor(priority).withValues(alpha: 0.28),
                          ),
                        ),
                        child: Text(
                          'Priority: ${priority.toUpperCase()}',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            color: _priorityColor(priority),
                          ),
                        ),
                      ),
                      if (estimatedHours > 0)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: _hoursColor(estimatedHours).withValues(alpha: 0.14),
                            borderRadius: BorderRadius.circular(999),
                            border: Border.all(
                              color: _hoursColor(estimatedHours).withValues(alpha: 0.28),
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: <Widget>[
                              Icon(
                                Icons.schedule_rounded,
                                size: 13,
                                color: _hoursColor(estimatedHours),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                '${estimatedHours.toStringAsFixed(1)}h',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w800,
                                  color: _hoursColor(estimatedHours),
                                ),
                              ),
                            ],
                          ),
                        ),
                      if (due != null) _chip('Due: $due'),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _openProjectSettings(Map<String, dynamic> project) async {
    final titleController =
        TextEditingController(text: '${project['title'] ?? ''}');
    final descriptionController =
        TextEditingController(text: '${project['description'] ?? ''}');
    final estimatedHoursController =
        TextEditingController(text: '${project['estimatedTotalHours'] ?? ''}');
    const categoryOptions = <String>[
      'Work',
      'Personal',
      'Health',
      'Shopping',
      'Learning',
      'Family'
    ];
    const priorityOptions = <String>['low', 'medium', 'high', 'urgent'];
    const statusOptions = <String>['not-started', 'in-progress', 'completed'];

    final initialCategory =
        categoryOptions.contains('${project['category'] ?? ''}')
            ? '${project['category']}'
            : 'Work';
    final initialPriority =
        priorityOptions.contains('${project['priority'] ?? ''}')
            ? '${project['priority']}'
            : 'medium';
    final initialStatus = statusOptions.contains('${project['status'] ?? ''}')
        ? '${project['status']}'
        : 'not-started';
    final parsedDueDate = DateTime.tryParse('${project['dueDate'] ?? ''}');
    final tokens = _tokens(context);

    String selectedCategory = initialCategory;
    String selectedPriority = initialPriority;
    String selectedStatus = initialStatus;
    DateTime? selectedDueDate = parsedDueDate;

    try {
      if (!mounted) return;

      await showDialog<bool>(
        context: context,
        builder: (dialogContext) {
          var saving = false;

          return StatefulBuilder(
            builder: (context, setDialogState) {
              Future<void> saveProject() async {
                final title = titleController.text.trim();
                final description = descriptionController.text.trim();
                final estimatedHoursText = estimatedHoursController.text.trim();
                final estimatedTotalHours = estimatedHoursText.isEmpty
                    ? 0
                    : double.tryParse(estimatedHoursText);

                if (title.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                      content: Text('Project name cannot be empty.')));
                  return;
                }

                if (estimatedTotalHours == null) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                      content:
                          Text('Estimated total hours must be a number.')));
                  return;
                }

                setDialogState(() => saving = true);
                try {
                  await _projectService
                      .updateProject(widget.projectId, <String, dynamic>{
                    'title': title,
                    'description': description,
                    'category': selectedCategory,
                    'priority': selectedPriority,
                    'status': selectedStatus,
                    'dueDate': selectedDueDate?.toIso8601String(),
                    'estimatedTotalHours': estimatedTotalHours,
                  });
                  if (!context.mounted) return;
                  Navigator.of(dialogContext).pop(true);
                  if (mounted) _reloadProject();
                } catch (error) {
                  setDialogState(() => saving = false);
                  if (!context.mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                      content: Text('Failed to save project settings.')));
                }
              }

              return Dialog(
                backgroundColor: Colors.transparent,
                insetPadding: const EdgeInsets.all(14),
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: <Color>[
                        tokens.bgSurface,
                        tokens.bgRaised.withValues(alpha: 0.98)
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(30),
                    border: Border.all(color: tokens.borderSubtle),
                    boxShadow: const [
                      BoxShadow(
                          color: Color(0x26000000),
                          blurRadius: 28,
                          offset: Offset(0, 14))
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(30),
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.fromLTRB(18, 18, 18, 20),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: <Widget>[
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: tokens.accent.withValues(alpha: 0.10),
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Icon(Icons.tune_rounded,
                                    color: tokens.accent),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: <Widget>[
                                    Text(
                                      'Project settings',
                                      style: Theme.of(context)
                                          .textTheme
                                          .titleLarge
                                          ?.copyWith(
                                              fontWeight: FontWeight.w900,
                                              color: tokens.textPrimary),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'Shape the scope, timing, and ownership of the work.',
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodySmall
                                          ?.copyWith(
                                              color: tokens.textSecondary,
                                              height: 1.35),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              IconButton(
                                onPressed: saving
                                    ? null
                                    : () => Navigator.of(dialogContext).pop(),
                                icon: const Icon(Icons.close_rounded),
                                color: tokens.textSecondary,
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          _settingsSection(
                            dialogContext,
                            title: 'Basics',
                            child: Column(
                              children: <Widget>[
                                TextField(
                                  controller: titleController,
                                  decoration: _settingsInputDecoration(
                                        'Project name',
                                        hintText: 'Name the work clearly and precisely'),
                                ),
                                const SizedBox(height: 12),
                                TextField(
                                  controller: descriptionController,
                                  decoration: _settingsInputDecoration(
                                      'Project summary',
                                      hintText: 'Describe the goal and expected outcome'),
                                  minLines: 4,
                                  maxLines: 6,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 12),
                          _settingsSection(
                            dialogContext,
                            title: 'Settings',
                            child: GridView.count(
                              crossAxisCount: 2,
                              crossAxisSpacing: 8,
                              mainAxisSpacing: 8,
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              childAspectRatio: 2.05,
                              children: <Widget>[
                                _compactSettingTile(
                                  context: dialogContext,
                                  label: 'Focus area',
                                  value: selectedCategory,
                                  icon: Icons.folder_rounded,
                                  accentColor: tokens.accent,
                                  onTap: () async {
                                    final picked = await _showSelectionSheet(
                                        dialogContext,
                                        title: 'Select category',
                                        options: categoryOptions,
                                        selected: selectedCategory);
                                    if (picked == null) return;
                                    setDialogState(
                                        () => selectedCategory = picked);
                                  },
                                ),
                                _compactSettingTile(
                                  context: dialogContext,
                                  label: 'Urgency',
                                  value: selectedPriority,
                                  icon: Icons.flag_rounded,
                                  accentColor: _priorityColor(selectedPriority),
                                  onTap: () async {
                                    final picked = await _showSelectionSheet(
                                        dialogContext,
                                        title: 'Select priority',
                                        options: priorityOptions,
                                        selected: selectedPriority);
                                    if (picked == null) return;
                                    setDialogState(
                                        () => selectedPriority = picked);
                                  },
                                ),
                                _compactSettingTile(
                                  context: dialogContext,
                                  label: 'Progress state',
                                  value: selectedStatus,
                                  icon: Icons.verified_rounded,
                                  accentColor: _statusColor(selectedStatus),
                                  onTap: () async {
                                    final picked = await _showSelectionSheet(
                                        dialogContext,
                                        title: 'Select status',
                                        options: statusOptions,
                                        selected: selectedStatus);
                                    if (picked == null) return;
                                    setDialogState(
                                        () => selectedStatus = picked);
                                  },
                                ),
                                _compactSettingTile(
                                  context: dialogContext,
                                  label: 'Target date',
                                  value: selectedDueDate == null
                                      ? 'No due date'
                                      : DateFormat('MMM d, yyyy')
                                          .format(selectedDueDate!),
                                  icon: Icons.calendar_month_rounded,
                                  accentColor: tokens.accent,
                                  onTap: () async {
                                    final pickedDate = await showDatePicker(
                                      context: dialogContext,
                                      initialDate:
                                          selectedDueDate ?? DateTime.now(),
                                      firstDate: DateTime(2000),
                                      lastDate: DateTime(2100),
                                    );
                                    if (pickedDate == null) return;
                                    setDialogState(
                                        () => selectedDueDate = pickedDate);
                                  },
                                  trailing: selectedDueDate == null
                                      ? null
                                      : TextButton(
                                          style: TextButton.styleFrom(
                                            padding: EdgeInsets.zero,
                                            minimumSize: const Size(0, 24),
                                            tapTargetSize: MaterialTapTargetSize
                                                .shrinkWrap,
                                          ),
                                          onPressed: () => setDialogState(
                                              () => selectedDueDate = null),
                                          child: const Text('Clear'),
                                        ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 12),
                          _settingsSection(
                            dialogContext,
                            title: 'Estimate',
                            child: TextField(
                              controller: estimatedHoursController,
                              decoration: _settingsInputDecoration(
                                  'Estimated hours',
                                  hintText: 'Approximate time investment'),
                              keyboardType:
                                  const TextInputType.numberWithOptions(
                                      decimal: true),
                            ),
                          ),
                          const SizedBox(height: 16),
                          Row(
                            children: <Widget>[
                              Expanded(
                                child: OutlinedButton(
                                  onPressed: saving
                                      ? null
                                      : () => Navigator.of(dialogContext).pop(),
                                  style: OutlinedButton.styleFrom(
                                    minimumSize: const Size.fromHeight(50),
                                    side:
                                        BorderSide(color: tokens.borderMedium),
                                    foregroundColor: tokens.textSecondary,
                                    shape: RoundedRectangleBorder(
                                        borderRadius:
                                            BorderRadius.circular(18)),
                                  ),
                                  child: const Text('Cancel'),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: FilledButton(
                                  onPressed: saving ? null : saveProject,
                                  style: FilledButton.styleFrom(
                                    minimumSize: const Size.fromHeight(50),
                                    backgroundColor: tokens.accent,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(
                                        borderRadius:
                                            BorderRadius.circular(18)),
                                  ),
                                  child: Text(
                                      saving ? 'Saving...' : 'Save changes'),
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
        },
      );
    } finally {
      titleController.dispose();
      descriptionController.dispose();
      estimatedHoursController.dispose();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F0E8),
      appBar: AppBar(
        title: const Text('Project Detail'),
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
      ),
      body: GradientBackground(
        child: FutureBuilder<Map<String, dynamic>>(
          future: _projectFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }

            if (snapshot.hasError) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text(
                    'Failed to load project details.',
                    style: Theme.of(context).textTheme.titleMedium,
                    textAlign: TextAlign.center,
                  ),
                ),
              );
            }

            final data = snapshot.data ?? const <String, dynamic>{};
            final project = data['project'] is Map
                ? Map<String, dynamic>.from(data['project'] as Map)
                : const <String, dynamic>{};
            final tasks = _sortByClosestDeadline((data['tasks'] as List? ?? const <dynamic>[])
                .whereType<Map>()
                .map((task) => Map<String, dynamic>.from(task))
              .toList());
            final collaborators = (project['collaborators'] as List? ??
                    const <dynamic>[])
                .whereType<Map>()
                .map((collaborator) => Map<String, dynamic>.from(collaborator))
                .toList();
            final projectTitle = '${project['title'] ?? 'Project'}';
            final description =
                '${project['description'] ?? 'A dedicated workspace for tracking project work.'}';
            final status = '${project['status'] ?? 'not-started'}';
            final priority = '${project['priority'] ?? 'medium'}';
            final progress = int.tryParse('${project['progress'] ?? 0}') ?? 0;
            final totalTasks =
                int.tryParse('${project['totalTasks'] ?? tasks.length}') ??
                    tasks.length;
            final completedTasks =
                int.tryParse('${project['completedTasks'] ?? 0}') ?? 0;
            final pendingInviteCount =
                ((project['pendingInvites'] as List?) ?? const <dynamic>[])
                    .length;
            final dueDate = _formatDate(project['dueDate']);
            final estimatedHours = double.tryParse('${project['estimatedTotalHours'] ?? 0}') ?? 0;
            final tokens = _tokens(context);

            return ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              children: <Widget>[
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(28),
                    gradient: LinearGradient(
                      colors: <Color>[
                        tokens.bgRaised,
                        tokens.bgSurface,
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    border: Border.all(color: tokens.borderSubtle),
                    boxShadow: const [
                      BoxShadow(
                          color: Color(0x12000000),
                          blurRadius: 20,
                          offset: Offset(0, 8)),
                    ],
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
                                Text(
                                  projectTitle,
                                  style: Theme.of(context)
                                      .textTheme
                                      .headlineSmall
                                      ?.copyWith(
                                        fontWeight: FontWeight.w900,
                                        color: tokens.textPrimary,
                                      ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  description,
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodyMedium
                                      ?.copyWith(
                                        color: tokens.textSecondary,
                                        height: 1.55,
                                      ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          Container(
                            decoration: BoxDecoration(
                              color: tokens.bgSurface.withValues(alpha: 0.8),
                              borderRadius: BorderRadius.circular(16),
                              border:
                                  Border.all(color: tokens.borderSubtle),
                            ),
                            child: IconButton(
                              tooltip: 'Project settings',
                              icon: Icon(Icons.more_vert_rounded,
                                  color: tokens.accent),
                              onPressed: () => _openProjectSettings(project),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        children: <Widget>[
                          _chip('Status: ${status.replaceAll('-', ' ')}',
                              backgroundColor:
                                  _statusColor(status).withValues(alpha: 0.14),
                              textColor: _statusColor(status)),
                          _chip('Priority: $priority',
                              backgroundColor: _priorityColor(priority)
                                  .withValues(alpha: 0.14),
                              textColor: _priorityColor(priority)),
                          _chip('Due: $dueDate'),
                        ],
                      ),
                      const SizedBox(height: 18),
                      Row(
                        children: <Widget>[
                          Expanded(
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(999),
                              child: LinearProgressIndicator(
                                minHeight: 8,
                                value:
                                    (progress / 100).clamp(0.0, 1.0).toDouble(),
                                backgroundColor: tokens.bgSurface.withValues(alpha: 0.4),
                                valueColor: AlwaysStoppedAnimation<Color>(
                                    _priorityColor(priority)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Text(
                            '$progress%',
                            style: Theme.of(context)
                                .textTheme
                                .titleSmall
                                ?.copyWith(
                                  fontWeight: FontWeight.w800,
                                  color: tokens.textPrimary,
                                ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                GridView.count(
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  childAspectRatio: 1.5,
                  children: <Widget>[
                    _metricCard(context,
                        icon: Icons.task_alt_rounded,
                        label: 'Tasks',
                        value: '$completedTasks / $totalTasks'),
                    _metricCard(context,
                        icon: Icons.schedule_rounded,
                        label: 'Estimated Hours',
                        value: estimatedHours > 0
                            ? '${estimatedHours.toStringAsFixed(1)}h'
                            : 'Not set'),
                    _metricCard(context,
                        icon: Icons.mail_outline_rounded,
                        label: 'Pending Invites',
                        value: '$pendingInviteCount'),
                    _metricCard(context,
                        icon: Icons.calendar_today_rounded,
                        label: 'Due Date',
                        value: dueDate),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Project ID: ${widget.projectId}',
                  style: Theme.of(context)
                      .textTheme
                      .bodySmall
                      ?.copyWith(color: const Color(0xFF8A7661)),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.72),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: const Color(0xFFE8DCCB)),
                    boxShadow: const [
                      BoxShadow(
                          color: Color(0x0D000000),
                          blurRadius: 12,
                          offset: Offset(0, 5)),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      _sectionTitle(context, 'Collaborators',
                          subtitle: 'People with access to this project'),
                      const SizedBox(height: 12),
                      if (collaborators.isEmpty)
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          child: Text(
                            'No collaborators yet. Invite people to work together here.',
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(color: const Color(0xFF7F6B56)),
                          ),
                        )
                      else
                        ...collaborators.map(
                          (collaborator) => Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: ListTile(
                              dense: true,
                              contentPadding: EdgeInsets.zero,
                              leading: CircleAvatar(
                                backgroundColor: const Color(0xFFF2E3D2),
                                child: Text(
                                  '${('${collaborator['name'] ?? collaborator['email'] ?? 'U'}').characters.first.toUpperCase()}',
                                  style: const TextStyle(
                                      color: Color(0xFF7C634A),
                                      fontWeight: FontWeight.w800),
                                ),
                              ),
                              title: Text(
                                '${collaborator['name'] ?? collaborator['email'] ?? 'User'}',
                                style: const TextStyle(
                                    fontWeight: FontWeight.w700),
                              ),
                              subtitle: Text(
                                  '${collaborator['permission'] ?? 'view'}'),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFBF7F1),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: const Color(0xFFE8DCCB)),
                    boxShadow: const [
                      BoxShadow(
                          color: Color(0x10000000),
                          blurRadius: 14,
                          offset: Offset(0, 6)),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Row(
                        children: <Widget>[
                          Expanded(
                            child: _sectionTitle(context, 'Tasks',
                                subtitle: 'What this project is made of'),
                          ),
                          const SizedBox(width: 12),
                          TextButton.icon(
                            onPressed: () => showModalBottomSheet<void>(
                              context: context,
                              isScrollControlled: true,
                              backgroundColor: Colors.transparent,
                              builder: (_) => CreateTaskSheet(
                                projectId: widget.projectId,
                              ),
                            ),
                            icon: const Icon(Icons.add_rounded),
                            label: const Text('Add Task'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      if (tasks.isEmpty)
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          child: Text(
                            'No tasks for this project yet. Add one to get started.',
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(color: const Color(0xFF7F6B56)),
                          ),
                        )
                      else
                        ...tasks.map(
                          (task) => Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: _taskCard(context, task),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: <Color>[Color(0xFFD08D2F), Color(0xFFB8772A)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: const [
                      BoxShadow(
                          color: Color(0x332A1A08),
                          blurRadius: 18,
                          offset: Offset(0, 8)),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Row(
                        children: <Widget>[
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.18),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.smart_toy_outlined,
                                color: Colors.white, size: 18),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'AI can turn this project into a structured task plan.',
                              style: Theme.of(context)
                                  .textTheme
                                  .titleSmall
                                  ?.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w800,
                                  ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton.icon(
                          style: FilledButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: const Color(0xFF8C5B1F),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            textStyle:
                                const TextStyle(fontWeight: FontWeight.w800),
                          ),
                          onPressed: () => showModalBottomSheet<void>(
                            context: context,
                            isScrollControlled: true,
                            backgroundColor: Colors.transparent,
                            builder: (_) => AiBreakdownSheet(
                              projectId: widget.projectId,
                              project: project,
                              onTasksCreated: _reloadProject,
                            ),
                          ),
                          icon: const Icon(Icons.auto_awesome_rounded),
                          label: const Text('Generate Tasks with AI'),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
