import React from 'react';

const shimmerStyle = {
  background: 'linear-gradient(90deg, var(--bg-card) 25%, var(--bg-elevated) 50%, var(--bg-card) 75%)',
  backgroundSize: '200% 100%',
  borderRadius: '10px',
  animation: 'shimmer 1.5s linear infinite',
};

const SkeletonAnimation = () => (
  <style>{`
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `}</style>
);

export const TaskCardSkeleton = () => {
  return (
    <div
      style={{
        borderRadius: '16px',
        padding: '20px',
        minHeight: '240px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      <SkeletonAnimation />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ ...shimmerStyle, width: '65%', height: '20px' }} />
        <div style={{ ...shimmerStyle, width: '56px', height: '24px', borderRadius: '999px' }} />
      </div>
      <div style={{ ...shimmerStyle, width: '100%', height: '14px' }} />
      <div style={{ ...shimmerStyle, width: '88%', height: '14px' }} />
      <div style={{ ...shimmerStyle, width: '72%', height: '14px' }} />
      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ ...shimmerStyle, width: '112px', height: '18px' }} />
        <div style={{ ...shimmerStyle, width: '80px', height: '18px' }} />
      </div>
    </div>
  );
};

export const StatsCardSkeleton = () => {
  return (
    <div
      style={{
        borderRadius: '16px',
        padding: '20px',
        minHeight: '145px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      <SkeletonAnimation />
      <div style={{ ...shimmerStyle, width: '38px', height: '38px', borderRadius: '12px' }} />
      <div style={{ ...shimmerStyle, width: '64%', height: '14px' }} />
      <div style={{ ...shimmerStyle, width: '46%', height: '26px' }} />
      <div style={{ ...shimmerStyle, width: '72%', height: '12px' }} />
    </div>
  );
};

export const ProjectCardSkeleton = () => {
  return (
    <div
      style={{
        borderRadius: '18px',
        padding: '22px',
        minHeight: '230px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      <SkeletonAnimation />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ ...shimmerStyle, width: '58%', height: '22px' }} />
        <div style={{ ...shimmerStyle, width: '70px', height: '24px', borderRadius: '999px' }} />
      </div>
      <div style={{ ...shimmerStyle, width: '100%', height: '14px' }} />
      <div style={{ ...shimmerStyle, width: '84%', height: '14px' }} />
      <div style={{ marginTop: '12px', ...shimmerStyle, width: '100%', height: '10px', borderRadius: '999px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
        <div style={{ ...shimmerStyle, width: '36%', height: '14px' }} />
        <div style={{ ...shimmerStyle, width: '26%', height: '14px' }} />
      </div>
    </div>
  );
};
