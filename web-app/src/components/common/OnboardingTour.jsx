import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { borderRadius } from '../../theme';

const SPOTLIGHT_PADDING = 10;
const TOOLTIP_WIDTH = 340;

const TOUR_STEPS = [
  {
    selector: '.fab:not(.fab-secondary)',
    title: 'Create Your First Task',
    description: 'Start here with + New Task to quickly add work items from the dashboard.',
    details: 'Tasks can include due dates, categories, priorities, and time estimates so your day plan is realistic.',
    tip: 'Use short action-first titles like "Draft weekly report" for cleaner AI suggestions.',
    route: '/dashboard',
  },
  {
    selector: 'input[name="title"] + button[type="button"]',
    title: 'Use AI Writing Assistant',
    description: 'Inside the task modal, this button drafts a polished title, description, tags, and subtasks for you.',
    details: 'This is best when you have a rough idea but want structured subtasks and cleaner wording in seconds.',
    tip: 'Enter at least a basic title or short description first for better output quality.',
    prepSelector: '.fab:not(.fab-secondary)',
    prepDelayMs: 220,
    route: '/dashboard',
  },
  {
    selector: '.sidebar-menu-item:nth-child(3)',
    title: 'Manage Projects',
    description: 'The Projects section helps you group related tasks into outcomes and milestones.',
    details: 'Projects are ideal for longer workstreams where progress spans multiple tasks and deadlines.',
    tip: 'Create one project per objective, then attach tasks to track momentum.',
    route: '/projects',
  },
  {
    selector: '.ai-prioritize-btn',
    title: 'Prioritize With AI',
    description: 'On Tasks, AI Prioritize ranks your work so you can focus on what matters most first.',
    details: 'The prioritization flow looks at urgency, effort, and deadlines to reduce context switching.',
    tip: 'Run this at the start of the day and after major schedule changes.',
    route: '/tasks',
  },
  {
    selector: '.risk-detect-btn',
    title: 'Detect Task Risks Early',
    description: 'Use Detect Risks to identify deadline collisions, blocked tasks, and workload hotspots.',
    details: 'Risk scanning gives you early warning signals so you can re-plan before deadlines slip.',
    tip: 'Run this after adding many tasks or changing due dates.',
    route: '/tasks',
  },
  {
    selector: '.sidebar-menu-item:nth-child(4)',
    title: 'Enter Focus Mode',
    description: 'Focus mode helps you work in distraction-free sessions with intentional time blocks.',
    details: 'Use this page when you want deep work intervals and better control over attention.',
    tip: 'Pick one clear task before starting a focus session.',
    route: '/focus',
  },
  {
    selector: '.sidebar-menu-item:nth-child(5)',
    title: 'Visualize Work in Kanban',
    description: 'Kanban gives you a board view of task status from backlog to completion.',
    details: 'This is ideal for seeing bottlenecks and moving tasks across progress stages quickly.',
    tip: 'Review the board daily to keep tasks flowing.',
    route: '/kanban',
  },
  {
    selector: '.sidebar-menu-item:nth-child(6)',
    title: 'Plan by Date in Calendar',
    description: 'Calendar view shows deadlines over time so you can balance your week and month.',
    details: 'Use month and week views to spot overload days and reschedule proactively.',
    tip: 'Add task dates consistently to make this view truly useful.',
    route: '/calendar',
  },
  {
    selector: '.sidebar-menu-item:nth-child(7)',
    title: 'Track AI Insights',
    description: 'Visit AI Insights to review trends, productivity signals, and strategic recommendations.',
    details: 'Insights reveal patterns in completion quality and help you decide what to improve next week.',
    tip: 'Review insights weekly to keep planning aligned with real execution.',
    route: '/insights',
  },
  {
    selector: 'button[title="Notifications"]',
    title: 'Stay Updated with Notifications',
    description: 'Open Notifications to catch reminders, status updates, and important events.',
    details: 'Unread items help you quickly spot what changed since your last session.',
    tip: 'Clear notifications after review to keep your inbox focused.',
    route: '/dashboard',
  },
  {
    selector: '#settings-page',
    title: 'Customize Your Workspace',
    description: 'Settings lets you control profile, notifications, and task preferences.',
    details: 'Tune your defaults once and the app becomes much faster to use every day.',
    tip: 'Update notification preferences first to avoid alert fatigue.',
    route: '/settings',
  },
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getTargetRect = (selector) => {
  if (!selector) {
    return null;
  }

  const target = document.querySelector(selector);
  if (!target) {
    return null;
  }

  const rect = target.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    return null;
  }

  return {
    top: Math.max(0, rect.top - SPOTLIGHT_PADDING),
    left: Math.max(0, rect.left - SPOTLIGHT_PADDING),
    width: rect.width + SPOTLIGHT_PADDING * 2,
    height: rect.height + SPOTLIGHT_PADDING * 2,
  };
};

