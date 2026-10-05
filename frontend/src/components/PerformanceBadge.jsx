import React from 'react';

const PerformanceBadge = ({ classification, score, showScore = false }) => {
  let badgeStyle = '';

  switch (classification?.toUpperCase()) {
    case 'GOOD':
      badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      break;
    case 'AVERAGE':
      badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
      break;
    case 'BAD':
      badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200/80';
      break;
    default:
      badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide border ${badgeStyle}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      <span>{classification?.toUpperCase()}</span>
      {showScore && score !== undefined ? <span className="opacity-75 font-semibold">· {Math.round(score)}%</span> : ''}
    </span>
  );
};

export default PerformanceBadge;
