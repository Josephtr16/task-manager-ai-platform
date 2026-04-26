class ProjectModel {
  const ProjectModel({
    required this.id,
    required this.title,
    this.description,
    this.status = 'not-started',
    this.priority = 'medium',
    this.category = 'Work',
    this.progress = 0,
    this.totalTasks = 0,
    this.completedTasks = 0,
    this.dueDate,
  });

  final String id;
  final String title;
  final String? description;
  final String status;
  final String priority;
  final String category;
  final int progress;
  final int totalTasks;
  final int completedTasks;
  final DateTime? dueDate;

  factory ProjectModel.fromJson(Map<String, dynamic> json) {
    final tasksRaw = json['tasks'];
    final tasks = tasksRaw is List ? tasksRaw : const <dynamic>[];
    final completedFromList = tasks
        .where((t) => t is Map && (t['status']?.toString().toLowerCase() == 'done' || t['status']?.toString().toLowerCase() == 'completed'))
        .length;

    return ProjectModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      description: json['description']?.toString(),
      status: (json['status'] ?? 'not-started').toString(),
      priority: (json['priority'] ?? 'medium').toString(),
      category: (json['category'] ?? 'Work').toString(),
      progress: int.tryParse('${json['progress'] ?? 0}') ?? 0,
      totalTasks: int.tryParse('${json['totalTasks'] ?? tasks.length}') ?? tasks.length,
      completedTasks: int.tryParse('${json['completedTasks'] ?? completedFromList}') ?? completedFromList,
      dueDate: json['dueDate'] != null ? DateTime.tryParse(json['dueDate'].toString()) : null,
    );
  }
}
