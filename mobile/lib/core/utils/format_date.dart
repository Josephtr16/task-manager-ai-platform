import 'package:intl/intl.dart';

String formatRelativeDate(DateTime date, {bool isCompleted = false}) {
  if (isCompleted) return 'Completed';

  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final localDate = date.toLocal();
  final target = DateTime(localDate.year, localDate.month, localDate.day);

  if (target.isBefore(today)) return 'Overdue';
  if (target == today) return 'Today';

  final tomorrow = today.add(const Duration(days: 1));
  if (target == tomorrow) return 'Tomorrow';

  final diff = target.difference(today).inDays;
  if (diff <= 7) return 'in $diff days';

  return DateFormat('MMM d').format(localDate);
}

String formatTimeAgo(DateTime date) {
  final diff = DateTime.now().difference(date);
  if (diff.inMinutes < 1) return 'just now';
  if (diff.inHours < 1) return '${diff.inMinutes}m ago';
  if (diff.inDays < 1) return '${diff.inHours}h ago';
  return '${diff.inDays}d ago';
}
