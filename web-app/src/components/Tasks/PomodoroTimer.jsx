import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaPause, FaPlay, FaRedo } from 'react-icons/fa';
import { tasksAPI, timeTrackingAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const WORK_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

const formatClock = (seconds) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const mm = String(Math.floor(safeSeconds / 60)).padStart(2, '0');
  const ss = String(safeSeconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
};

const PomodoroTimer = ({ taskId, isTracking }) => {
  const { theme } = useTheme();
  const [sessionType, setSessionType] = useState('work');
  const [secondsLeft, setSecondsLeft] = useState(WORK_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [statusText, setStatusText] = useState('Ready');

  const intervalRef = useRef(null);
  const secondsRef = useRef(WORK_SECONDS);
  const sessionTypeRef = useRef('work');
  const isRunningRef = useRef(false);
  const isTrackingRef = useRef(Boolean(isTracking));
  const pomodoroCountRef = useRef(0);

  useEffect(() => {
    isTrackingRef.current = Boolean(isTracking);
  }, [isTracking]);

  useEffect(() => {
    secondsRef.current = secondsLeft;
  }, [secondsLeft]);

  useEffect(() => {
    sessionTypeRef.current = sessionType;
  }, [sessionType]);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    pomodoroCountRef.current = pomodoroCount;
  }, [pomodoroCount]);

  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const syncPomodoroCount = useCallback(async () => {
    if (!taskId) return;

    try {
      const response = await tasksAPI.getTask(taskId);
      const fetchedTask = response?.data?.task || response?.data;
      const nextCount = Number(fetchedTask?.pomodoroCount || 0);
      setPomodoroCount(nextCount);
      pomodoroCountRef.current = nextCount;
    } catch (error) {
      console.error('Pomodoro count fetch error:', error);
    }
  }, [taskId]);

  useEffect(() => {
    syncPomodoroCount();
  }, [syncPomodoroCount]);

  const handleSessionComplete = useCallback(async () => {
    clearTimerInterval();
    setIsRunning(false);

    const currentSession = sessionTypeRef.current;

    if (currentSession === 'work') {
      try {
        await timeTrackingAPI.stopTimer(taskId);
      } catch (error) {
        console.error('Stop timer after pomodoro error:', error);
      }

      const nextCount = pomodoroCountRef.current + 1;
      setPomodoroCount(nextCount);
      pomodoroCountRef.current = nextCount;

      try {
        await tasksAPI.updateTask(taskId, { pomodoroCount: nextCount });
      } catch (error) {
        console.error('Pomodoro count update error:', error);
      }

      setSessionType('break');
      setSecondsLeft(BREAK_SECONDS);
      secondsRef.current = BREAK_SECONDS;
      setStatusText('Break time');

      setIsRunning(true);
      intervalRef.current = setInterval(() => {
        const current = secondsRef.current;
        if (current <= 1) {
          secondsRef.current = 0;
          setSecondsLeft(0);
          handleSessionComplete();
          return;
        }
        const next = current - 1;
        secondsRef.current = next;
        setSecondsLeft(next);
      }, 1000);
      return;
    }

    setSessionType('work');
    setSecondsLeft(WORK_SECONDS);
    secondsRef.current = WORK_SECONDS;
    setStatusText('Ready for next focus session');
  }, [clearTimerInterval, taskId]);

  const startInterval = useCallback(() => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(() => {
      const current = secondsRef.current;
      if (current <= 1) {
        secondsRef.current = 0;
        setSecondsLeft(0);
        handleSessionComplete();
        return;
      }
      const next = current - 1;
      secondsRef.current = next;
      setSecondsLeft(next);
    }, 1000);
  }, [handleSessionComplete]);

  const handleStart = async () => {
    if (!taskId || isRunningRef.current) return;

    if (sessionTypeRef.current === 'work' && !isTrackingRef.current) {
      try {
        await timeTrackingAPI.startTimer(taskId);
      } catch (error) {
        console.error('Start timer for pomodoro error:', error);
      }
    }

    setStatusText(sessionTypeRef.current === 'work' ? 'Focus session running' : 'Break running');
    setIsRunning(true);
    startInterval();
  };

  const handlePause = async () => {
    if (!isRunningRef.current) return;

    clearTimerInterval();
    setIsRunning(false);
    setStatusText('Paused');

    if (sessionTypeRef.current === 'work' && isTrackingRef.current) {
      try {
        await timeTrackingAPI.stopTimer(taskId);
      } catch (error) {
        console.error('Pause timer stop error:', error);
      }
    }
  };

  const handleReset = async () => {
    clearTimerInterval();
    setIsRunning(false);
    setSessionType('work');
    setSecondsLeft(WORK_SECONDS);
    secondsRef.current = WORK_SECONDS;
    setStatusText('Ready');

    if (isTrackingRef.current) {
      try {
        await timeTrackingAPI.stopTimer(taskId);
      } catch (error) {
        console.error('Reset timer stop error:', error);
      }
    }
  };

  useEffect(() => {
    return () => {
      clearTimerInterval();
    };
  }, [clearTimerInterval]);

  const radius = 54;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;

  const totalSeconds = useMemo(() => (
    sessionType === 'work' ? WORK_SECONDS : BREAK_SECONDS
  ), [sessionType]);

  const progress = useMemo(() => {
    if (!totalSeconds) return 0;
    return Math.max(0, Math.min(1, secondsLeft / totalSeconds));
  }, [secondsLeft, totalSeconds]);

  const dashOffset = circumference * (1 - progress);
  const ringColor = sessionType === 'work' ? theme.primary : theme.success;

  return (
    <div style={{
      marginTop: '16px',
      border: `1px solid ${theme.borderSubtle || theme.border}`,
      borderRadius: '14px',
      padding: '16px',
      backgroundColor: theme.bgRaised,
    }}>
      <div style={{ display: 'flex', gap: '18px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '130px', height: '130px', flexShrink: 0 }}>
          <svg width="130" height="130" viewBox="0 0 130 130">
            <circle
              cx="65"
              cy="65"
              r={radius}
              fill="none"
              stroke={`${theme.textMuted}30`}
              strokeWidth={stroke}
            />
            <circle
              cx="65"
              cy="65"
              r={radius}
              fill="none"
              stroke={ringColor}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 65 65)"
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 200ms ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{ color: theme.textPrimary, fontWeight: '800', fontSize: '24px', letterSpacing: '-0.02em' }}>
              {formatClock(secondsLeft)}
            </div>
            <div style={{ color: ringColor, fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {sessionType}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '10px', flex: 1, minWidth: '220px' }}>
          <div style={{ color: theme.textPrimary, fontWeight: '700', fontSize: '14px' }}>
            Pomodoros completed: <span style={{ color: theme.primary }}>{pomodoroCount}</span>
          </div>
          <div style={{ color: theme.textSecondary, fontSize: '13px' }}>{statusText}</div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={isRunning ? handlePause : handleStart}
              style={{
                border: 'none',
                borderRadius: '9px',
                padding: '10px 14px',
                backgroundColor: isRunning ? theme.error : theme.success,
                color: '#0A0908',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {isRunning ? <FaPause /> : <FaPlay />}
              {isRunning ? 'Pause' : 'Start'}
            </button>

            <button
              type="button"
              onClick={handleReset}
              style={{
                border: `1px solid ${theme.borderMedium || theme.border}`,
                borderRadius: '9px',
                padding: '10px 14px',
                backgroundColor: theme.bgCard,
                color: theme.textPrimary,
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <FaRedo /> Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;
