import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../../core/widgets/gradient_background.dart';
import '../../../core/widgets/tf_page_header.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_colors.dart';
import '../providers/calendar_provider.dart';

class CalendarScreen extends ConsumerStatefulWidget {
  const CalendarScreen({super.key});

  @override
  ConsumerState<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends ConsumerState<CalendarScreen> {
  DateTime _focusedDay = DateTime.now();
  DateTime _selectedDay = DateTime.now();

  void _goMonth(int delta) {
    setState(() {
      _focusedDay = DateTime(_focusedDay.year, _focusedDay.month + delta, 1);
    });
  }

  List<Map<String, dynamic>> _eventsForDay(List<Map<String, dynamic>> tasks, DateTime day) {
    return tasks.where((task) {
      final d = task['deadline'] as DateTime?;
      if (d == null) return false;
      return d.year == day.year && d.month == day.month && d.day == day.day;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final tasks = ref.watch(calendarTasksProvider);
    final tokens = Theme.of(context).extension<AppColorTokens>()!;

    final monthLabel = '${DateFormat('MMMM yyyy').format(_focusedDay)}';

    final selectedTasks = _eventsForDay(tasks, _selectedDay);

    return Scaffold(
      body: GradientBackground(
        child: ListView(
          padding: EdgeInsets.zero,
          children: <Widget>[
            // Inline month navigation
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Row(
                children: <Widget>[
                  GestureDetector(
                    onTap: () => _goMonth(-1),
                    child: Container(
                      width: 30,
                      height: 30,
                      decoration: BoxDecoration(
                        color: tokens.bgSurface,
                        border: Border.all(color: tokens.borderSubtle),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.chevron_left, size: 18, color: tokens.textSecondary),
                    ),
                  ),
                  const Spacer(),
                  Text(
                    monthLabel,
                    style: GoogleFonts.dmSerifDisplay(fontSize: 18),
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: () => _goMonth(1),
                    child: Container(
                      width: 30,
                      height: 30,
                      decoration: BoxDecoration(
                        color: tokens.bgSurface,
                        border: Border.all(color: tokens.borderSubtle),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.chevron_right, size: 18, color: tokens.textSecondary),
                    ),
                  ),
                ],
              ),
            ),

            // Calendar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: TableCalendar<dynamic>(
                firstDay: DateTime.utc(2020),
                lastDay: DateTime.utc(2100),
                focusedDay: _focusedDay,
                selectedDayPredicate: (day) => isSameDay(day, _selectedDay),
                onDaySelected: (selectedDay, focusedDay) {
                  setState(() {
                    _selectedDay = selectedDay;
                    _focusedDay = focusedDay;
                  });
                },
                eventLoader: (day) => _eventsForDay(tasks, day),
                headerStyle: HeaderStyle(
                  formatButtonVisible: false,
                  titleCentered: true,
                  titleTextStyle: TextStyle(fontSize: 17, fontWeight: FontWeight.w600, color: tokens.textPrimary),
                  leftChevronIcon: Icon(Icons.chevron_left, size: 18, color: tokens.textSecondary),
                  rightChevronIcon: Icon(Icons.chevron_right, size: 18, color: tokens.textSecondary),
                ),
                calendarStyle: CalendarStyle(
                  defaultDecoration: const BoxDecoration(color: Colors.transparent),
                  weekendDecoration: const BoxDecoration(color: Colors.transparent),
                  outsideDecoration: const BoxDecoration(color: Colors.transparent),
                  selectedDecoration: BoxDecoration(color: AppSemanticColors.primary, shape: BoxShape.circle),
                  todayDecoration: BoxDecoration(color: AppSemanticColors.accentDim, shape: BoxShape.circle),
                  selectedTextStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                  todayTextStyle: TextStyle(color: AppSemanticColors.accentDark, fontWeight: FontWeight.w700),
                  defaultTextStyle: TextStyle(color: tokens.textSecondary, fontWeight: FontWeight.w500),
                  weekendTextStyle: TextStyle(color: tokens.textSecondary, fontWeight: FontWeight.w500),
                  outsideDaysVisible: false,
                  markerDecoration: BoxDecoration(color: AppSemanticColors.primary, shape: BoxShape.circle),
                  markerSize: 5.0,
                  markersMaxCount: 3,
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Section header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: <Widget>[
                  Expanded(
                    child: TfSectionLabel(label: 'Tasks on ${DateFormat('MMM d').format(_selectedDay)}'),
                  ),
                  Text(
                    '${selectedTasks.length}',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(color: tokens.textSecondary),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: selectedTasks.isEmpty
                  ? Center(child: Text('No tasks on this day', style: TextStyle(fontSize: 13, color: tokens.textMuted)))
                  : Column(
                      children: selectedTasks.map((task) {
                        final priority = (task['priority'] ?? '').toString().toLowerCase();
                        Color leftColor;
                        switch (priority) {
                          case 'urgent':
                            leftColor = AppSemanticColors.rose;
                            break;
                          case 'high':
                            leftColor = AppSemanticColors.primary;
                            break;
                          case 'low':
                            leftColor = AppSemanticColors.sage;
                            break;
                          case 'medium':
                          default:
                            leftColor = AppSemanticColors.sky;
                            break;
                        }

                        return Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.fromLTRB(13, 11, 13, 11),
                          decoration: BoxDecoration(
                            color: tokens.bgSurface,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: tokens.borderSubtle, width: 0.5),
                          ),
                          child: Row(
                            children: <Widget>[
                              Container(width: 3, height: 32, color: leftColor),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: <Widget>[
                                    Text(task['title']?.toString() ?? '', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 13, fontWeight: FontWeight.w600, color: tokens.textPrimary)),
                                    const SizedBox(height: 4),
                                    Text(task['deadline'] != null ? DateFormat('MMM d, yyyy').format(task['deadline'] as DateTime) : '', style: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 11, color: tokens.textMuted)),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppPriorityColors.backgroundFor(task['priority']?.toString()),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(task['priority']?.toString().toUpperCase() ?? '', style: TextStyle(color: AppPriorityColors.colorFor(task['priority']?.toString()), fontSize: 11, fontWeight: FontWeight.w700)),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}
