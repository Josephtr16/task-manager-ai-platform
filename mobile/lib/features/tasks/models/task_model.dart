class TaskModel {
  const TaskModel({
    required this.id,
    required this.title,
    this.description,
    this.status = 'todo',
    this.priority = 'medium',
    this.category = 'Work',
    this.deadline,
    this.estimatedDuration = 0,
    this.aiPriorityScore,
    this.projectName,
    this.totalSubtasks = 0,
    this.completedSubtasks = 0,
    this.attachments = const <Map<String, dynamic>>[],
    this.comments = const <Map<String, dynamic>>[],
    this.subtasks = const <Map<String, dynamic>>[],
  });

  final String id;
  final String title;
  final String? description;
  final String status;
  final String priority;
  final String category;
  final DateTime? deadline;
  final int estimatedDuration;
  final int? aiPriorityScore;
  final String? projectName;
  final int totalSubtasks;
  final int completedSubtasks;
  final List<Map<String, dynamic>> attachments;
  final List<Map<String, dynamic>> comments;
  final List<Map<String, dynamic>> subtasks;

  factory TaskModel.fromJson(Map<String, dynamic> json) {
    DateTime? parseDeadline(dynamic raw) {
      if (raw == null) return null;
      final text = raw.toString().trim();
      if (text.isEmpty) return null;

      final parsed = DateTime.tryParse(text);
      if (parsed == null) return null;
      final local = parsed.toLocal();
      return DateTime(local.year, local.month, local.day);
    }

    int? parseScore(dynamic raw) {
      if (raw == null) return null;
      if (raw is num) return raw.round();
      final text = raw.toString().trim();
      if (text.isEmpty) return null;
      final direct = int.tryParse(text);
      if (direct != null) return direct;
      final match = RegExp(r'(\d{1,3})').firstMatch(text);
      return int.tryParse(match?.group(1) ?? '');
    }

    final subtasksRaw = json['subtasks'];
    final subtasks = subtasksRaw is List ? subtasksRaw : const <dynamic>[];
    final completed = subtasks
        .where((s) => s is Map && (s['completed'] == true || s['isCompleted'] == true))
        .length;
    final attachmentsRaw = json['attachments'];
    final attachments = attachmentsRaw is List ? attachmentsRaw : const <dynamic>[];
    final commentsRaw = json['comments'];
    final comments = commentsRaw is List ? commentsRaw : const <dynamic>[];

    final project = json['project'];
    final String? projectName = project is Map
        ? project['name']?.toString()
        : json['projectName']?.toString();
    final title = (json['title'] ?? json['name'] ?? json['taskTitle'] ?? '')
        .toString()
        .trim();
    final description = (json['description'] ?? json['details'] ?? '')
        .toString()
        .trim();
    final category = (json['category'] ?? json['type'] ?? 'Work').toString().trim();
    final priority = (json['priority'] ?? 'medium').toString().trim();
    final aiPriorityScore =
      parseScore(json['aiPriorityScore']) ??
      parseScore(json['ai_priority_score']) ??
      parseScore(json['aiScore']) ??
      parseScore(json['ai_score']) ??
      parseScore(json['score']);
    final estimatedDuration = int.tryParse(
          '${json['estimatedDuration'] ?? json['estimated_duration'] ?? json['scheduleDurationMinutes'] ?? json['schedule_duration_minutes'] ?? json['aiPredictedDuration'] ?? json['ai_predicted_duration'] ?? 0}',
        ) ??
        0;

    return TaskModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      title: title.isEmpty ? 'Untitled Task' : title,
      description: description.isEmpty ? null : description,
      status: (json['status'] ?? 'todo').toString(),
      priority: priority.isEmpty ? 'medium' : priority,
      category: category.isEmpty ? 'Work' : category,
      deadline: parseDeadline(json['deadline']),
      estimatedDuration: estimatedDuration,
      aiPriorityScore: aiPriorityScore,
      projectName: projectName,
      totalSubtasks: subtasks.length,
      completedSubtasks: completed,
      attachments: attachments
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList(),
      comments: comments
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList(),
      subtasks: subtasks
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList(),
    );
  }
}
