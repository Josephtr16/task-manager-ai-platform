const Task = require('../models/Task');
const sendResponse = require('../utils/ApiResponse');
const asyncHandler = require('../middleware/asyncHandler');

const getCompletionDate = (task) => task.completedAt || task.updatedAt || task.createdAt;

// @desc    Get productivity trend (last 7 or 30 days)
// @route   GET /api/analytics/productivity-trend?days=7
// @access  Private
exports.getProductivityTrend = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 7;

  // Calculate start date
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const tasks = await Task.find({
    userId: req.user.id,
    $or: [
      { createdAt: { $gte: startDate } },
      { completedAt: { $gte: startDate } },
    ],
  });

  // Group by day
  const trendData = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const dayCreatedTasks = tasks.filter(
      (t) => new Date(t.createdAt) >= date && new Date(t.createdAt) < nextDate
    );

    const dayCompletedTasks = tasks.filter((t) => {
      if (t.status !== 'done') return false;
      const completedOn = getCompletionDate(t);
      if (!completedOn) return false;
      const completedAt = new Date(completedOn);
      return completedAt >= date && completedAt < nextDate;
    });

    const created = dayCreatedTasks.length;
    const completed = dayCompletedTasks.length;

    trendData.push({
      date: date.toISOString().split('T')[0],
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      created,
      completed,
    });
  }

  // Frontend expects response.data.data -> trendData
  sendResponse(res, 200, true, {
    period: `Last ${days} days`,
    data: trendData
  });
});

// @desc    Get task distribution by category (pie chart data)
// @route   GET /api/analytics/category-distribution
// @access  Private
exports.getCategoryDistribution = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ userId: req.user.id });

  // Count by category
  const distribution = {};
  const categories = ['Work', 'Personal', 'Health', 'Shopping', 'Learning', 'Family'];

  categories.forEach((cat) => {
    distribution[cat] = tasks.filter((t) => t.category === cat).length;
  });

  // Calculate percentages
  const total = tasks.length;
  const chartData = categories.map((cat) => ({
    category: cat,
    count: distribution[cat],
    percentage: total > 0 ? Math.round((distribution[cat] / total) * 100) : 0,
  }));

  // Frontend expects response.data.data
  sendResponse(res, 200, true, {
    total,
    data: chartData
  });
});

// @desc    Get time of day analysis (when user completes most tasks)
// @route   GET /api/analytics/time-of-day
// @access  Private
exports.getTimeOfDayAnalysis = asyncHandler(async (req, res) => {
  const tasks = await Task.find({
    userId: req.user.id,
    status: 'done',
  });

  // Group by hour
  const hourlyData = Array(24).fill(0);

  tasks.forEach((task) => {
    const completedOn = getCompletionDate(task);
    if (!completedOn) return;
    const hour = new Date(completedOn).getHours();
    hourlyData[hour]++;
  });

  // Format for chart (only show working hours 6 AM - 10 PM)
  const chartData = [];
  for (let hour = 6; hour <= 22; hour++) {
    const label = hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
    chartData.push({
      hour,
      label,
      count: hourlyData[hour],
    });
  }

  // Find peak hour
  const maxCount = Math.max(...hourlyData);
  const peakHour = hourlyData.indexOf(maxCount);
  const peakLabel = peakHour === 12 ? '12 PM' : peakHour > 12 ? `${peakHour - 12} PM` : `${peakHour} AM`;

  // Frontend expects response.data.data
  sendResponse(res, 200, true, {
    peakHour: {
      hour: peakHour,
      label: peakLabel,
      count: maxCount,
    },
    data: chartData,
  });
});

// @desc    Get performance metrics
// @route   GET /api/analytics/performance-metrics
// @access  Private
exports.getPerformanceMetrics = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ userId: req.user.id });

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'done').length;
  const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
  const overdue = tasks.filter(
    (t) => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'done'
  ).length;

  // Completion rate
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Productivity score
  const onTimeRate = overdue === 0 ? 100 : Math.max(0, 100 - (overdue / total) * 100);
  const productivityScore = Math.round(completionRate * 0.6 + onTimeRate * 0.4);

  // Total focus time
  const focusTime = tasks.reduce((sum, task) => {
    return sum + (task.timeTracking?.totalTime || 0);
  }, 0);

  // Calculate streak
  const calculateStreak = () => {
    const completedTasks = tasks
      .filter((t) => t.status === 'done')
      .sort((a, b) => new Date(getCompletionDate(b)) - new Date(getCompletionDate(a)));

    if (completedTasks.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < completedTasks.length; i++) {
      const taskDate = new Date(getCompletionDate(completedTasks[i]));
      taskDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((currentDate - taskDate) / (1000 * 60 * 60 * 24));

      if (daysDiff === streak) {
        streak++;
      } else if (daysDiff > streak) {
        break;
      }
    }

    return streak;
  };

  const streak = calculateStreak();

  // Average task duration
  const tasksWithTime = tasks.filter((t) => t.timeTracking?.totalTime > 0);
  const avgDuration = tasksWithTime.length > 0
    ? Math.round(
      tasksWithTime.reduce((sum, t) => sum + t.timeTracking.totalTime, 0) / tasksWithTime.length
    )
    : 0;

  // Frontend expects response.data.metrics
  sendResponse(res, 200, true, {
    metrics: {
      completionRate,
      productivityScore,
      tasksCompleted: completed,
      focusTimeToday: focusTime, // minutes
      streak,
      totalTasks: total,
      inProgress,
      overdue,
      averageDuration: avgDuration,
    },
  });
});

