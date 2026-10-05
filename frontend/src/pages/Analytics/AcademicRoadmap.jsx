import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudentRoadmap } from '../../services/api';
import Icon from '../../components/Icon';

const PRIORITY_CONFIG = {
  critical: { color: '#ef4444', bg: '#fef2f2', label: 'Critical', dot: '#dc2626' },
  high:     { color: '#f97316', bg: '#fff7ed', label: 'High',     dot: '#ea580c' },
  medium:   { color: '#eab308', bg: '#fefce8', label: 'Medium',   dot: '#ca8a04' },
};

const WEEK_COLORS = [
  '#6366f1','#8b5cf6','#0ea5e9','#10b981','#f59e0b','#ef4444','#ec4899','#14b8a6'
];

const CATEGORY_ICON_NAMES = {
  Assessment: 'search',
  Planning: 'clipboard',
  Attendance: 'school',
  Assignment: 'pencil',
  'Subject Remediation': 'book',
  'Peer Learning': 'peer',
  Practice: 'pencil',
  Memory: 'memory',
  Reflection: 'brain',
  Mentorship: 'user',
  'Error Analysis': 'microscope',
  Summary: 'clipboard',
  'Exam Prep': 'chart-bar',
  Revision: 'refresh',
  'Deep Learning': 'brain',
  Wellness: 'heart',
  Confidence: 'star',
  Administration: 'clipboard',
  'Depth Practice': 'target',
};

const RESOURCE_TYPE_CONFIG = {
  Practice: { icon: 'pencil', color: '#6366f1' },
  'Concept Review': { icon: 'book', color: '#0ea5e9' },
  'Seek Help': { icon: 'user', color: '#10b981' },
  Resource: { icon: 'link', color: '#8b5cf6' },
  Lab: { icon: 'microscope', color: '#f59e0b' },
  'Coding Practice': { icon: 'code', color: '#14b8a6' },
  Project: { icon: 'rocket', color: '#6366f1' },
  Debug: { icon: 'cpu', color: '#ef4444' },
  default: { icon: 'clipboard', color: '#64748b' },
};

function RiskBanner({ riskLevel, riskScore }) {
  const configs = {
    HIGH: { bg: 'linear-gradient(135deg, #fef2f2, #fee2e2)', border: '#fca5a5', accent: '#ef4444', label: 'High Attrition Risk', iconName: 'warning' },
    MEDIUM: { bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '#fcd34d', accent: '#f59e0b', label: 'Medium Risk', iconName: 'info' },
    LOW: { bg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '#86efac', accent: '#22c55e', label: 'Low Risk', iconName: 'check-circle' },
  };
  const c = configs[riskLevel] || configs.LOW;
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 14, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={c.iconName} size={24} color={c.accent} />
      </div>
      <div>
        <div style={{ fontWeight: 700, color: c.accent, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{c.label}</div>
        <div style={{ color: '#374151', fontSize: 15, marginTop: 2 }}>Risk Score: <strong>{riskScore}</strong> / 100</div>
      </div>
    </div>
  );
}

function ScoreGauge({ score, label }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 75 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
  const r = 36, cx = 44, cy = 44, strokeW = 8;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={88} height={88}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={strokeW} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={strokeW}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize={15} fontWeight={700} fill={color}>{Math.round(pct)}%</text>
      </svg>
      <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{label}</span>
    </div>
  );
}

