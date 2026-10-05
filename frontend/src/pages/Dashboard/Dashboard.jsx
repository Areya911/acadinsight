import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';
import { getDashboardStats, getAlerts, getStudentRisk, getStudentWeakAreas } from '../../services/api';
import Card from '../../components/Card';
import RiskBadge from '../../components/RiskBadge';
import NotificationCard from '../../components/NotificationCard';
import StatusBadge from '../../components/StatusBadge';
import SkeletonLoader from '../../components/SkeletonLoader';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-slate-800 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-slate-600">
          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-semibold">{p.value}%</span>
        </p>
      ))}
    </div>
  );
};

const getBarColor = (score) => {
  if (score >= 75) return '#22c55e';
  if (score >= 50) return '#3b82f6';
  return '#ef4444';
};

import Icon from '../../components/Icon';

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [riskData, setRiskData] = useState(null);
  const [weakAreas, setWeakAreas] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, alertsRes] = await Promise.all([
          getDashboardStats(),
          getAlerts()
        ]);
        setStats(statsRes.data);
        setAlerts(alertsRes.data);

        if (user?.role === 'student' && user?.id) {
          const [riskRes, weakRes] = await Promise.all([
            getStudentRisk(user.id).catch(() => ({ data: null })),
            getStudentWeakAreas(user.id).catch(() => ({ data: { weak_areas: [] } }))
          ]);
          if (riskRes.data) setRiskData(riskRes.data);
          if (weakRes.data) setWeakAreas(weakRes.data.weak_areas || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="skeleton h-7 w-48 mb-2" />
          <div className="skeleton h-4 w-64" />
        </div>
        <SkeletonLoader type="card" />
        <SkeletonLoader type="chart" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <svg className="w-12 h-12 mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <p className="text-sm font-medium">Failed to load dashboard</p>
      </div>
    );
  }

  const isStudent = user?.role === 'student';

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Welcome back, {user?.name}
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          {isStudent ? "Here's your academic performance overview and learning progress" : 'Monitor student progress and class performance'}
        </p>
      </div>

      {/* Stats Cards */}
      {isStudent ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4.5 mb-6 stagger-children">
          <Card title="Skills Tracked" value={stats.totalSkills} color="blue" icon="skills" />
          <Card
            title="Your Average"
            value={`${stats.averageScore}%`}
            color="purple"
            icon="average"
            trend={stats.averageScore - stats.classAverage}
            subtitle={`Class avg: ${stats.classAverage}%`}
          />
          <Card title="Strongest Skill" value={stats.bestSkill} color="green" icon="best" />
          <Card title="Needs Improvement" value={stats.weakestSkill} color="red" icon="weak" />
          <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between card-hover">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">My Attrition Risk</p>
              <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            {riskData ? (
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
                  {riskData.risk_score}%
                </p>
                <div>
                  <RiskBadge level={riskData.risk_level} />
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Loading risk...</p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5 mb-6 stagger-children">
          <Card title="Total Students" value={stats.totalStudents} color="blue" icon="students" />
          <Card title="Skills Tracked" value={stats.totalSkills} color="purple" icon="skills" />
          <Card title="Class Average" value={`${stats.averageScore}%`} color="green" icon="class" />
        </div>
      )}

      {/* Recovery Roadmap CTA Banner — student only */}
      {isStudent && (
        <div className="relative overflow-hidden rounded-xl p-6 sm:p-7 mb-6 bg-gradient-to-r from-slate-900 via-slate-800 to-[#2A3CB9] text-white shadow-sm border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="relative z-10">
            <div className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider mb-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Adaptive Intelligence Engine</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-white mb-1.5 flex items-center gap-2.5 tracking-tight">
              <Icon name="map" size={18} color="#a5b4fc" />
              <span>Personalised Academic Recovery Roadmap</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {riskData?.risk_level === 'HIGH'
                ? 'High Attrition Risk detected. Your tailored multi-week recovery plan is ready with focused subject balancing.'
                : riskData?.risk_level === 'MEDIUM'
                ? 'Your AI roadmap has an adaptive multi-subject equilibrium plan prepared for you.'
                : 'Explore your customized study schedule to maintain top percentile standing and balanced subject effort.'}
            </p>
          </div>
          <button
            onClick={() => navigate(`/analytics/students/${user?.id}/roadmap`)}
            className="shrink-0 bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs px-5 py-2.5 rounded-lg shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            View My Roadmap →
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {isStudent ? 'Skill Scores vs Class Average' : 'Top Students'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isStudent ? 'Comparative breakdown across assessed competencies' : 'Ranked by overall semester performance'}
              </p>
            </div>
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-[#4655F5] border border-indigo-100">
              {isStudent ? `${stats.scores?.length || 0} Skills` : `${stats.topStudents?.length || 0} Students`}
            </span>
          </div>
          
          {((isStudent && (!stats.scores || stats.scores.length === 0)) || (!isStudent && (!stats.topStudents || stats.topStudents.length === 0))) ? (
            <div className="flex items-center justify-center h-64 text-slate-400">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-sm font-medium">No data available</p>
                <p className="text-xs text-slate-400 mt-1">
                  {isStudent ? 'No skill scores recorded yet' : 'No student data available'}
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full" style={{ height: '340px' }}>
              {isStudent && stats.scores && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={stats.scores.map(s => ({
                      name: s.skill_name,
                      yourScore: Number(s.total_score),
                      classAverage: Number(s.class_avg || 0)
                    }))}
                    margin={{ top: 20, right: 30, left: 10, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      angle={-35}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="bg-white border border-slate-200/90 rounded-xl shadow-lg p-3 text-xs">
                            <p className="font-semibold text-slate-900 mb-1.5">{label}</p>
                            {payload.map((p, i) => (
                              <p key={i} className="text-slate-600 flex items-center justify-between gap-4 py-0.5">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                  {p.name}
                                </span>
                                <span className="font-semibold text-slate-900">{p.value}%</span>
                              </p>
                            ))}
                          </div>
                        );
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                      iconType="circle"
                      iconSize={8}
                    />
                    <Bar dataKey="yourScore" fill="#4655F5" name="Your Score" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="classAverage" fill="#cbd5e1" name="Class Average" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
              
              {!isStudent && stats.topStudents && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={stats.topStudents.map(s => ({
                      name: s.name,
                      avgScore: Number(s.avg_score)
                    }))}
                    margin={{ top: 20, right: 30, left: 10, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      angle={-35}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip />
                    <Legend 
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                      iconType="circle"
                      iconSize={8}
                    />
                    <Bar dataKey="avgScore" fill="#4655F5" name="Avg Score" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </div>
        {/* Right panel - Alerts or Activity */}
        <div className="space-y-5">
          {alerts.length > 0 && <NotificationCard alerts={alerts} />}

          {/* Quick stats / Recent scores */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">
                {isStudent ? 'Score Breakdown' : 'Attention Required'}
              </h3>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                {isStudent ? 'Live Assessment' : 'Threshold Watch'}
              </span>
            </div>
            <div className="space-y-3">
              {isStudent ? (
                stats.scores?.slice(0, 5).map((s) => (
                  <div key={s.skill_name} className="flex items-center justify-between py-1">
                    <span className="text-xs text-slate-700 font-medium truncate flex-1 pr-2">{s.skill_name}</span>
                    <div className="flex items-center gap-2.5">
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${s.total_score}%`,
                            backgroundColor: getBarColor(s.total_score),
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-900 w-8 text-right">{s.total_score}%</span>
                      <StatusBadge score={s.total_score} />
                    </div>
                  </div>
                ))
              ) : (
                stats.lowPerformers?.length > 0 ? (
                  stats.lowPerformers.map((lp, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 text-[11px] font-bold">
                          {lp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900">{lp.name}</p>
                          <p className="text-[11px] text-slate-500">{lp.skill_name}</p>
                        </div>
                      </div>
                      <StatusBadge score={lp.total_score} />
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">All students performing well</p>
                )
              )}
            </div>
          </div>

          {/* Weak Areas Section (Student only) */}
          {isStudent && weakAreas.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Priority Focus Areas
                </h3>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60">
                  {weakAreas.length} subjects
                </span>
              </div>
              <div className="space-y-2.5">
                {weakAreas.map((area, idx) => (
                  <div key={idx} className="bg-slate-50/70 border border-slate-200/60 p-3 rounded-lg hover:border-slate-300 transition-colors">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-semibold text-slate-800">{area.name}</span>
                      <span className="text-xs font-bold text-amber-600">{area.score}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${area.score}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
