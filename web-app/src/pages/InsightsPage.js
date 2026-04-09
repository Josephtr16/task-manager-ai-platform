// src/pages/InsightsPage.js
import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { borderRadius } from '../theme';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';
import { FaChartLine, FaCalendarAlt, FaClock, FaBullseye, FaSync, FaChartPie, FaTrophy, FaRobot } from 'react-icons/fa';

const InsightsPage = () => {
  const { theme } = useTheme();
  const [productivityTrend, setProductivityTrend] = useState([]);
  const [categoryDistribution, setCategoryDistribution] = useState([]);
  const [timeOfDay, setTimeOfDay] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [aiInsights, setAiInsights] = useState([]);
  const [bestDays, setBestDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendDays, setTrendDays] = useState(7);
  const [loadError, setLoadError] = useState('');
  const isFirstMountRef = React.useRef(true);

  const loadAnalytics = React.useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [
        trendRes,
        categoryRes,
        timeRes,
        metricsRes,
        insightsRes,
        bestDaysRes,
      ] = await Promise.all([
        analyticsAPI.getProductivityTrend(trendDays),
        analyticsAPI.getCategoryDistribution(),
        analyticsAPI.getTimeOfDay(),
        analyticsAPI.getPerformanceMetrics(),
        analyticsAPI.getAIInsights(),
        analyticsAPI.getBestDays(),
      ]);

      setProductivityTrend(trendRes.data.data);
      setCategoryDistribution(categoryRes.data.data.filter(d => d.count > 0));
      setTimeOfDay(timeRes.data.data);
      setPerformanceMetrics(metricsRes.data.metrics);
      setAiInsights(insightsRes.data.insights);
      setBestDays(bestDaysRes.data.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setLoadError(error.response?.data?.message || 'Unable to load analytics right now. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  }, [trendDays]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const CATEGORY_COLORS = [
    theme.primary,
    theme.success,
    theme.error,
    theme.info,
    theme.warning,
    theme.copper,
  ];

  const styles = {
    container: {
      padding: '32px',
      minHeight: '100vh',
      backgroundColor: theme.bgMain,
    },
    loading: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      color: theme.textPrimary,
      gap: '16px',
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: `4px solid ${theme.bgMain}`,
      borderTop: `4px solid ${theme.primary}`,
      borderRadius: '50%',
      boxShadow: theme.shadows.float,
      animation: 'spin 1s linear infinite',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '32px',
    },
    title: {
      fontFamily: '"Syne", sans-serif',
      fontSize: '32px',
      fontWeight: '800',
      color: theme.textPrimary,
      margin: '0 0 4px 0',
      display: 'flex',
      alignItems: 'center',
    },
    subtitle: {
      fontSize: '14px',
      color: theme.textSecondary,
      margin: 0,
    },
    refreshButton: {
      backgroundColor: theme.bgCard,
      border: `1px solid ${theme.border}`,
      borderRadius: '999px',
      padding: '10px 20px',
      fontSize: '14px',
      color: theme.textPrimary,
      cursor: 'pointer',
      boxShadow: 'none',
      display: 'flex',
      alignItems: 'center',
      fontWeight: '600',
      transition: 'all 150ms ease',
    },
    errorBanner: {
      backgroundColor: `${theme.error}1a`,
      border: `1px solid ${theme.error}40`,
      color: theme.error,
      borderRadius: borderRadius.md,
      padding: '12px 14px',
      marginBottom: '16px',
      fontSize: '13px',
      fontWeight: '600',
    },
    insightCardsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '24px',
      marginBottom: '32px',
    },
    insightCard: {
      backgroundColor: theme.bgCard,
      borderRadius: borderRadius.lg,
      padding: '24px',
      boxShadow: theme.shadows.card,
      border: `1px solid ${theme.border}`,
    },
    insightCardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '12px',
    },
    insightIcon: {
      fontSize: '24px',
      color: theme.primary,
      padding: '10px',
      borderRadius: '12px',
      backgroundColor: theme.bgElevated,
      boxShadow: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    confidenceBadge: {
      textAlign: 'right',
    },
    confidenceText: {
      fontSize: '12px',
      color: theme.textMuted,
      display: 'block',
      marginBottom: '4px',
    },
    confidenceBar: {
      width: '80px',
      height: '6px',
      backgroundColor: theme.bgElevated,
      borderRadius: '3px',
      overflow: 'hidden',
      boxShadow: 'none',
    },
    confidenceFill: {
      height: '100%',
      borderRadius: '3px',
      transition: 'width 0.3s ease',
    },
    insightTitle: {
      fontSize: '16px',
      fontWeight: '700',
      color: theme.textPrimary,
      margin: '0 0 8px 0',
    },
    insightDescription: {
      fontSize: '14px',
      color: theme.textSecondary,
      margin: 0,
      lineHeight: '1.5',
    },
    chartsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '24px',
    },
    chartCard: {
      backgroundColor: theme.bgCard,
      borderRadius: borderRadius.lg,
      padding: '24px',
      boxShadow: theme.shadows.card,
      border: `1px solid ${theme.border}`,
    },
    chartHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
    },
    chartTitle: {
      fontSize: '18px',
      fontWeight: '700',
      color: theme.textPrimary,
      margin: '0 0 4px 0',
      display: 'flex',
      alignItems: 'center',
    },
    chartSubtitle: {
      fontSize: '13px',
      color: theme.textSecondary,
      margin: '0 0 20px 0',
    },
    trendToggle: {
      display: 'flex',
      gap: '8px',
      backgroundColor: theme.bgCard,
      padding: '4px',
      borderRadius: '999px',
      boxShadow: 'none',
      border: `1px solid ${theme.border}`,
    },
    trendButton: {
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '8px',
      padding: '6px 12px',
      fontSize: '12px',
      fontWeight: '600',
      color: theme.textSecondary,
      cursor: 'pointer',
      transition: 'all 120ms ease',
    },
    trendButtonActive: {
      backgroundColor: theme.bgOverlay,
      color: theme.textPrimary,
      boxShadow: theme.shadows.sm,
    },
    emptyChart: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '200px',
      color: theme.textMuted,
      fontSize: '14px',
      textAlign: 'center',
      border: `1px dashed ${theme.borderMedium || theme.border}`,
      borderRadius: '8px',
      backgroundColor: theme.bgRaised,
    },
    tooltip: {
      backgroundColor: theme.bgOverlay,
      border: `1px solid ${theme.borderMedium || theme.border}`,
      borderRadius: '8px',
      padding: '12px',
      boxShadow: theme.shadows.md,
    },
    tooltipLabel: {
      fontSize: '13px',
      fontWeight: '600',
      color: theme.textPrimary,
      margin: '0 0 4px 0',
    },
    tooltipValue: {
      fontSize: '13px',
      margin: '2px 0',
      fontWeight: '500',
    },
    pieLegeend: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      marginTop: '16px',
    },
    pieLegendItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    pieLegendDot: {
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      flexShrink: 0,
      boxShadow: 'none',
    },
    pieLegendLabel: {
      fontSize: '13px',
      color: theme.textSecondary,
      flex: 1,
    },
    pieLegendValue: {
      fontSize: '13px',
      fontWeight: '600',
      color: theme.textPrimary,
    },
    metricsGrid: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
    },
    metricItem: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
    },
    metricCircle: {
      position: 'relative',
      width: '100px',
      height: '100px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    metricSvg: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      transform: 'rotate(-90deg)',
    },
    metricValue: {
      fontSize: '20px',
      fontWeight: '800',
      color: theme.textPrimary,
      position: 'relative',
      zIndex: 1,
    },
    metricLabel: {
      fontSize: '14px',
      fontWeight: '600',
      color: theme.textSecondary,
      margin: 0,
      textAlign: 'center',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '16px',
      marginTop: '16px',
    },
    statBox: {
      backgroundColor: theme.bgMain,
      borderRadius: borderRadius.md,
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
      boxShadow: 'none',
    },
    statValue: {
      fontSize: '18px',
      fontWeight: '700',
      color: theme.textPrimary,
    },
    statLabel: {
      fontSize: '11px',
      color: theme.textMuted,
      textAlign: 'center',
    },
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const pointDate = payload[0]?.payload?.date;
      const resolvedLabel = pointDate
        ? new Date(pointDate).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })
        : label;

      return (
        <div style={styles.tooltip}>
          <p style={styles.tooltipLabel}>{resolvedLabel}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ ...styles.tooltipValue, color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <>
        <div style={styles.loading}>
          <div style={styles.spinner} />
          <p>Loading AI insights...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div style={styles.container}>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        {loadError && <div style={styles.errorBanner}>{loadError}</div>}
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              <FaRobot style={{ marginRight: '12px' }} />
              AI Insights
            </h1>
            <p style={styles.subtitle}>
              Smart analytics powered by your task data
            </p>
          </div>
          <button onClick={loadAnalytics} style={styles.refreshButton}>
            <FaSync style={{ marginRight: '8px' }} /> Refresh
          </button>
        </div>

        {/* AI Insight Cards */}
        <div style={styles.insightCardsGrid}>
          {aiInsights.map((insight) => (
            <div key={insight.id} style={styles.insightCard}>
              <div style={styles.insightCardHeader}>
                <span style={styles.insightIcon}>
                  {insight.icon === 'chart' ? <FaChartLine /> :
                    insight.icon === 'calendar' ? <FaCalendarAlt /> :
                      insight.icon === 'clock' ? <FaClock /> : <FaBullseye />}
                </span>
                <div style={styles.confidenceBadge}>
                  <span style={styles.confidenceText}>
                    {insight.confidence}% confidence
                  </span>
                  <div style={styles.confidenceBar}>
                    <div style={{
                      ...styles.confidenceFill,
                      width: `${insight.confidence}%`,
                      backgroundColor: insight.confidence > 80
                        ? theme.success
                        : insight.confidence > 60
                          ? theme.warning
                          : theme.error,
                    }} />
                  </div>
                </div>
              </div>
              <h3 style={styles.insightTitle}>{insight.title}</h3>
              <p style={styles.insightDescription}>{insight.description}</p>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div style={styles.chartsGrid}>
          {/* Productivity Trend Chart */}
          <div style={styles.chartCard}>
            <div style={styles.chartHeader}>
              <h3 style={styles.chartTitle}><FaChartLine style={{ marginRight: '8px' }} /> Productivity Trend</h3>
              <div style={styles.trendToggle}>
                {[7, 14, 30].map(days => (
                  <button
                    key={days}
                    onClick={() => setTrendDays(days)}
                    style={{
                      ...styles.trendButton,
                      ...(trendDays === days && styles.trendButtonActive),
                    }}
                  >
                    {days}d
                  </button>
                ))}
              </div>
            </div>
            {productivityTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={productivityTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                  <XAxis
                    dataKey="date"
                    stroke={theme.textMuted}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);

                      if (Number.isNaN(date.getTime())) {
                        return value;
                      }

                      if (trendDays >= 30) {
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      }

                      return date.toLocaleDateString('en-US', { weekday: 'short' });
                    }}
                  />
                  <YAxis stroke={theme.textMuted} tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="created"
                    name="Created"
                    stroke={theme.primary}
                    strokeWidth={2}
                    dot={{ fill: theme.primary }}
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    name="Completed"
                    stroke={theme.success}
                    strokeWidth={2}
                    dot={{ fill: theme.success }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={styles.emptyChart}>
                <p>No data yet. Create and complete tasks to see trends!</p>
              </div>
            )}
          </div>

          {/* Category Distribution Pie Chart */}
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}><FaChartPie style={{ marginRight: '8px' }} /> Task Distribution</h3>
            {categoryDistribution.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="count"
                      nameKey="category"
                      stroke={theme.bgMain} // Match bg to hide stroke or make it blend
                      strokeWidth={2}
                    >
                      {categoryDistribution.map((entry, index) => (
                        <Cell
                          key={entry.category}
                          fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [value, name]}
                      contentStyle={{
                        backgroundColor: theme.bgMain,
                        border: 'none',
                        borderRadius: '8px',
                        color: theme.textPrimary,
                        boxShadow: theme.shadows.sm,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div style={styles.pieLegeend}>
                  {categoryDistribution.map((entry, index) => (
                    <div key={entry.category} style={styles.pieLegendItem}>
                      <div style={{
                        ...styles.pieLegendDot,
                        backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                      }} />
                      <span style={styles.pieLegendLabel}>{entry.category}</span>
                      <span style={styles.pieLegendValue}>{entry.percentage}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={styles.emptyChart}>
                <p>No tasks yet. Create tasks to see distribution!</p>
              </div>
            )}
          </div>

          {/* Time of Day Analysis */}
          <div style={{ ...styles.chartCard, gridColumn: 'span 2' }}>
            <h3 style={styles.chartTitle}><FaClock style={{ marginRight: '8px' }} /> Time of Day Analysis</h3>
            <p style={styles.chartSubtitle}>When do you complete most tasks?</p>
            {timeOfDay.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={timeOfDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                  <XAxis
                    dataKey="label"
                    stroke={theme.textMuted}
                    tick={{ fontSize: 11 }}
                    interval={1}
                  />
                  <YAxis stroke={theme.textMuted} tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="count"
                    name="Tasks Completed"
                    fill={theme.primary}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={styles.emptyChart}>
                <p>Complete tasks to see your most productive hours!</p>
              </div>
            )}
          </div>

          {/* Best Days Chart */}
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}><FaCalendarAlt style={{ marginRight: '8px' }} /> Best Days</h3>
            <p style={styles.chartSubtitle}>Most productive days of the week</p>
            {bestDays.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={bestDays}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                  <XAxis
                    dataKey="day"
                    stroke={theme.textMuted}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(val) => val.slice(0, 3)}
                  />
                  <YAxis stroke={theme.textMuted} tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="count"
                    name="Tasks Completed"
                    fill={theme.accent}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={styles.emptyChart}>
                <p>Complete tasks to see your best days!</p>
              </div>
            )}
          </div>

          {/* Performance Metrics */}
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}><FaTrophy style={{ marginRight: '8px' }} /> Performance Metrics</h3>
            <p style={styles.chartSubtitle}>Your productivity overview</p>

            {performanceMetrics && (
              <div style={styles.metricsGrid}>
                {/* Completion Rate */}
                <div style={styles.metricItem}>
                  <div style={styles.metricCircle}>
                    <svg viewBox="0 0 36 36" style={styles.metricSvg}>
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={theme.bgMain}
                        strokeWidth="3"
                        style={{ filter: 'none' }} // Inset background
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={theme.success}
                        strokeWidth="3"
                        strokeDasharray={`${performanceMetrics.completionRate}, 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span style={styles.metricValue}>
                      {performanceMetrics.completionRate}%
                    </span>
                  </div>
                  <p style={styles.metricLabel}>Completion Rate</p>
                </div>

                {/* Productivity Score */}
                <div style={styles.metricItem}>
                  <div style={styles.metricCircle}>
                    <svg viewBox="0 0 36 36" style={styles.metricSvg}>
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={theme.bgMain}
                        strokeWidth="3"
                        style={{ filter: 'none' }}
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={theme.primary}
                        strokeWidth="3"
                        strokeDasharray={`${performanceMetrics.productivityScore}, 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span style={styles.metricValue}>
                      {performanceMetrics.productivityScore}
                    </span>
                  </div>
                  <p style={styles.metricLabel}>Productivity Score</p>
                </div>

                {/* Stats Grid */}
                <div style={styles.statsGrid}>
                  <div style={styles.statBox}>
                    <span style={styles.statValue}>{performanceMetrics.tasksCompleted}</span>
                    <span style={styles.statLabel}>Completed</span>
                  </div>
                  <div style={styles.statBox}>
                    <span style={styles.statValue}>{performanceMetrics.focusTimeToday}m</span>
                    <span style={styles.statLabel}>Focus Time</span>
                  </div>
                  <div style={styles.statBox}>
                    <span style={styles.statValue}>{performanceMetrics.streak}</span>
                    <span style={styles.statLabel}>Day Streak</span>
                  </div>
                  <div style={styles.statBox}>
                    <span style={styles.statValue}>{performanceMetrics.totalTasks}</span>
                    <span style={styles.statLabel}>Total Tasks</span>
                  </div>
                  <div style={styles.statBox}>
                    <span style={{ ...styles.statValue, color: theme.info || '#3b82f6' }}>
                      {performanceMetrics.inProgress}
                    </span>
                    <span style={styles.statLabel}>In Progress</span>
                  </div>
                  <div style={styles.statBox}>
                    <span style={{ ...styles.statValue, color: theme.error }}>
                      {performanceMetrics.overdue}
                    </span>
                    <span style={styles.statLabel}>Overdue</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default InsightsPage;