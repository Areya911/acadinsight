import React from 'react';

const RiskBadge = ({ level, score, showScore = false }) => {
  let badgeStyle = '';
  let pulse = false;

  switch (level?.toUpperCase()) {
    case 'HIGH':
      badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200/80';
      pulse = true;
      break;
    case 'MEDIUM':
      badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200/80';
      break;
    case 'LOW':
      badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      break;
    default:
      badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide border ${badgeStyle}`}>
      <span className={`w-1.5 h-1.5 rounded-full bg-current ${pulse ? 'animate-pulse' : ''}`} />
      <span>{level?.toUpperCase()}</span>
      {showScore && score !== undefined ? <span className="opacity-75 font-semibold">· {score}</span> : ''}
    </span>
  );
};

export default RiskBadge;
