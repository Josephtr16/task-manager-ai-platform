import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaBolt, FaBullseye, FaClock, FaPause, FaPlay, FaStepForward, FaStop, FaStopwatch } from 'react-icons/fa';
import { tasksAPI, timeTrackingAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useFocus } from '../context/FocusContext';

const POMODORO_WORK_SECONDS = 25 * 60;
const POMODORO_BREAK_SECONDS = 5 * 60;

const QUOTES = [
  'Small focus blocks beat long distracted hours.',
  'Start where you are; momentum will carry you forward.',
  'One task. One timer. One clear win.',
  'Protect your focus like it is your most valuable asset.',
  'Consistency compounds faster than intensity.',
  'Progress loves attention, not perfection.',
  'A finished session is better than a perfect plan.',
  'Stay present; the next minute is where results are built.',
];

const formatMMSS = (seconds) => {
  const safe = Math.max(0, Number(seconds) || 0);
  const mm = String(Math.floor(safe / 60)).padStart(2, '0');
  const ss = String(safe % 60).padStart(2, '0');
  return `${mm}:${ss}`;
};

const minutesFromSeconds = (seconds) => Math.max(1, Math.round((Number(seconds) || 0) / 60));

const FocusPage = () => {
  const { theme } = useTheme();
  const { setFocusMode } = useFocus();
  const navigate = useNavigate();
  const location = useLocation();

  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [technique, setTechnique] = useState('simple');

  const [sessionActive, setSessionActive] = useState(false);
  const [sessionPaused, setSessionPaused] = useState(false);
  const [sessionSummary, setSessionSummary] = useState(null);
  const [quote, setQuote] = useState(QUOTES[0]);

  const [simpleElapsedSeconds, setSimpleElapsedSeconds] = useState(0);

  const [pomodoroPhase, setPomodoroPhase] = useState('work');
  const [pomodoroSecondsLeft, setPomodoroSecondsLeft] = useState(POMODORO_WORK_SECONDS);
  const [pomodoroCompleted, setPomodoroCompleted] = useState(0);

  const intervalRef = useRef(null);
  const sessionSecondsRef = useRef(0);
  const sessionStartedAtRef = useRef(null);
  const sessionPausedRef = useRef(false);

  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const response = await tasksAPI.getTasks({ status: 'active', limit: 20 });
      const payload = response?.data || {};
      const list = Array.isArray(payload?.tasks) ? payload.tasks : [];
      setTasks(list);

      // Check if there's a preSelectedTask from navigation state
      const preSelectedTask = location.state?.preSelectedTask;
      if (preSelectedTask) {
        // Find the task in the list, or use the preSelectedTask directly
        const taskInList = list.find(t => t._id === preSelectedTask._id);
        setSelectedTask(taskInList || preSelectedTask);
      } else if (list.length > 0) {
        setSelectedTask((prev) => prev || list[0]);
      } else {
        setSelectedTask(null);
      }
    } catch (error) {
      console.error('Focus tasks fetch error:', error);
      setTasks([]);
      setSelectedTask(null);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    setFocusMode(sessionActive);
    return () => {
      setFocusMode(false);
    };
  }, [sessionActive, setFocusMode]);

  useEffect(() => {
    sessionPausedRef.current = sessionPaused;
  }, [sessionPaused]);

  const priorityColor = (priority) => {
    if (priority === 'urgent') return theme.urgent;
    if (priority === 'high') return theme.high;
    if (priority === 'low') return theme.low;
    return theme.medium;
  };

  const aiRecommendedTask = useMemo(() => {
    if (!tasks.length) return null;

    const withScore = tasks
      .filter((task) => task && task.status !== 'done')
      .filter((task) => Number.isFinite(Number(task.aiPriorityScore)))
      .sort((a, b) => Number(b.aiPriorityScore) - Number(a.aiPriorityScore));

    if (withScore.length > 0) {
      return withScore[0];
    }

    const nearestDeadline = tasks
      .filter((task) => task && task.status !== 'done' && task.deadline)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    return nearestDeadline[0] || tasks[0];
  }, [tasks]);

  const otherTasks = useMemo(
    () => tasks.filter((task) => String(task._id || task.id) !== String(aiRecommendedTask?._id || aiRecommendedTask?.id)),
    [tasks, aiRecommendedTask]
  );

  const clearRunningInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const resetSessionState = () => {
    clearRunningInterval();
    setSessionActive(false);
    setSessionPaused(false);
    setSimpleElapsedSeconds(0);
    setPomodoroPhase('work');
    setPomodoroSecondsLeft(POMODORO_WORK_SECONDS);
    setPomodoroCompleted(0);
    sessionSecondsRef.current = 0;
    sessionStartedAtRef.current = null;
  };

  const persistSessionLog = async (elapsedSeconds, completedPomodoros = 0) => {
    if (!selectedTask?._id) return;

    const taskId = selectedTask._id;

    try {
      await timeTrackingAPI.startTimer(taskId);
      await timeTrackingAPI.stopTimer(taskId);
    } catch (error) {
      console.error('Focus session time tracking log error:', error);
    }

    if (technique === 'pomodoro') {
      const baseTags = Array.isArray(selectedTask.tags) ? [...selectedTask.tags] : [];
      const sanitizedTags = baseTags.filter((tag) => !String(tag).startsWith('pomodoro:'));
      sanitizedTags.push(`pomodoro:${completedPomodoros}`);

      try {
        await tasksAPI.updateTask(taskId, { tags: sanitizedTags });
      } catch (error) {
        console.error('Focus session pomodoro tag update error:', error);
      }
    }

    setSessionSummary({
      technique,
      taskTitle: selectedTask.title,
      elapsedSeconds,
      elapsedMinutes: minutesFromSeconds(elapsedSeconds),
      pomodorosCompleted: completedPomodoros,
    });
  };

  const endSession = async ({ autoCompleted = false } = {}) => {
    const elapsed = sessionSecondsRef.current;
    const completed = pomodoroCompleted;

    await persistSessionLog(elapsed, completed);

    clearRunningInterval();
    setSessionActive(false);
    setSessionPaused(false);
    setSimpleElapsedSeconds(0);
    setPomodoroPhase('work');
    setPomodoroSecondsLeft(POMODORO_WORK_SECONDS);
    setPomodoroCompleted(0);
    sessionSecondsRef.current = 0;
    sessionStartedAtRef.current = null;

    if (autoCompleted) {
      setQuote('Excellent cycle complete. Take a breath and choose your next move.');
    }
  };

  const startSimpleInterval = () => {
    clearRunningInterval();
    intervalRef.current = setInterval(() => {
      sessionSecondsRef.current += 1;
      setSimpleElapsedSeconds(sessionSecondsRef.current);
    }, 1000);
  };

  const startPomodoroInterval = () => {
    clearRunningInterval();
    intervalRef.current = setInterval(() => {
      setPomodoroSecondsLeft((prev) => {
        if (sessionPausedRef.current) return prev;

        if (prev <= 1) {
          if (pomodoroPhase === 'work') {
            setPomodoroCompleted((count) => count + 1);
            setPomodoroPhase('break');
            return POMODORO_BREAK_SECONDS;
          }

          endSession({ autoCompleted: true });
          return 0;
        }

        sessionSecondsRef.current += 1;
        return prev - 1;
      });
    }, 1000);
  };

  const startSession = () => {
    if (!selectedTask) return;

    setSessionSummary(null);
    setSessionActive(true);
    setSessionPaused(false);
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

    sessionSecondsRef.current = 0;
    sessionStartedAtRef.current = Date.now();

    if (technique === 'simple') {
      setSimpleElapsedSeconds(0);
      startSimpleInterval();
    } else {
      setPomodoroPhase('work');
      setPomodoroSecondsLeft(POMODORO_WORK_SECONDS);
      setPomodoroCompleted(0);
      startPomodoroInterval();
    }
  };

  const togglePause = () => {
    setSessionPaused((prev) => {
      const next = !prev;
      if (technique === 'simple') {
        if (next) {
          clearRunningInterval();
        } else {
          startSimpleInterval();
        }
      }
      return next;
    });
  };

  const skipPomodoroPhase = () => {
    if (technique !== 'pomodoro') return;

    if (pomodoroPhase === 'work') {
      setPomodoroCompleted((count) => count + 1);
      setPomodoroPhase('break');
      setPomodoroSecondsLeft(POMODORO_BREAK_SECONDS);
      return;
    }

    endSession({ autoCompleted: true });
  };

  useEffect(() => {
    if (!sessionActive || technique !== 'pomodoro') return undefined;

    startPomodoroInterval();

    return () => clearRunningInterval();
  }, [sessionActive, technique, pomodoroPhase]);

  useEffect(() => () => clearRunningInterval(), []);

  const pomodoroCircumference = 565;
  const phaseTotal = pomodoroPhase === 'work' ? POMODORO_WORK_SECONDS : POMODORO_BREAK_SECONDS;
  const pomodoroProgress = Math.max(0, Math.min(1, pomodoroSecondsLeft / phaseTotal));
  const pomodoroOffset = pomodoroCircumference * (1 - pomodoroProgress);

  const renderTaskCard = (task, options = {}) => {
    const isSelected = String(selectedTask?._id || selectedTask?.id) === String(task._id || task.id);
    const isAiPick = Boolean(options.aiPick);

    return (
      <button
        key={task._id || task.id}
        type="button"
        onClick={() => setSelectedTask(task)}
        style={{
          width: '100%',
          textAlign: 'left',
          borderRadius: '12px',
          border: isSelected
            ? `1.5px solid ${theme.primary}`
            : isAiPick
              ? `1.5px solid ${theme.aiPurple || '#8B5CF6'}`
              : `1px solid ${theme.border}`,
          backgroundColor: theme.bgCard,
          padding: '14px',
          cursor: 'pointer',
          boxShadow: theme.shadows.neumorphic || theme.shadows.sm,
          transition: 'all 150ms ease',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <strong style={{ color: theme.textPrimary, fontSize: '14px', fontWeight: '700' }}>{task.title}</strong>
          {isAiPick && (
            <span style={{
              backgroundColor: `${theme.aiPurple || '#8B5CF6'}20`,
              color: theme.aiPurple || '#8B5CF6',
              borderRadius: '999px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: '700',
              whiteSpace: 'nowrap',
            }}>
              ⚡ AI Pick
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{
            backgroundColor: `${priorityColor(task.priority)}20`,
            color: priorityColor(task.priority),
            borderRadius: '999px',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: '700',
          }}>
            {(task.priority || 'medium').toUpperCase()}
          </span>
          <span style={{
            color: theme.textSecondary,
            fontSize: '12px',
            fontWeight: '600',
          }}>
            {task.deadline ? `Due ${new Date(task.deadline).toLocaleDateString()}` : 'No deadline'}
          </span>
        </div>
      </button>
    );
  };

  if (sessionSummary) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: `${theme.bgMain}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{
          width: 'min(560px, 100%)',
          borderRadius: '18px',
          border: `1.5px solid ${theme.success}`,
          backgroundColor: theme.bgCard,
          boxShadow: theme.shadows.float,
          padding: '26px',
        }}>
          <h2 style={{ margin: 0, color: theme.textPrimary, fontSize: '28px', fontWeight: '700' }}>Session Complete</h2>
          <p style={{ margin: '8px 0 18px', color: theme.textSecondary, fontSize: '14px' }}>
            Great work on {sessionSummary.taskTitle}.
          </p>

          <div style={{ display: 'grid', gap: '10px', marginBottom: '18px' }}>
            <div style={{ color: theme.textPrimary, fontSize: '15px', fontWeight: '600' }}>
              Time spent: <span style={{ color: theme.success }}>{formatMMSS(sessionSummary.elapsedSeconds)}</span>
            </div>
            {sessionSummary.technique === 'pomodoro' && (
              <div style={{ color: theme.textPrimary, fontSize: '15px', fontWeight: '600' }}>
                Pomodoros completed: <span style={{ color: theme.success }}>{sessionSummary.pomodorosCompleted}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                setSessionSummary(null);
                resetSessionState();
              }}
              style={{
                border: 'none',
                borderRadius: '10px',
                backgroundColor: theme.primary,
                color: '#0A0908',
                padding: '11px 16px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              Start Another
            </button>
            <button
              type="button"
              onClick={() => {
                setSessionSummary(null);
                resetSessionState();
                navigate('/tasks');
              }}
              style={{
                border: `1px solid ${theme.border}`,
                borderRadius: '10px',
                backgroundColor: theme.bgRaised,
                color: theme.textPrimary,
                padding: '11px 16px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              Back to Tasks
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (sessionActive) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 20% 10%, rgba(201,146,74,0.18), transparent 48%), radial-gradient(circle at 80% 80%, rgba(184,115,85,0.14), transparent 42%), #0b1116',
        color: theme.textPrimary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{ width: 'min(920px, 100%)', textAlign: 'center' }}>
          <h1 style={{ margin: '0 0 10px', fontSize: '34px', fontWeight: '700', color: '#F5F5F4' }}>{selectedTask?.title}</h1>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            borderRadius: '999px',
            padding: '6px 12px',
            backgroundColor: `${priorityColor(selectedTask?.priority)}24`,
            color: priorityColor(selectedTask?.priority),
            fontSize: '12px',
            fontWeight: '700',
            marginBottom: '26px',
          }}>
            {String(selectedTask?.priority || 'medium').toUpperCase()}
          </div>

          {technique === 'simple' ? (
            <>
              <div style={{
                fontSize: '72px',
                fontWeight: '500',
                letterSpacing: '-0.03em',
                color: '#F8FAFC',
                marginBottom: '18px',
              }}>
                {formatMMSS(simpleElapsedSeconds)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={togglePause}
                  style={{
                    border: 'none',
                    borderRadius: '10px',
                    backgroundColor: sessionPaused ? theme.success : theme.warning,
                    color: '#0A0908',
                    padding: '12px 18px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {sessionPaused ? <FaPlay /> : <FaPause />} {sessionPaused ? 'Resume' : 'Pause'}
                </button>
                <button
                  type="button"
                  onClick={() => endSession({ autoCompleted: false })}
                  style={{
                    border: `1px solid ${theme.error}`,
                    borderRadius: '10px',
                    backgroundColor: `${theme.error}1a`,
                    color: theme.error,
                    padding: '12px 18px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <FaStop /> End Session
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <div style={{ position: 'relative', width: '230px', height: '230px' }}>
                  <svg width="230" height="230" viewBox="0 0 230 230">
                    <circle
                      cx="115"
                      cy="115"
                      r="90"
                      stroke={`${theme.textMuted}33`}
                      strokeWidth="10"
                      fill="none"
                    />
                    <circle
                      cx="115"
                      cy="115"
                      r="90"
                      stroke={theme.primary}
                      strokeWidth="10"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray="565"
                      strokeDashoffset={pomodoroOffset}
                      transform="rotate(-90 115 115)"
                      style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                  </svg>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                  }}>
                    <div style={{ color: '#F8FAFC', fontSize: '48px', fontWeight: '600', letterSpacing: '-0.02em' }}>
                      {formatMMSS(pomodoroSecondsLeft)}
                    </div>
                    <div style={{ color: theme.primary, fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {pomodoroPhase === 'work' ? 'Work' : 'Break'}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
                {Array.from({ length: Math.max(pomodoroCompleted, 4) }).map((_, idx) => (
                  <span
                    key={`pomodoro-dot-${idx}`}
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: idx < pomodoroCompleted ? theme.primary : `${theme.textMuted}40`,
                    }}
                  />
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={togglePause}
                  style={{
                    border: 'none',
                    borderRadius: '10px',
                    backgroundColor: sessionPaused ? theme.success : theme.warning,
                    color: '#0A0908',
                    padding: '12px 18px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {sessionPaused ? <FaPlay /> : <FaPause />} {sessionPaused ? 'Resume' : 'Pause'}
                </button>
                <button
                  type="button"
                  onClick={skipPomodoroPhase}
                  style={{
                    border: `1px solid ${theme.info}`,
                    borderRadius: '10px',
                    backgroundColor: `${theme.info}1c`,
                    color: theme.info,
                    padding: '12px 18px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <FaStepForward /> Skip Phase
                </button>
                <button
                  type="button"
                  onClick={() => endSession({ autoCompleted: false })}
                  style={{
                    border: `1px solid ${theme.error}`,
                    borderRadius: '10px',
                    backgroundColor: `${theme.error}1a`,
                    color: theme.error,
                    padding: '12px 18px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <FaStop /> End Session
                </button>
              </div>
            </>
          )}

          <blockquote style={{
            margin: '0 auto',
            maxWidth: '680px',
            color: '#D6D3D1',
            fontSize: '18px',
            lineHeight: 1.6,
            fontStyle: 'italic',
          }}>
            “{quote}”
          </blockquote>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.bgMain,
      padding: '32px',
      color: theme.textPrimary,
    }}>
      <div style={{ maxWidth: '980px', margin: '0 auto' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: '34px', fontWeight: '700', letterSpacing: '-0.02em' }}>Focus Mode</h1>
        <p style={{ margin: '0 0 24px', color: theme.textSecondary, fontSize: '14px' }}>
          Pick a task, choose a focus technique, and start a distraction-free session.
        </p>

        {loadingTasks ? (
          <div style={{ color: theme.textSecondary, fontSize: '14px' }}>Loading active tasks...</div>
        ) : (
          <>
            <div style={{
              borderRadius: '16px',
              padding: '16px',
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.bgSurface,
              marginBottom: '18px',
            }}>
              <h2 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: '700' }}>Task Selector</h2>

              {aiRecommendedTask && renderTaskCard(aiRecommendedTask, { aiPick: true })}

              <div style={{
                marginTop: '12px',
                maxHeight: '280px',
                overflowY: 'auto',
                display: 'grid',
                gap: '10px',
                paddingRight: '4px',
              }}>
                {otherTasks.map((task) => renderTaskCard(task))}
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '14px',
              marginBottom: '16px',
            }}>
              <button
                type="button"
                onClick={() => setTechnique('simple')}
                style={{
                  textAlign: 'left',
                  borderRadius: '14px',
                  border: technique === 'simple' ? `1.5px solid ${theme.primary}` : `1px solid ${theme.border}`,
                  backgroundColor: theme.bgCard,
                  boxShadow: theme.shadows.neumorphic || theme.shadows.sm,
                  padding: '16px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FaStopwatch color={theme.primary} />
                  <strong style={{ color: theme.textPrimary, fontSize: '15px' }}>Simple Timer</strong>
                </div>
                <p style={{ margin: 0, color: theme.textSecondary, fontSize: '13px' }}>
                  Track elapsed time freely and stop when you are done.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTechnique('pomodoro')}
                style={{
                  textAlign: 'left',
                  borderRadius: '14px',
                  border: technique === 'pomodoro' ? `1.5px solid ${theme.primary}` : `1px solid ${theme.border}`,
                  backgroundColor: theme.bgCard,
                  boxShadow: theme.shadows.neumorphic || theme.shadows.sm,
                  padding: '16px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FaBullseye color={theme.primary} />
                  <strong style={{ color: theme.textPrimary, fontSize: '15px' }}>Pomodoro 25/5</strong>
                </div>
                <p style={{ margin: 0, color: theme.textSecondary, fontSize: '13px' }}>
                  Run 25-minute work sprints with a 5-minute break cycle.
                </p>
              </button>
            </div>

            <button
              type="button"
              disabled={!selectedTask}
              onClick={startSession}
              style={{
                width: '100%',
                border: 'none',
                borderRadius: '12px',
                padding: '14px 18px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: selectedTask ? 'pointer' : 'not-allowed',
                backgroundColor: selectedTask ? theme.primary : `${theme.primary}55`,
                color: '#0A0908',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '9px',
              }}
            >
              <FaBolt /> Start Focus Session
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default FocusPage;
