String formatDuration(num? minutes) {
  final value = minutes?.toDouble() ?? 0;
  if (value <= 0) return '0m';
  if (value < 60) return '${value.round()}m';

  final hours = value / 60;
  if ((hours - hours.roundToDouble()).abs() < 0.0001) {
    return '${hours.round()}h';
  }

  return '${hours.toStringAsFixed(1)}h';
}
