import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../services/ai_service.dart';
import '../../../../services/project_service.dart';
import '../providers/projects_provider.dart';
import '../../tasks/widgets/task_detail_sheet.dart';

class CreateProjectSheet extends ConsumerStatefulWidget {
  const CreateProjectSheet({super.key});

  @override
  ConsumerState<CreateProjectSheet> createState() => _CreateProjectSheetState();
}

class _CreateProjectSheetState extends ConsumerState<CreateProjectSheet> {
  final _title = TextEditingController();
  final _desc = TextEditingController();
  final _hours = TextEditingController(text: '40');

  String _category = 'Work';
  String _priority = 'medium';
  String _status = 'not-started';
  DateTime? _dueDate;
  bool _saving = false;
  bool _aiEnhancing = false;

  static const _categories = <String>[
    'Work',
    'Personal',
    'Health',
    'Shopping',
    'Learning',
    'Family',
  ];

  static const _priorities = <String>['low', 'medium', 'high', 'urgent'];

  static const _statuses = <String>[
    'not-started',
    'in-progress',
    'on-hold',
  ];

  AppColorTokens _tokens(BuildContext context) {
    return Theme.of(context).extension<AppColorTokens>()!;
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

  String _formatDate(DateTime date) {
    return DateFormat('MMM d, yyyy').format(date);
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

      if (title.toLowerCase().contains('status')) {
        switch (key) {
          case 'not-started':
            return Icons.radio_button_unchecked_rounded;
          case 'in-progress':
            return Icons.autorenew_rounded;
          case 'on-hold':
            return Icons.pause_circle_outline_rounded;
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

      if (title.toLowerCase().contains('status')) {
        switch (key) {
          case 'not-started':
            return tokens.sky;
          case 'in-progress':
            return const Color(0xFFD08D2F);
          case 'on-hold':
            return tokens.rose;
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
                                'Pick one option to keep your project setup clean.',
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

  Future<void> _pickDueDate() async {
    final picked = await showModernDatePicker(
      context: context,
      initialDate: _dueDate,
    );
    if (!mounted) return;
    setState(() => _dueDate = picked);
  }

  Future<void> _aiEnhance() async {
    setState(() => _aiEnhancing = true);
    try {
      final response = await AiService().assistWrite(
        title: _title.text,
        category: _category,
        description: _desc.text,
      );

      var suggestedTitle =
          '${response['suggestedTitle'] ?? response['title'] ?? _title.text}'
              .trim();
      var suggestedDescription =
          '${response['suggestedDescription'] ?? response['description'] ?? _desc.text}'
              .trim();
      var suggestedCategory =
          '${response['suggestedCategory'] ?? response['category'] ?? _category}'
              .trim();

      final estimatedDuration = response['estimatedDuration'] ??
          response['estimated_duration'] ??
          const <String, dynamic>{};
      int? suggestedHours;
      if (estimatedDuration is Map) {
        final durationMap = Map<String, dynamic>.from(estimatedDuration);
        final rawMinutes =
            durationMap['minutes'] ?? durationMap['estimated_minutes'];
        final minutes = int.tryParse('$rawMinutes');
        if (minutes != null) {
          suggestedHours = (minutes / 60).ceil().clamp(1, 9999);
        }
      }

      final complexity =
          '${response['estimatedComplexity'] ?? response['estimated_complexity'] ?? ''}'
              .toLowerCase()
              .trim();
      final suggestedPriority =
          '${response['suggestedPriority'] ?? response['priority'] ?? ''}'
              .toLowerCase()
              .trim();

      if (!mounted) return;
      // Call the same /ai/enhance-project endpoint as web
      try {
        final enhancement = await AiService().enhanceProject(
          _title.text,
          _desc.text,
        );

        final enhancementMap = Map<String, dynamic>.from(enhancement as Map);

        if (enhancementMap['estimated_hours'] != null) {
          final raw = enhancementMap['estimated_hours'];
          final hours =
              int.tryParse('$raw') ?? (raw is num ? raw.toInt() : null);
          if (hours != null) {
            suggestedHours = hours;
          }
        }
        if (enhancementMap['description'] != null) {
          final enhancedDesc = '${enhancementMap['description']}'.trim();
          if (enhancedDesc.isNotEmpty) {
            suggestedDescription = enhancedDesc;
          }
        }
        if (enhancementMap['category'] != null) {
          final enhancedCat = '${enhancementMap['category']}'.trim();
          if (_categories.contains(enhancedCat)) {
            suggestedCategory = enhancedCat;
          }
        }
      } catch (e) {
        // ignore enhancement errors — we still have assistWrite data
      }

      setState(() {
        _title.text = suggestedTitle;
        _desc.text = suggestedDescription;
        if (_categories.contains(suggestedCategory)) {
          _category = suggestedCategory;
        }
        if (suggestedHours != null) {
          _hours.text = suggestedHours.toString();
        }
        if (_priorities.contains(suggestedPriority)) {
          _priority = suggestedPriority;
        } else if (complexity == 'low') {
          _priority = 'low';
        } else if (complexity == 'high') {
          _priority = 'high';
        } else if (complexity == 'urgent') {
          _priority = 'urgent';
        } else if (complexity == 'medium') {
          _priority = 'medium';
        }
      });
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('AI enhance failed: $error')),
      );
    } finally {
      if (mounted) {
        setState(() => _aiEnhancing = false);
      }
    }
  }

  Future<void> _create() async {
    if (_title.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Project name is required')),
      );
      return;
    }

    setState(() => _saving = true);
    try {
      final payload = <String, dynamic>{
        'title': _title.text.trim(),
        'description': _desc.text.trim(),
        'category': _category,
        'priority': _priority,
        'status': _status,
        'dueDate': _dueDate?.toIso8601String(),
        'estimatedHours': int.tryParse(_hours.text.trim()) ?? 40,
      };

      await ProjectService().createProject(payload);

      ref.invalidate(projectsProvider);

      if (!mounted) return;
      final messenger = ScaffoldMessenger.of(context);
      Navigator.of(context).pop();
      messenger.showSnackBar(
        const SnackBar(content: Text('Project created')),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to create project: $error')),
      );
    } finally {
      if (mounted) {
        setState(() => _saving = false);
      }
    }
  }

  @override
  void dispose() {
    _title.dispose();
    _desc.dispose();
    _hours.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tokens = _tokens(context);
    final dueDateText =
        _dueDate == null ? 'No due date' : _formatDate(_dueDate!);

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
                        Icons.folder_rounded,
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
                                  'Create project',
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
                            'Build a clear, organized project with details and deadlines.',
                            style:
                                Theme.of(context).textTheme.bodySmall?.copyWith(
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
                        controller: _title,
                        decoration: _inputDecoration(
                          context,
                          'Project name',
                          hintText: 'e.g. Mobile app launch',
                        ),
                        textAlignVertical: TextAlignVertical.center,
                        enabled: !_saving,
                      ),
                      const SizedBox(height: 10),
                      TextField(
                        controller: _desc,
                        decoration: _inputDecoration(
                          context,
                          'Description',
                          hintText:
                              'Briefly describe the goal, scope, and constraints',
                        ),
                        minLines: 3,
                        maxLines: 5,
                        textAlignVertical: TextAlignVertical.top,
                        enabled: !_saving,
                      ),
                      if (!_aiEnhancing) const SizedBox(height: 10),
                      if (!_aiEnhancing)
                        Align(
                          alignment: Alignment.center,
                          child: FractionallySizedBox(
                            widthFactor: 0.92,
                            child: FilledButton.icon(
                              onPressed: _aiEnhancing ? null : _aiEnhance,
                              icon: const Icon(
                                Icons.auto_awesome_rounded,
                                size: 18,
                              ),
                              label: Text(
                                _aiEnhancing ? 'Enhancing...' : 'AI Enhance',
                              ),
                              style: FilledButton.styleFrom(
                                elevation: 3,
                                backgroundColor: tokens.accent,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 18,
                                  vertical: 14,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
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
                              onTap: _saving ? null : _pickDueDate,
                              borderRadius: BorderRadius.circular(22),
                              child: InputDecorator(
                                decoration:
                                    _inputDecoration(context, 'Due date'),
                                child: Text(
                                  dueDateText,
                                  style: TextStyle(
                                    color: _dueDate == null
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
                              controller: _hours,
                              decoration:
                                  _inputDecoration(context, 'Est. hours'),
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
                      InkWell(
                        onTap: _saving
                            ? null
                            : () async {
                                final picked = await _showSelectionSheet(
                                  context,
                                  title: 'Select status',
                                  options: _statuses,
                                  selected: _status,
                                );
                                if (picked == null) return;
                                setState(() => _status = picked);
                              },
                        borderRadius: BorderRadius.circular(22),
                        child: InputDecorator(
                          decoration: _inputDecoration(context, 'Status'),
                          child: Text(
                            _status,
                            style: TextStyle(
                              color: tokens.textPrimary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                Row(
                  children: <Widget>[
                    Expanded(
                      child: OutlinedButton(
                        onPressed:
                            _saving ? null : () => Navigator.of(context).pop(),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size.fromHeight(52),
                          side: BorderSide(color: tokens.borderMedium),
                          foregroundColor: tokens.textSecondary,
                          backgroundColor:
                              tokens.bgBase.withValues(alpha: 0.04),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
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
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          mainAxisSize: MainAxisSize.min,
                          children: <Widget>[
                            if (_saving) ...<Widget>[
                              SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white.withValues(alpha: 0.92),
                                ),
                              ),
                              const SizedBox(width: 8),
                            ],
                            Text(_saving ? 'Creating...' : 'Create Project'),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