function SubjectCard({ action }) {
  const pc = PRIORITY_CONFIG[action.priority] || PRIORITY_CONFIG.medium;
  const [open, setOpen] = useState(false);
  const fill = (action.current_score / 75) * 100;
  return (
    <div style={{ border: `1px solid #e5e7eb`, borderLeft: `4px solid ${pc.color}`, borderRadius: 12, padding: '16px 20px', background: '#fff', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
      onClick={() => setOpen(o => !o)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{action.subject}</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Sem {action.semester} · ~{action.estimated_weeks_to_target} weeks to target</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ background: pc.bg, color: pc.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase' }}>{pc.label}</span>
          <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} color="#9ca3af" />
        </div>
      </div>
      {/* Progress bar */}
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
          <span>Current: {action.current_score}%</span><span>Target: {action.target_score}%</span>
        </div>
        <div style={{ height: 6, borderRadius: 99, background: '#f3f4f6', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, fill)}%`, background: pc.color, borderRadius: 99, transition: 'width 1s ease' }} />
        </div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>Gap: {action.gap}% to proficiency</div>
      </div>
      {open && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f3f4f6' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recommended Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {action.resources.map((r, i) => {
              const rc = RESOURCE_TYPE_CONFIG[r.type] || RESOURCE_TYPE_CONFIG.default;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: '#f9fafb' }}>
                  <Icon name={rc.icon} size={16} color={rc.color} />
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: rc.color, textTransform: 'uppercase' }}>{r.type}</span>
                    <div style={{ fontSize: 13, color: '#374151' }}>{r.title}</div>
                  </div>
                  {r.priority === 'high' && (
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="star" size={12} color="#ef4444" /> HIGH
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function WeekCard({ week, color, isActive, onToggle }) {
  return (
    <div style={{ border: `1px solid #e5e7eb`, borderRadius: 14, overflow: 'hidden', background: '#fff', marginBottom: 12 }}>
      <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', cursor: 'pointer', background: isActive ? `${color}08` : '#fff', transition: 'background 0.2s' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>{week.week}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: '#111827', fontSize: 15 }}>{week.title}</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>Focus: {week.focus} · {week.tasks.length} tasks</div>
        </div>
        <Icon name={isActive ? 'chevron-up' : 'chevron-down'} size={16} color="#9ca3af" />
      </div>
      {isActive && (
        <div style={{ padding: '4px 20px 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {week.tasks.map((t, i) => {
              const iconName = CATEGORY_ICON_NAMES[t.category] || 'clipboard';
              const isEquilibrium = t.task?.includes('[Equilibrium') || t.task?.includes('[Spillover') || t.task?.includes('[Cross-Subject');
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 10, background: isEquilibrium ? '#eff6ff' : '#f8fafc', border: isEquilibrium ? '1px solid #bfdbfe' : 'none' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: isEquilibrium ? '#dbeafe' : `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name={isEquilibrium ? 'scale' : iconName} size={15} color={isEquilibrium ? '#2563eb' : color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: isEquilibrium ? '#1e40af' : '#1f2937', fontWeight: isEquilibrium ? 600 : 500 }}>{t.task}</div>
                    <div style={{ fontSize: 11, color: isEquilibrium ? '#3b82f6' : '#9ca3af', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {isEquilibrium ? 'Balance Guardrail' : t.category}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MilestoneTimeline({ milestones }) {
  return (
    <div style={{ position: 'relative', paddingLeft: 24 }}>
      <div style={{ position: 'absolute', left: 11, top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom, #6366f1, #8b5cf6, #0ea5e9)', borderRadius: 2 }} />
      {milestones.map((m, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: i < milestones.length - 1 ? 24 : 0, position: 'relative' }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', border: '2px solid #6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: -11, zIndex: 1, boxShadow: '0 0 0 3px #ede9fe' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1' }} />
          </div>
          <div style={{ paddingTop: 1 }}>
            <div style={{ fontSize: 11, color: '#8b5cf6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Week {m.week}</div>
            <div style={{ fontSize: 14, color: '#1f2937', fontWeight: 500, marginTop: 2 }}>{m.milestone}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Clean, Student-Friendly Multi-Subject Balance Interface
 */
function StudentFriendlyBalanceTab({ balanceData }) {
  if (!balanceData) return <div className="p-4 text-slate-500">No balance data available.</div>;

  const [simFocusShare, setSimFocusShare] = useState(balanceData.recommended_split?.primary_recovery || 40);

  // Group subjects into intuitive student categories
  const focusSubjects = balanceData.subject_allocations?.filter(s => s.role.includes('Primary') || s.role.includes('Secondary')) || [];
  const watchOutSubjects = balanceData.subject_allocations?.filter(s => s.role.includes('Maintenance') || s.role.includes('Spillover')) || [];
  const safeSubjects = balanceData.subject_allocations?.filter(s => s.role.includes('Mastery') || s.role.includes('Retention') || s.role.includes('Buffer')) || [];

  // Feedback based on slider
  const isTooHigh = simFocusShare > 60;
  const isModerate = simFocusShare >= 50 && simFocusShare <= 60;
  const isBalanced = simFocusShare < 50;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Simple Concept Banner */}
      <div style={{
        background: '#f8fafc',
        border: '1.5px solid #cbd5e1',
        borderRadius: 16,
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16
      }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="scale" size={22} color="#4338ca" />
        </div>
        <div>
          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 16 }}>
            Multi-Subject Study Balance
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
            <strong>Why this plan is different:</strong> When students spend all their study time on one difficult subject, their other subjects get neglected and grades drop. This plan gives you a clear weekly schedule so you boost your weak subjects <em>while keeping all your other courses safe</em>.
          </p>
        </div>
      </div>

      {/* 3 Step Student Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
        {/* Card 1: Focus */}
        <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="target" size={18} color="#dc2626" />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#991b1b', textTransform: 'uppercase' }}>1. Focus Subjects</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#b91c1c', marginTop: 8 }}>
            {focusSubjects.reduce((sum, s) => sum + s.weekly_hours, 0).toFixed(1)} hrs/week
          </div>
          <p style={{ fontSize: 13, color: '#7f1d1d', margin: '4px 0 0', lineHeight: 1.5 }}>
            Heavy practice & problem solving in: <strong>{focusSubjects.map(s => s.subject_name).join(', ') || 'None'}</strong>
          </p>
        </div>

        {/* Card 2: Watch Out */}
        <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="shield" size={18} color="#d97706" />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#92400e', textTransform: 'uppercase' }}>2. Watch-Out Courses</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#b45309', marginTop: 8 }}>
            {watchOutSubjects.reduce((sum, s) => sum + s.weekly_hours, 0).toFixed(1)} hrs/week
          </div>
          <p style={{ fontSize: 13, color: '#78350f', margin: '4px 0 0', lineHeight: 1.5 }}>
            Regular review so these don't drop: <strong>{watchOutSubjects.map(s => s.subject_name).join(', ') || 'None'}</strong>
          </p>
        </div>

        {/* Card 3: Safe */}
        <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="star" size={18} color="#16a34a" />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>3. Safe Courses</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#15803d', marginTop: 8 }}>
            {safeSubjects.reduce((sum, s) => sum + s.weekly_hours, 0).toFixed(1)} hrs/week
          </div>
          <p style={{ fontSize: 13, color: '#14532d', margin: '4px 0 0', lineHeight: 1.5 }}>
            Quick weekly flashcards & summary: <strong>{safeSubjects.map(s => s.subject_name).join(', ') || 'None'}</strong>
          </p>
        </div>
      </div>

      {/* Simple Study Recipe */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '22px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Icon name="clock" size={20} color="#4f46e5" />
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Your Daily Study Recipe (How to split your study sessions)
          </h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 10, borderLeft: '4px solid #4f46e5' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5' }}>STEP 1 • 50 MINS</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>Main Problem Solving</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Practice difficult questions in {balanceData.primary_target}.</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 10, borderLeft: '4px solid #f59e0b' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#d97706' }}>STEP 2 • 25 MINS</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>Quick Maintenance</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Read notes or do 3 problems in a secondary subject.</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 10, borderLeft: '4px solid #10b981' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>STEP 3 • 15 MINS</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>Flashcard Recall</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Test yourself on formulas across all courses.</div>
          </div>
        </div>
      </div>

      {/* Interactive Balance Checker Slider */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '22px 26px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Study Focus Checker: What happens if I study only one subject?
            </h3>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
              Slide to see how over-focusing on <strong>{balanceData.primary_target}</strong> affects your other grades.
            </p>
          </div>
          <button 
            onClick={() => setSimFocusShare(40)}
            style={{ fontSize: 12, color: '#4f46e5', fontWeight: 700, background: '#eef2ff', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}
          >
            Reset to Recommended (40%)
          </button>
        </div>

        <div style={{ margin: '20px 0 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
            <span>Time dedicated to {balanceData.primary_target}:</span>
            <span style={{ color: isTooHigh ? '#dc2626' : isModerate ? '#d97706' : '#2563eb', fontSize: 16 }}>{simFocusShare}% of total study hours</span>
          </div>
          <input 
            type="range" 
            min="30" 
            max="85" 
            value={simFocusShare} 
            onChange={(e) => setSimFocusShare(Number(e.target.value))}
            style={{ width: '100%', accentColor: isTooHigh ? '#dc2626' : '#4f46e5', cursor: 'pointer' }}
          />
        </div>

        {/* Live Status Pill */}
        <div style={{
          padding: '12px 16px',
          borderRadius: 10,
          background: isTooHigh ? '#fef2f2' : isModerate ? '#fffbeb' : '#f0fdf4',
          border: `1px solid ${isTooHigh ? '#fecaca' : isModerate ? '#fde68a' : '#bbf7d0'}`,
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <Icon name={isTooHigh ? 'warning' : isModerate ? 'info' : 'check-circle'} size={18} color={isTooHigh ? '#dc2626' : isModerate ? '#d97706' : '#16a34a'} />
          <div style={{ fontSize: 13, fontWeight: 600, color: isTooHigh ? '#991b1b' : isModerate ? '#92400e' : '#166534' }}>
            {isTooHigh
              ? `High Risk of Grade Drop: Spending ${simFocusShare}% of your time on one course leaves almost zero time for other subjects. Your other grades will likely drop.`
              : isModerate
              ? `Watch Out: Spending ${simFocusShare}% on one course is workable for 1 week, but make sure to catch up on other subjects over the weekend.`
              : `Optimal Balance: Great split. You will improve your weak subjects without risking your grades in other courses.`}
          </div>
        </div>
      </div>

      {/* Detailed Subject List with Simple Tips */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '22px 26px' }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>
          Weekly Target Hours per Subject (Total: {balanceData.total_weekly_budget_hours} hrs/wk)
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {balanceData.subject_allocations?.map((sub, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{sub.subject_name}</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Current: {sub.current_score}%</span>
                </div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{sub.routine}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ background: '#e0e7ff', color: '#4338ca', fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 12 }}>
                  {sub.weekly_hours} hrs/week ({sub.share_percentage}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AcademicRoadmap() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeWeek, setActiveWeek] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        setLoading(true);
        let targetId = id;
        if (id === 'me') {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const u = JSON.parse(userStr);
            targetId = u.id;
          }
        }
        const res = await getStudentRoadmap(targetId);
        setRoadmap(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to generate roadmap. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchRoadmap();
  }, [id]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid #e5e7eb', borderTop: '4px solid #6366f1', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#6b7280', fontSize: 15 }}>Generating your personalised roadmap…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <Icon name="warning" size={40} color="#ef4444" style={{ marginBottom: 12 }} />
      <p style={{ color: '#ef4444', fontWeight: 600 }}>{error}</p>
      <button onClick={() => navigate(-1)} style={{ marginTop: 16, padding: '8px 20px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', color: '#374151' }}>← Back</button>
    </div>
  );

  if (!roadmap) return null;

  const tabs = [
    { key: 'overview', label: 'Overview', icon: 'chart-bar' },
    { key: 'balance', label: 'Study Balance', icon: 'scale' },
    { key: 'subjects', label: `Subjects (${roadmap.subject_actions.length})`, icon: 'book' },
    { key: 'weekly', label: `Weekly Plan (${roadmap.duration_weeks} wks)`, icon: 'calendar' },
    { key: 'milestones', label: 'Milestones', icon: 'flag' },
  ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 0 48px' }}>
      {/* Back */}
      <button onClick={() => navigate(-1)} style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, padding: '12px 0', marginBottom: 8 }}>
        <Icon name="arrow-left" size={16} /> Back
      </button>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #0ea5e9 100%)', borderRadius: 20, padding: '32px 36px', color: '#fff', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -60, right: 80, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.75, marginBottom: 6 }}>Academic Recovery Roadmap</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, marginBottom: 4 }}>{roadmap.student_name}</h1>
          <div style={{ opacity: 0.8, fontSize: 14, marginBottom: 24 }}>Generated {new Date(roadmap.generated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <ScoreGauge score={roadmap.overall_score} label="Overall Score" />
            <ScoreGauge score={100 - roadmap.risk_score} label="Health Score" />
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Duration', value: `${roadmap.duration_weeks} Weeks` },
                  { label: 'Risk Level', value: roadmap.risk_level },
                  { label: 'Weak Subjects', value: roadmap.subject_actions.length },
                  { label: 'Study Balance', value: roadmap.multi_subject_balance?.spillover_level ? 'Protected' : 'Standard' },
                ].map((stat, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ fontSize: 10, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(roadmap.attendance_alert || roadmap.assignment_alert) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {roadmap.attendance_alert && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 12, padding: '12px 18px' }}>
              <Icon name="warning" size={20} color="#d97706" />
              <div style={{ fontSize: 14, color: '#92400e', fontWeight: 500 }}>
                <strong>Attendance Warning:</strong> Your attendance is flagged as a critical risk factor. Improving attendance should be your immediate first priority.
              </div>
            </div>
          )}
          {roadmap.assignment_alert && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, padding: '12px 18px' }}>
              <Icon name="clipboard" size={20} color="#dc2626" />
              <div style={{ fontSize: 14, color: '#7f1d1d', fontWeight: 500 }}>
                <strong>Assignment Alert:</strong> Pending or incomplete assignments are significantly affecting your academic standing. Address these first.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: '#f3f4f6', borderRadius: 12, padding: 4, marginBottom: 24, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ flex: 1, minWidth: 120, padding: '10px 8px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s', background: activeTab === t.key ? '#fff' : 'transparent', color: activeTab === t.key ? '#4f46e5' : '#6b7280', boxShadow: activeTab === t.key ? '0 1px 6px rgba(0,0,0,0.08)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Icon name={t.icon} size={15} color={activeTab === t.key ? '#4f46e5' : '#6b7280'} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <RiskBanner riskLevel={roadmap.risk_level} riskScore={roadmap.risk_score} />

          {/* Balance Quick Callout */}
          {roadmap.multi_subject_balance && (
            <div 
              onClick={() => setActiveTab('balance')} 
              style={{
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderRadius: 14,
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="scale" size={18} color="#4338ca" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 14 }}>Multi-Subject Study Balance Active</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    Click here to see your exact weekly study time split across all courses.
                  </div>
                </div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#4f46e5', display: 'flex', alignItems: 'center', gap: 4 }}>
                View Balance Plan <Icon name="arrow-right" size={14} color="#4f46e5" />
              </span>
            </div>
          )}

          {/* Summary */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '24px 28px' }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="robot" size={18} color="#4f46e5" />
              <span>Academic Analysis</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {roadmap.summary.map((line, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 10, background: '#f8fafc' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', marginTop: 7, flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.6 }}>{line}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Skill gaps if any */}
          {roadmap.skill_gaps.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '24px 28px' }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="target" size={18} color="#4f46e5" />
                <span>Skill Gaps</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {roadmap.skill_gaps.map((s, i) => (
                  <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{s.name}</div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Score: {s.score}% · Gap: {s.gap}%</div>
                    <div style={{ height: 4, borderRadius: 99, background: '#f3f4f6', marginTop: 8, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(s.score / 75) * 100}%`, background: '#8b5cf6', borderRadius: 99 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Multi-Subject Balance */}
      {activeTab === 'balance' && (
        <StudentFriendlyBalanceTab balanceData={roadmap.multi_subject_balance} />
      )}

      {/* Tab: Subjects */}
      {activeTab === 'subjects' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {roadmap.subject_actions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
              <Icon name="check-circle" size={48} color="#16a34a" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>No weak subjects detected!</div>
              <p style={{ fontSize: 14, marginTop: 6 }}>All your subjects are performing above the proficiency threshold. Keep it up!</p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Click on a subject card to see specific action plan. Sorted by urgency (worst first).</div>
              {roadmap.subject_actions.map((action, i) => (
                <SubjectCard key={i} action={action} />
              ))}
            </>
          )}
        </div>
      )}

      {/* Tab: Weekly Plan */}
      {activeTab === 'weekly' && (
        <div>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>Click a week to expand its task list. Each week includes <strong>Balance Guardrail Tasks</strong> so you don't fall behind in other subjects.</div>
          {roadmap.weekly_plan.map((week, i) => (
            <WeekCard
              key={i}
              week={week}
              color={WEEK_COLORS[i % WEEK_COLORS.length]}
              isActive={activeWeek === i}
              onToggle={() => setActiveWeek(activeWeek === i ? -1 : i)}
            />
          ))}
        </div>
      )}

      {/* Tab: Milestones */}
      {activeTab === 'milestones' && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '28px 32px' }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="flag" size={20} color="#4f46e5" />
            <span>Recovery Milestones</span>
          </div>
          <MilestoneTimeline milestones={roadmap.milestones} />

          <div style={{ marginTop: 32, padding: '20px 24px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 14 }}>
            <div style={{ fontWeight: 700, color: '#166534', fontSize: 15, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="check-circle" size={18} color="#16a34a" />
              <span>Balanced Commitment Pledge</span>
            </div>
            <p style={{ fontSize: 14, color: '#166534', margin: 0, lineHeight: 1.7 }}>
              By following this roadmap consistently, you commit to attending all classes, following the balanced multi-subject weekly study split, and doing light weekly revision so that fixing weak subjects never causes your other grades to slip.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
