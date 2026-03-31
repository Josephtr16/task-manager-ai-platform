export const formatTaskDuration = (minutesValue) => {
  const minutes = Number(minutesValue);

  if (!Number.isFinite(minutes) || minutes <= 0) {
    return '0m';
  }

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
};

export default formatTaskDuration;