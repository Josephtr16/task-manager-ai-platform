import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:table_calendar/table_calendar.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/gradient_background.dart';
import '../providers/calendar_provider.dart';

class CalendarScreen extends ConsumerStatefulWidget {
  const CalendarScreen({super.key});

  @override
  ConsumerState<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends ConsumerState<CalendarScreen> {
  DateTime _focusedDay = DateTime.now();
  DateTime _selectedDay = DateTime.now();
  CalendarFormat _calendarFormat = CalendarFormat.month;

  bool _isDayEnabled(DateTime day) {
    final today = DateTime.now();
    final normalizedToday = DateTime(today.year, today.month, today.day);
    return !day.isBefore(normalizedToday);
  }

  List<Map<String, dynamic>> _eventsForDay(List<Map<String, dynamic>> tasks, DateTime day) {
    return tasks.where((task) {
      final d = task['deadline'] as DateTime?;
      if (d == null) return false;

      // Normalize status and common completion flags
      final status = (task['status'] ?? '').toString().toLowerCase().trim();
      if (status == 'done' || status == 'completed' || status == 'finished' || status == 'closed') return false;

      // Some tasks use boolean flags instead of a status string
      final maybeCompleted = task['completed'] ?? task['isCompleted'] ?? task['done'] ?? task['isDone'];
      if (maybeCompleted is bool && maybeCompleted) return false;

      return d.year == day.year && d.month == day.month && d.day == day.day;
    }).toList();
  }

  void _shiftCalendar(int delta) {
    final nextFocusedDay = _calendarFormat == CalendarFormat.week
        ? _focusedDay.add(Duration(days: 7 * delta))
        : DateTime(_focusedDay.year, _focusedDay.month + delta, 1);

    setState(() {
      _focusedDay = nextFocusedDay;
      if (_calendarFormat == CalendarFormat.month) {
        _selectedDay = DateTime(nextFocusedDay.year, nextFocusedDay.month, nextFocusedDay.day);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final tasks = ref.watch(calendarTasksProvider);
    final tokens = Theme.of(context).extension<AppColorTokens>()!;
    final selectedTasks = _eventsForDay(tasks, _selectedDay);
    final monthLabel = DateFormat('MMMM yyyy').format(_focusedDay);

    return Scaffold(
      body: GradientBackground(
        child: SafeArea(
          child: Column(
            children: <Widget>[
              // ── Header ──────────────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                child: Row(
                  children: <Widget>[
                    IconButton(
                      onPressed: () => _shiftCalendar(-1),
                      icon: const Icon(Icons.chevron_left),
                      color: tokens.textSecondary,
                      splashRadius: 20,
                    ),
                    Expanded(
                      child: Text(
                        monthLabel,
                        textAlign: TextAlign.center,
                        style: GoogleFonts.fraunces(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: tokens.textPrimary,
                        ),
                      ),
                    ),
                    IconButton(
                      onPressed: () => _shiftCalendar(1),
                      icon: const Icon(Icons.chevron_right),
                      color: tokens.textSecondary,
                      splashRadius: 20,
                    ),
                  ],
                ),
              ),

              // ── Month / Week toggle ──────────────────────────────────────
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: <Widget>[
                    _buildFormatChip(
                      context,
                      label: 'Month',
                      selected: _calendarFormat == CalendarFormat.month,
                      onTap: () => setState(() => _calendarFormat = CalendarFormat.month),
                    ),
                    const SizedBox(width: 10),
                    _buildFormatChip(
                      context,
                      label: 'Week',
                      selected: _calendarFormat == CalendarFormat.week,
                      onTap: () => setState(() => _calendarFormat = CalendarFormat.week),
                    ),
                  ],
                ),
              ),

              // ── TableCalendar ────────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: TableCalendar<dynamic>(
                  firstDay: DateTime.utc(2020),
                  lastDay: DateTime.utc(2100),
                  focusedDay: _focusedDay,
                  calendarFormat: _calendarFormat,
                  headerVisible: false,
                  rowHeight: 60.0,
                  availableCalendarFormats: const <CalendarFormat, String>{
                    CalendarFormat.month: 'Month',
                    CalendarFormat.week: 'Week',
                  },
                  selectedDayPredicate: (day) => isSameDay(day, _selectedDay),
                  enabledDayPredicate: _isDayEnabled,
                  onDaySelected: (selectedDay, focusedDay) {
                    if (!_isDayEnabled(selectedDay)) return;
                    setState(() {
                      _selectedDay = selectedDay;
                      _focusedDay = focusedDay;
                    });
                  },
                  onFormatChanged: (format) {
                    setState(() => _calendarFormat = format);
                  },
                  onPageChanged: (focusedDay) {
                    setState(() => _focusedDay = focusedDay);
                  },
                    // Use custom builders so dots always sit BELOW the square,
                    // never hidden inside it. Pass the current tasks list to the builders.
                    calendarBuilders: CalendarBuilders(
                    defaultBuilder: (context, day, _) =>
                      _buildDayCell(context, day, tasks, isToday: false, isSelected: false),
                    todayBuilder: (context, day, _) =>
                      _buildDayCell(context, day, tasks, isToday: true, isSelected: false),
                    selectedBuilder: (context, day, _) =>
                      _buildDayCell(context, day, tasks, isToday: false, isSelected: true),
                    disabledBuilder: (context, day, _) =>
                      _buildDayCell(context, day, tasks, isToday: false, isSelected: false, disabled: true),
                    outsideBuilder: (context, day, _) =>
                      _buildDayCell(context, day, tasks, isToday: false, isSelected: false, outside: true),
                    ),
                  calendarStyle: const CalendarStyle(
                    // All visual rendering is done in calendarBuilders above.
                    // Keep these transparent so they don't interfere.
                    cellMargin: EdgeInsets.all(2),
                    outsideDaysVisible: false,
                  ),
                  daysOfWeekStyle: DaysOfWeekStyle(
                    weekdayStyle: GoogleFonts.dmSans(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: tokens.textMuted,
                    ),
                    weekendStyle: GoogleFonts.dmSans(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: tokens.textMuted,
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 12),
              Divider(height: 1, thickness: 0.5, color: tokens.borderSubtle),

              // ── Task list ────────────────────────────────────────────────
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
                  children: <Widget>[
                    Row(
                      children: <Widget>[
                        Expanded(
                          child: Text(
                            'Tasks on ${DateFormat('MMM d').format(_selectedDay)}',
                            style: GoogleFonts.dmSans(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.8,
                              color: tokens.textMuted,
                            ),
                          ),
                        ),
                        Text(
                          '${selectedTasks.length}',
                          style: Theme.of(context)
                              .textTheme
                              .labelSmall
                              ?.copyWith(color: tokens.textSecondary),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    if (selectedTasks.isEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: Center(
                          child: Text(
                            'No tasks on this day',
                            style: TextStyle(fontSize: 13, color: tokens.textMuted),
                          ),
                        ),
                      )
                    else
                      ...selectedTasks.map((task) {
                        final priority = (task['priority'] ?? '').toString().toLowerCase();
                        final priorityColor = AppPriorityColors.colorFor(priority);
                        final deadline = task['deadline'] as DateTime?;

                        return Card(
                          margin: const EdgeInsets.only(bottom: 10),
                          elevation: 0,
                          color: tokens.bgSurface,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                            side: BorderSide(color: tokens.borderSubtle, width: 0.5),
                          ),
                          child: Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(14),
                              border: const Border(
                                left: BorderSide(color: Color(0xFFC9924A), width: 4),
                              ),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: <Widget>[
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: <Widget>[
                                        Text(
                                          task['title']?.toString() ?? '',
                                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                                fontSize: 15,
                                                fontWeight: FontWeight.w600,
                                                color: tokens.textPrimary,
                                              ),
                                        ),
                                        const SizedBox(height: 6),
                                        Text(
                                          deadline != null
                                              ? DateFormat('MMM d, yyyy').format(deadline)
                                              : 'No deadline',
                                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                                fontSize: 13,
                                                color: tokens.textMuted,
                                              ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: priorityColor.withOpacity(0.12),
                                      borderRadius: BorderRadius.circular(999),
                                    ),
                                    child: Text(
                                      priority.isEmpty ? 'NONE' : priority.toUpperCase(),
                                      style: TextStyle(
                                        color: priorityColor,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      }),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Custom day cell: number square on top, dots strictly below.
  Widget _buildDayCell(
    BuildContext context,
    DateTime day,
    List<Map<String, dynamic>> tasks, {
    required bool isToday,
    required bool isSelected,
    bool disabled = false,
    bool outside = false,
  }) {
    final dayTasks = _eventsForDay(tasks, day);
    final dotCount = dayTasks.length.clamp(0, 3);

    // Text color
    Color textColor;
    if (disabled || outside) {
      textColor = Colors.grey.shade300;
    } else if (isToday) {
      textColor = Colors.white;
    } else {
      textColor = Theme.of(context).extension<AppColorTokens>()!.textPrimary;
    }

    // Background decoration for the number box
    BoxDecoration? bgDecoration;
    if (isToday) {
      bgDecoration = BoxDecoration(
        color: const Color(0xFFC9924A),
        borderRadius: BorderRadius.circular(10),
      );
    } else if (isSelected) {
      bgDecoration = BoxDecoration(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFC9924A), width: 2),
      );
    }

    return SizedBox(
      width: 40,
      height: 56,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: <Widget>[
          // Number square
          Container(
            width: 34,
            height: 34,
            decoration: bgDecoration,
            alignment: Alignment.center,
            child: Text(
              '${day.day}',
              style: TextStyle(
                fontSize: 15,
                fontWeight: (isToday || isSelected) ? FontWeight.w700 : FontWeight.w400,
                color: textColor,
              ),
            ),
          ),
          // Dots — always rendered in their own 8px slot below the square
          SizedBox(
            height: 10,
            child: dotCount > 0
                ? Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(
                      dotCount,
                      (_) => Container(
                        width: 4,
                        height: 4,
                        margin: const EdgeInsets.symmetric(horizontal: 1.5),
                        decoration: const BoxDecoration(
                          color: Color(0xFFC9924A),
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  )
                : const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }

  Widget _buildFormatChip(
    BuildContext context, {
    required String label,
    required bool selected,
    required VoidCallback onTap,
  }) {
    final tokens = Theme.of(context).extension<AppColorTokens>()!;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFFC9924A) : Colors.transparent,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
            color: selected ? const Color(0xFFC9924A) : tokens.borderSubtle,
          ),
        ),
        child: Text(
          label,
          style: GoogleFonts.dmSans(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: selected ? Colors.white : tokens.textMuted,
          ),
        ),
      ),
    );
  }
}