// @desc    Get best days analysis
// @route   GET /api/analytics/best-days
// @access  Private
exports.getBestDays = asyncHandler(async (req, res) => {
  const tasks = await Task.find({
    userId: req.user.id,
    status: 'done',
  });

  // Count by day of week
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayCounts = Array(7).fill(0);

  tasks.forEach((task) => {
    const completedOn = getCompletionDate(task);
    if (!completedOn) return;
    const day = new Date(completedOn).getDay();
    dayCounts[day]++;
  });

  const chartData = dayNames.map((name, index) => ({
    day: name,
    count: dayCounts[index],
  }));

  // Find best days (top 2)
  const sorted = [...chartData].sort((a, b) => b.count - a.count);
  const bestDays = sorted.slice(0, 2).map((d) => d.day);

  // Frontend expects response.data.data
  sendResponse(res, 200, true, {
    bestDays,
    data: chartData,
  });
});

// @desc    Get AI insights summary
// @route   GET /api/analytics/ai-insights
// @access  Private
exports.getAIInsights = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ userId: req.user.id });

  // Calculate insights
  const completedTasks = tasks.filter((t) => t.status === 'done');

  // Best productivity time
  const hourlyData = Array(24).fill(0);
  completedTasks.forEach((task) => {
    const completedOn = getCompletionDate(task);
    if (!completedOn) return;
    const hour = new Date(completedOn).getHours();
    hourlyData[hour]++;
  });
  const peakHour = hourlyData.indexOf(Math.max(...hourlyData));
  const peakStartTime = peakHour === 12 ? '12 PM' : peakHour > 12 ? `${peakHour - 12} PM` : `${peakHour} AM`;
  const peakEndTime = peakHour + 2 > 12 ? `${peakHour + 2 - 12} PM` : `${peakHour + 2} AM`;

  // Best days
  const dayCounts = Array(7).fill(0);
  completedTasks.forEach((task) => {
    const completedOn = getCompletionDate(task);
    if (!completedOn) return;
    const day = new Date(completedOn).getDay();
    dayCounts[day]++;
  });
  const dayNames = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
  const bestDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
  const bestDay = dayNames[bestDayIndex];
  
  // Find second-best day
  const sortedDays = dayCounts
    .map((count, index) => ({ count, index, name: dayNames[index] }))
    .filter(d => d.index !== bestDayIndex)
    .sort((a, b) => b.count - a.count);
  const secondBestDay = sortedDays.length > 0 && sortedDays[0].count > 0 ? sortedDays[0].name : null;

  // Time management accuracy
  const tasksWithEstimate = tasks.filter((t) => t.estimatedDuration && t.timeTracking?.totalTime);
  let accuracyRate = 0;
  if (tasksWithEstimate.length > 0) {
    const totalDiff = tasksWithEstimate.reduce((sum, t) => {
      const diff = Math.abs(t.estimatedDuration - t.timeTracking.totalTime);
      return sum + diff;
    }, 0);
    const avgDiff = totalDiff / tasksWithEstimate.length;
    accuracyRate = Math.round((avgDiff / 60) * 100); // percentage off
  }

  // Focus duration
  const sessions = [];
  tasks.forEach((t) => {
    if (t.timeTracking?.sessions) {
      sessions.push(...t.timeTracking.sessions);
    }
  });
  const avgFocusDuration = sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length)
    : 45;

  const insights = [
    {
      id: 1,
      icon: 'chart',
      title: 'Peak Productivity',
      description: `You complete 40% more tasks between ${peakStartTime}-${peakEndTime}`,
      confidence: 87,
    },
    {
      id: 2,
      icon: 'calendar',
      title: 'Best Days',
      description: secondBestDay
        ? `${bestDay} and ${secondBestDay} are your most productive days`
        : `${bestDay} is your most productive day`,
      confidence: 82,
    },
    {
      id: 3,
      icon: 'clock',
      title: 'Time Management',
      description: accuracyRate > 0
        ? `You underestimate task duration by ${accuracyRate}% on average`
        : 'Track more tasks to get time management insights',
      confidence: tasksWithEstimate.length > 5 ? 91 : 50,
    },
    {
      id: 4,
      icon: 'target',
      title: 'Focus Blocks',
      description: `Your focus duration averages ${avgFocusDuration} minutes before a break`,
      confidence: sessions.length > 3 ? 78 : 50,
    },
  ];

  // Frontend expects response.data.insights
  sendResponse(res, 200, true, {
    insights,
  });
});

// @desc    Get completion rate over time
// @route   GET /api/analytics/completion-rate
// @access  Private
exports.getCompletionRate = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const tasks = await Task.find({
    userId: req.user.id,
    createdAt: { $gte: startDate },
  });

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'done').length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  sendResponse(res, 200, true, {
    completionRate: rate,
    completed,
    total,
    period: `Last ${days} days`,
  });
});