const OnboardingTour = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [isPreparingStep, setIsPreparingStep] = useState(false);

  const currentStep = TOUR_STEPS[stepIndex];

  const finishTour = () => {
    localStorage.setItem('onboarding_complete', 'true');
    setIsVisible(false);
  };

  useEffect(() => {
    const complete = localStorage.getItem('onboarding_complete');
    if (!complete) {
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!isVisible || !currentStep?.route) {
      return;
    }

    if (location.pathname !== currentStep.route) {
      navigate(currentStep.route);
    }
  }, [currentStep?.route, isVisible, location.pathname, navigate]);

  useEffect(() => {
    if (!isVisible || !currentStep?.prepSelector) {
      return;
    }

    const hasTarget = document.querySelector(currentStep.selector);
    if (hasTarget) {
      return;
    }

    const prepTarget = document.querySelector(currentStep.prepSelector);
    if (!prepTarget) {
      return;
    }

    setIsPreparingStep(true);

    const timeoutId = window.setTimeout(() => {
      prepTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      setIsPreparingStep(false);
    }, currentStep.prepDelayMs || 150);

    return () => {
      window.clearTimeout(timeoutId);
      setIsPreparingStep(false);
    };
  }, [currentStep, isVisible]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const updateRect = () => {
      const rect = getTargetRect(currentStep?.selector);
      setTargetRect(rect);

      const target = currentStep?.selector ? document.querySelector(currentStep.selector) : null;
      if (target) {
        target.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
      }
    };

    updateRect();

    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    const observer = new MutationObserver(updateRect);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
      observer.disconnect();
    };
  }, [currentStep?.selector, isVisible, stepIndex]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        finishTour();
        return;
      }

      if (event.key === 'ArrowLeft') {
        setStepIndex((prev) => Math.max(0, prev - 1));
        return;
      }

      if (event.key === 'ArrowRight' || event.key === 'Enter') {
        setStepIndex((prev) => (prev >= TOUR_STEPS.length - 1 ? prev : prev + 1));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isVisible]);

  const tooltipPosition = useMemo(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (!targetRect) {
      return {
        top: Math.max(24, viewportHeight * 0.2),
        left: clamp((viewportWidth - TOOLTIP_WIDTH) / 2, 12, viewportWidth - TOOLTIP_WIDTH - 12),
      };
    }

    const preferBelow = targetRect.top + targetRect.height + 16;
    const fallbackAbove = targetRect.top - 180;
    const top = preferBelow + 170 < viewportHeight ? preferBelow : Math.max(16, fallbackAbove);

    const centeredLeft = targetRect.left + targetRect.width / 2 - TOOLTIP_WIDTH / 2;
    const left = clamp(centeredLeft, 12, viewportWidth - TOOLTIP_WIDTH - 12);

    return { top, left };
  }, [targetRect]);

  if (!isVisible || !currentStep) {
    return null;
  }

  const isLastStep = stepIndex === TOUR_STEPS.length - 1;
  const isFirstStep = stepIndex === 0;
  const progressPercent = ((stepIndex + 1) / TOUR_STEPS.length) * 100;
  const overlayColor = theme.type === 'dark' ? 'rgba(10, 14, 20, 0.68)' : 'rgba(18, 25, 34, 0.45)';

  const topShadeHeight = targetRect ? Math.max(0, targetRect.top) : window.innerHeight;
  const bottomShadeTop = targetRect ? targetRect.top + targetRect.height : window.innerHeight;
  const leftShadeWidth = targetRect ? Math.max(0, targetRect.left) : window.innerWidth;
  const rightShadeLeft = targetRect ? targetRect.left + targetRect.width : window.innerWidth;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483000,
        fontFamily: '"Geist", sans-serif',
        pointerEvents: 'none',
      }}
      aria-live="polite"
    >
      <style>{`
        @keyframes tourPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.015); }
          100% { transform: scale(1); }
        }
      `}</style>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: topShadeHeight, background: overlayColor }} />
      <div style={{ position: 'absolute', top: bottomShadeTop, left: 0, right: 0, bottom: 0, background: overlayColor }} />
      <div
        style={{
          position: 'absolute',
          top: targetRect ? targetRect.top : 0,
          left: 0,
          width: leftShadeWidth,
          height: targetRect ? targetRect.height : window.innerHeight,
          background: overlayColor,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: targetRect ? targetRect.top : 0,
          left: rightShadeLeft,
          right: 0,
          height: targetRect ? targetRect.height : window.innerHeight,
          background: overlayColor,
        }}
      />

      {targetRect && (
        <div
          style={{
            position: 'absolute',
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
            borderRadius: borderRadius.lg,
            boxShadow: `0 0 0 2px ${theme.bgMain}, 0 0 0 5px ${theme.accentDim || `${theme.primary}33`}, 0 0 20px ${theme.accentGlow || `${theme.primary}35`}`,
            pointerEvents: 'none',
            animation: 'tourPulse 1400ms ease-in-out infinite',
          }}
        />
      )}

      <div
        role="dialog"
        aria-label="TaskFlow AI onboarding tour"
        style={{
          position: 'fixed',
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          width: TOOLTIP_WIDTH,
          maxWidth: 'calc(100vw - 24px)',
          background: theme.bgCard,
          color: theme.textPrimary,
          border: `1px solid ${theme.borderMedium || theme.border}`,
          borderRadius: borderRadius.xl,
          padding: '16px',
          boxShadow: theme.shadows.float,
          pointerEvents: 'auto',
        }}
      >
        <div
          style={{
            width: '100%',
            height: 6,
            borderRadius: 999,
            backgroundColor: theme.bgElevated,
            border: `1px solid ${theme.border}`,
            overflow: 'hidden',
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              backgroundColor: theme.primary,
              transition: 'width 220ms ease',
            }}
          />
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 8px',
            borderRadius: borderRadius.sm,
            border: `1px solid ${theme.border}`,
            backgroundColor: theme.bgElevated,
            fontSize: 11,
            color: theme.textSecondary,
            marginBottom: 10,
            letterSpacing: '0.02em',
            fontWeight: 600,
          }}
        >
          {stepIndex + 1} of {TOUR_STEPS.length}
        </div>

        <h3
          style={{
            margin: 0,
            fontSize: 20,
            lineHeight: 1.2,
            color: theme.textPrimary,
            fontFamily: '"Fraunces", serif',
            fontWeight: 600,
          }}
        >
          {currentStep.title}
        </h3>
        <p style={{ margin: '10px 0 14px 0', color: theme.textSecondary, fontSize: 14, lineHeight: 1.45 }}>
          {currentStep.description}
        </p>

        <p
          style={{
            margin: '0 0 10px 0',
            color: theme.textSecondary,
            fontSize: 13,
            lineHeight: 1.45,
            backgroundColor: theme.bgElevated,
            border: `1px solid ${theme.border}`,
            borderRadius: borderRadius.md,
            padding: '8px 10px',
          }}
        >
          {currentStep.details}
        </p>

        <p style={{ margin: '0 0 12px 0', color: theme.info, fontSize: 12, lineHeight: 1.4 }}>
          Tip: {currentStep.tip}
        </p>

        {isPreparingStep && (
          <p style={{ margin: '0 0 12px 0', color: theme.warning, fontSize: 12 }}>
            Preparing this step for you...
          </p>
        )}

        {!targetRect && (
          <p
            style={{
              margin: '0 0 12px 0',
              color: theme.info,
              fontSize: 12,
              backgroundColor: theme.bgElevated,
              border: `1px dashed ${theme.border}`,
              borderRadius: borderRadius.md,
              padding: '8px 10px',
            }}
          >
            Navigate to the related screen to reveal this highlighted control.
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={finishTour}
              style={{
                background: 'transparent',
                color: theme.textSecondary,
                border: `1px solid ${theme.borderMedium || theme.border}`,
                borderRadius: borderRadius.md,
                padding: '8px 12px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Skip
            </button>

            <button
              type="button"
              onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
              disabled={isFirstStep}
              style={{
                background: theme.bgElevated,
                color: isFirstStep ? theme.textMuted : theme.textPrimary,
                border: `1px solid ${theme.borderMedium || theme.border}`,
                borderRadius: borderRadius.md,
                padding: '8px 12px',
                cursor: isFirstStep ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                opacity: isFirstStep ? 0.6 : 1,
              }}
            >
              Previous
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (isLastStep) {
                finishTour();
                return;
              }
              setStepIndex((prev) => prev + 1);
            }}
            style={{
              background: theme.primary,
              color: '#fff',
              border: `1px solid ${theme.primaryDark || theme.primary}`,
              borderRadius: borderRadius.md,
              padding: '8px 14px',
              cursor: 'pointer',
              fontWeight: 600,
              boxShadow: theme.shadows.xs,
            }}
          >
            {isLastStep ? 'Finish' : 'Next'}
          </button>
        </div>

        <p style={{ margin: '10px 0 0 0', color: theme.textMuted, fontSize: 11 }}>
          Shortcuts: Enter/Right = next, Left = previous, Esc = skip.
        </p>
      </div>
    </div>
  );
};

export default OnboardingTour;
