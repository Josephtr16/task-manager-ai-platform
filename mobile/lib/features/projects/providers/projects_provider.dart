import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../services/project_service.dart';
import '../models/project_model.dart';

class ProjectsState {
  const ProjectsState({
    this.projects = const <ProjectModel>[],
    this.pendingInvites = const <Map<String, dynamic>>[],
  });

  final List<ProjectModel> projects;
  final List<Map<String, dynamic>> pendingInvites;
}

final projectsProvider = AsyncNotifierProvider<ProjectsNotifier, ProjectsState>(ProjectsNotifier.new);

class ProjectsNotifier extends AsyncNotifier<ProjectsState> {
  final ProjectService _service = ProjectService();

  @override
  Future<ProjectsState> build() async {
    final projectsRes = await _service.getProjects();
    final invitesRes = await _service.getPendingInvites();

    final projects = ((projectsRes['projects'] as List?) ?? const <dynamic>[])
        .map((e) => ProjectModel.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();

    final invites = ((invitesRes['projects'] as List?) ?? const <dynamic>[])
        .map((e) => Map<String, dynamic>.from(e as Map))
        .toList();

    return ProjectsState(projects: projects, pendingInvites: invites);
  }
}
