import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/gradient_background.dart';
import '../../../core/widgets/tf_page_header.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/projects_provider.dart';
import '../widgets/create_project_sheet.dart';
import '../widgets/project_card.dart';

class ProjectsScreen extends ConsumerWidget {
  const ProjectsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncState = ref.watch(projectsProvider);
    final tokens = Theme.of(context).extension<AppColorTokens>()!;

    return Scaffold(
      body: GradientBackground(
        child: asyncState.when(
          data: (data) {
            final count = data.projects.length;
            final isOwner = true; // TODO: determine ownership from user/project
            final itemCount = data.projects.length + (isOwner ? 1 : 0);

            return Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                  child: TfPageHeader(title: 'Projects', subtitle: '$count active projects'),
                ),
                Expanded(
                  child: CustomScrollView(
                    slivers: [
                      SliverPadding(
                        padding: const EdgeInsets.fromLTRB(16, 4, 16, 20),
                        sliver: SliverGrid(
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            crossAxisSpacing: 10,
                            mainAxisSpacing: 10,
                            childAspectRatio: 0.88,
                          ),
                          delegate: SliverChildBuilderDelegate(
                            (context, i) {
                              if (isOwner && i == data.projects.length) {
                                return GestureDetector(
                                  onTap: () => showModalBottomSheet<void>(
                                    context: context,
                                    isScrollControlled: true,
                                    backgroundColor: Colors.transparent,
                                    builder: (_) => const CreateProjectSheet(),
                                  ),
                                  child: Container(
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      color: tokens.bgOverlay,
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(color: tokens.borderMedium, style: BorderStyle.solid, width: 1),
                                    ),
                                    child: Column(
                                      mainAxisSize: MainAxisSize.min,
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      crossAxisAlignment: CrossAxisAlignment.center,
                                      children: <Widget>[
                                        Icon(Icons.add, size: 20, color: tokens.textMuted),
                                        const SizedBox(height: 8),
                                        Text(
                                          'New project',
                                          textAlign: TextAlign.center,
                                          style: TextStyle(fontSize: 11, color: tokens.textMuted, fontWeight: FontWeight.w500),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              }

                              final project = data.projects[i];
                              return ProjectCard(
                                project: project,
                                onTap: () => context.push('/projects/${project.id}'),
                              );
                            },
                            childCount: itemCount,
                          ),
                        ),
                      ),
                    ],
                    ),
                ),
              ],
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, _) => Center(child: Text(err.toString())),
        ),
      ),
    );
  }
}
