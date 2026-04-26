import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:table_calendar/table_calendar.dart';

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

  @override
  Widget build(BuildContext context) {
    final tasks = ref.watch(calendarTasksProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Calendar')),
      body: GradientBackground(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: <Widget>[
            TableCalendar<dynamic>(
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
            ),
            const SizedBox(height: 12),
            Text('Tasks on selected date', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            ...tasks
                .where((task) {
                  final d = task['deadline'] as DateTime?;
                  if (d == null) return false;
                  return d.year == _selectedDay.year && d.month == _selectedDay.month && d.day == _selectedDay.day;
                })
                .map((e) => ListTile(title: Text('${e['title']}'))),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(onPressed: () {}, child: const Icon(Icons.add)),
    );
  }
}
