import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/tf_input.dart';
import '../../../../services/ai_service.dart';
import '../../../../services/project_service.dart';
import '../providers/projects_provider.dart';

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

  InputDecoration _fieldDecoration(String label, {String? hintText}) {
    return InputDecoration(
      labelText: label,
      hintText: hintText,
      filled: true,
      fillColor: const Color(0xFFF9F6F1),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(20),
        borderSide: const BorderSide(color: Color(0xFFE4D3BD)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(20),
        borderSide: const BorderSide(color: Color(0xFFE4D3BD)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(20),
        borderSide: const BorderSide(color: Color(0xFFD08D2F), width: 1.4),
      ),
      labelStyle: const TextStyle(
        color: Color(0xFF7C634A),
        fontWeight: FontWeight.w700,
      ),
    );
  }

  String _formatDate(DateTime date) {
    return DateFormat('MMM d, yyyy').format(date);
  }

  Color _categoryColor(String category) {
    switch (category.toLowerCase()) {
      case 'work':
        return AppSemanticColors.primary;
      case 'personal':
        return AppSemanticColors.sky;
      case 'health':
        return AppSemanticColors.rose;
      case 'shopping':
        return AppSemanticColors.sage;
      case 'learning':
        return AppSemanticColors.copper;
      case 'family':
        return const Color(0xFF6E7BC7);
      default:
        return AppSemanticColors.primary;
    }
  }

  Color _priorityColor(String priority) {
    switch (priority.toLowerCase()) {
      case 'low':
        return AppSemanticColors.sage;
      case 'medium':
        return AppSemanticColors.sky;
      case 'high':
        return const Color(0xFFD08D2F);
      case 'urgent':
        return AppSemanticColors.rose;
      default:
        return AppSemanticColors.primary;
    }
  }

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'not-started':
        return AppSemanticColors.sky;
      case 'in-progress':
        return const Color(0xFFD08D2F);
      case 'on-hold':
        return AppSemanticColors.rose;
      default:
        return AppSemanticColors.sky;
    }
  }

  Widget _choiceChip({
    required AppColorTokens tokens,
    required String label,
    required bool selected,
    required Color accent,
    required VoidCallback? onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: selected
                ? accent.withValues(alpha: 0.10)
                : tokens.bgRaised.withValues(alpha: 0.76),
            borderRadius: BorderRadius.circular(999),
            border: Border.all(
              color: selected
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
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: accent,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: tokens.textPrimary,
                  ),
                ),
              ),
              if (selected) ...<Widget>[
                const SizedBox(width: 6),
                Icon(
                  Icons.check_rounded,
                  size: 16,
                  color: accent,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _pickDueDate() async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: _dueDate ?? now,
      firstDate: DateTime(now.year - 1),
      lastDate: DateTime(now.year + 5),
    );
    if (date == null) return;
    if (!mounted) return;
    setState(() => _dueDate = date);
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
        final rawMinutes = durationMap['minutes'] ?? durationMap['estimated_minutes'];
        final minutes = int.tryParse('$rawMinutes');
        if (minutes != null) {
          suggestedHours = (minutes / 60).ceil().clamp(1, 9999);
        }
      }

      final complexity =
          '${response['estimatedComplexity'] ?? response['estimated_complexity'] ?? ''}'
              .toLowerCase()
              .trim();
      final suggestedPriority = '${response['suggestedPriority'] ?? response['priority'] ?? ''}'
          .toLowerCase()
          .trim();

      if (!mounted) return;
      // Call the same /ai/enhance-project endpoint as web
      try {
        final enhancement = await AiService().enhanceProject(
          _title.text,
          _desc.text,
        );

        if (enhancement is Map && enhancement['estimated_hours'] != null) {
          final raw = enhancement['estimated_hours'];
          final hours = int.tryParse('$raw') ?? (raw is num ? raw.toInt() : null);
          if (hours != null) {
            suggestedHours = hours;
          }
        }
        if (enhancement is Map && enhancement['description'] != null) {
          final enhancedDesc = '${enhancement['description']}'.trim();
          if (enhancedDesc.isNotEmpty) {
            suggestedDescription = enhancedDesc;
          }
        }
        if (enhancement is Map && enhancement['category'] != null) {
          final enhancedCat = '${enhancement['category']}'.trim();
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

  String? _extractProjectId(Map<String, dynamic> response) {
    final project = response['project'];
    if (project is Map) {
      final projectMap = Map<String, dynamic>.from(project);
      final value = projectMap['id'] ?? projectMap['_id'];
      if (value != null) return value.toString();
    }

    final directValue = response['id'] ?? response['_id'];
    if (directValue != null) return directValue.toString();
    return null;
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

      final response = await ProjectService().createProject(payload);
      final projectId = _extractProjectId(response);

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
    final AppColorTokens tokens =
        Theme.of(context).extension<AppColorTokens>()!;
    final dueDateText =
        _dueDate == null ? 'No due date' : _formatDate(_dueDate!);

    return DraggableScrollableSheet(
      initialChildSize: 0.95,
      maxChildSize: 0.98,
      expand: false,
      builder: (_, controller) => Container(
        decoration: BoxDecoration(
          color: tokens.bgBase,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
          child: ListView(
            controller: controller,
            children: <Widget>[
              const SizedBox(height: 10),
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
              const SizedBox(height: 16),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppSemanticColors.accentDim,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Icon(
                      Icons.folder_rounded,
                      color: AppSemanticColors.primary,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Text(
                          'Create project',
                          style:
                              Theme.of(context).textTheme.titleLarge?.copyWith(
                                    fontWeight: FontWeight.w700,
                                    color: tokens.textPrimary,
                                  ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Start organizing with a new project',
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: tokens.textSecondary,
                                    height: 1.35,
                                  ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    onPressed:
                        _saving ? null : () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close_rounded),
                    color: tokens.textSecondary,
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Container(
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
                      'Details',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.4,
                        color: tokens.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    TfInput(
                      controller: _title,
                      hint: 'Project name',
                      enabled: !_saving,
                    ),
                    const SizedBox(height: 8),
                    TfInput(
                      controller: _desc,
                      hint: 'Description',
                      maxLines: 3,
                      enabled: !_saving,
                    ),
                    const SizedBox(height: 10),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                        onPressed: _aiEnhancing ? null : _aiEnhance,
                        icon: const Icon(Icons.auto_awesome_rounded),
                        label:
                            Text(_aiEnhancing ? 'Enhancing...' : 'AI Enhance'),
                        style: FilledButton.styleFrom(
                          backgroundColor: tokens.accent,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 14,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
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
                      'Settings',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.4,
                        color: tokens.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: <Widget>[
                        Expanded(
                          child: InkWell(
                            onTap: _saving ? null : _pickDueDate,
                            borderRadius: BorderRadius.circular(20),
                            child: InputDecorator(
                              decoration: _fieldDecoration('Due date'),
                              child: Text(dueDateText),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TfInput(
                            label: 'Est. hours',
                            controller: _hours,
                            keyboardType: TextInputType.number,
                            enabled: !_saving,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _categories.map((category) {
                        final selected = _category == category;
                        return _choiceChip(
                          tokens: tokens,
                          label: category,
                          selected: selected,
                          accent: _categoryColor(category),
                          onTap: _saving
                              ? null
                              : () => setState(() => _category = category),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'PRIORITY',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.2,
                        color: tokens.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: <Widget>[
                        Expanded(
                          child: _choiceChip(
                            tokens: tokens,
                            label: 'Low',
                            selected: _priority == 'low',
                            accent: _priorityColor('low'),
                            onTap: _saving
                                ? null
                                : () => setState(() => _priority = 'low'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _choiceChip(
                            tokens: tokens,
                            label: 'Medium',
                            selected: _priority == 'medium',
                            accent: _priorityColor('medium'),
                            onTap: _saving
                                ? null
                                : () => setState(() => _priority = 'medium'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _choiceChip(
                            tokens: tokens,
                            label: 'High',
                            selected: _priority == 'high',
                            accent: _priorityColor('high'),
                            onTap: _saving
                                ? null
                                : () => setState(() => _priority = 'high'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _choiceChip(
                            tokens: tokens,
                            label: 'Urgent',
                            selected: _priority == 'urgent',
                            accent: _priorityColor('urgent'),
                            onTap: _saving
                                ? null
                                : () => setState(() => _priority = 'urgent'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: <Widget>[
                  Expanded(
                    child: OutlinedButton(
                      onPressed:
                          _saving ? null : () => Navigator.of(context).pop(),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size.fromHeight(50),
                        side: BorderSide(color: tokens.borderMedium),
                        foregroundColor: tokens.textSecondary,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(18),
                        ),
                      ),
                      child: const Text('Cancel'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: FilledButton(
                      onPressed: _saving ? null : _create,
                      style: FilledButton.styleFrom(
                        minimumSize: const Size.fromHeight(50),
                        backgroundColor: tokens.accent,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(18),
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
      ),
    );
  }
}
