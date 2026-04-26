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

  factory TaskModel.fromJson(Map<String, dynamic> json) {
    final subtasksRaw = json['subtasks'];
    final subtasks = subtasksRaw is List ? subtasksRaw : const <dynamic>[];
    final completed = subtasks
        .where((s) => s is Map && (s['completed'] == true || s['isCompleted'] == true))
        .length;

    final project = json['project'];
    final String? projectName = project is Map
        ? project['name']?.toString()
        : json['projectName']?.toString();

    return TaskModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      description: json['description']?.toString(),
      status: (json['status'] ?? 'todo').toString(),
      priority: (json['priority'] ?? 'medium').toString(),
      category: (json['category'] ?? 'Work').toString(),
      deadline: json['deadline'] != null ? DateTime.tryParse(json['deadline'].toString()) : null,
      estimatedDuration: int.tryParse('${json['estimatedDuration'] ?? 0}') ?? 0,
      aiPriorityScore: int.tryParse('${json['aiPriorityScore'] ?? ''}'),
      projectName: projectName,
      totalSubtasks: subtasks.length,
      completedSubtasks: completed,
    );
  }
}
