import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { getStudentAnalyticsProfile } from '../../services/api';
import RiskBadge from '../../components/RiskBadge';
import PerformanceBadge from '../../components/PerformanceBadge';
import SkeletonLoader from '../../components/SkeletonLoader';
import Icon from '../../components/Icon';
import { formatPercent, formatScore } from '../../utils/format';

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Handle "me" case for students
        let targetId = id;
        if (id === 'me') {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            targetId = user.id;
          }
        }
        
        const res = await getStudentAnalyticsProfile(targetId);
        setData(res.data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Failed to load student profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="p-6"><SkeletonLoader /></div>;
  if (error) return <div className="p-6 text-red-600 font-semibold">{error}</div>;
  if (!data || !data.student) return <div className="p-6">Student not found</div>;

  const { student, performance, risk, weak_areas, strong_areas, interventions, performance_history } = data;

  // Extract specific factors for cards
  const attendanceFactor = risk.factors?.find(f => f.name?.toLowerCase().includes('attendance'))?.value || 'N/A';
  const assignmentFactor = risk.factors?.find(f => f.name?.toLowerCase().includes('assignment'))?.value || 'N/A';
  
  const getTrendIcon = (trend) => {
    if (trend === 'Improving') return <span className="text-emerald-500 font-bold">↑</span>;
    if (trend === 'Declining') return <span className="text-red-500 font-bold">↓</span>;
    return <span className="text-slate-400 font-bold">→</span>;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'monitoring': return 'bg-purple-100 text-purple-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <button 
          onClick={() => navigate(-1)} 
          className="text-slate-600 hover:text-slate-900 flex items-center gap-1.5 text-xs font-medium transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-xs cursor-pointer"
        >
          &larr; Back
        </button>
        <button
          onClick={() => navigate(`/analytics/students/${id}/roadmap`)}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-[#4655F5] hover:bg-[#3645DB] text-white rounded-lg font-medium text-xs shadow-xs transition-all cursor-pointer"
        >
          <Icon name="map" size={14} color="#fff" />
          <span>View Recovery Roadmap</span>
        </button>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 flex flex-col md:flex-row gap-5 items-center md:items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#4655F5] flex items-center justify-center text-white text-xl font-bold shadow-xs">
            {student.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{student.name}</h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">{student.roll_number} • {student.department}</p>
            <p className="text-xs text-slate-400 mt-0.5">Semester {student.semester} • Batch {student.batch}{student.mentor_name ? ` • Mentor: ${student.mentor_name}` : ''}</p>
          </div>
        </div>
        
        <div className="flex gap-6 text-center bg-slate-50/80 border border-slate-200/80 px-5 py-3 rounded-xl">
          <div className="flex flex-col items-center">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Performance</p>
            <p className={`text-xl font-bold ${performance.classification === 'GOOD' ? 'text-emerald-600' : performance.classification === 'AVERAGE' ? 'text-[#4655F5]' : 'text-rose-600'}`}>
              {formatPercent(performance.overall_score)}
            </p>
            <div className="mt-1">
              <PerformanceBadge classification={performance.classification} />
            </div>
          </div>
          <div className="w-px h-12 bg-slate-200 self-center"></div>
          <div className="flex flex-col items-center">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Attrition Risk</p>
            <p className={`text-xl font-bold ${risk.risk_level === 'HIGH' ? 'text-rose-600' : risk.risk_level === 'MEDIUM' ? 'text-amber-600' : 'text-emerald-600'}`}>
              {formatPercent(risk.risk_score)}
            </p>
            <div className="mt-1">
              <RiskBadge level={risk.risk_level} />
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200/80 flex flex-col">
          <p className="text-slate-500 text-[11px] font-medium uppercase tracking-wider mb-1">Attendance</p>
          <p className="text-xl font-bold text-slate-900">{attendanceFactor}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200/80 flex flex-col">
          <p className="text-slate-500 text-[11px] font-medium uppercase tracking-wider mb-1">Assignments</p>
          <p className="text-xl font-bold text-slate-900">{assignmentFactor}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200/80 flex flex-col">
          <p className="text-slate-500 text-[11px] font-medium uppercase tracking-wider mb-1">Total Subjects</p>
          <p className="text-xl font-bold text-slate-900">{performance.subject_scores?.length || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200/80 flex flex-col">
          <p className="text-slate-500 text-[11px] font-medium uppercase tracking-wider mb-1">Weak Areas</p>
          <p className="text-xl font-bold text-rose-600">{weak_areas?.length || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Risk Factors */}
          {risk.factors && risk.factors.length > 0 && (
            <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-slate-900">Risk Factors Breakdown</h3>
                <p className="text-xs text-slate-500 mt-0.5">Factor weights influencing the calculated attrition score</p>
              </div>
              <div className="space-y-3.5">
                {risk.factors.map((factor, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-800">{factor.name}</span>
                      <span className="font-semibold text-slate-500">{factor.value || `${factor.impact}% impact`}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-1.5 rounded-full ${factor.impact > 30 ? 'bg-rose-500' : factor.impact > 15 ? 'bg-amber-500' : 'bg-slate-400'}`}
                        style={{ width: `${Math.min(100, factor.impact * 2)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              
              {risk.explanation && (
                <div className="mt-5 p-3.5 bg-slate-50/70 rounded-lg border border-slate-200/70">
                  <h4 className="text-[11px] font-semibold text-slate-900 mb-2 uppercase tracking-wider">AI Risk Analysis Summary</h4>
                  <ul className="list-disc pl-4 space-y-1">
                    {Array.isArray(risk.explanation) ? risk.explanation.map((exp, i) => (
                      <li key={i} className="text-xs text-slate-600 leading-relaxed">{exp}</li>
                    )) : <li className="text-xs text-slate-600 leading-relaxed">{risk.explanation}</li>}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Weak Areas */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Critical Focus Areas
              </h3>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60">
                {weak_areas?.length || 0} identified
              </span>
            </div>
            {weak_areas?.length > 0 ? (
              <div className="space-y-2.5">
                {weak_areas.map((area, idx) => (
                  <div key={idx} className="p-3 border border-slate-200/70 bg-slate-50/60 rounded-lg hover:border-slate-300 transition-colors">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-medium text-xs text-slate-900">{area.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded">{formatPercent(area.score)}</span>
                        {getTrendIcon(area.trend)}
                      </div>
                    </div>
                    <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${area.score}%` }}></div>
                    </div>
                    <p className="text-[10px] font-medium text-slate-400 mt-1.5 uppercase tracking-wider">{area.type}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No critical weak areas identified.</p>
            )}
          </div>

          {/* Strong Areas */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Proficient & Strong Areas
              </h3>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                {strong_areas?.length || 0} areas
              </span>
            </div>
            {strong_areas?.length > 0 ? (
              <div className="space-y-2.5">
                {strong_areas.map((area, idx) => (
                  <div key={idx} className="p-3 border border-slate-200/70 bg-slate-50/60 rounded-lg hover:border-slate-300 transition-colors">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-medium text-xs text-slate-900">{area.name}</span>
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded">{formatPercent(area.score)}</span>
                    </div>
                    <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${area.score}%` }}></div>
                    </div>
                    <p className="text-[10px] font-medium text-slate-400 mt-1.5 uppercase tracking-wider">{area.type}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No distinct strong areas identified yet.</p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Performance Trend */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-900">Performance Trend</h3>
              <p className="text-xs text-slate-500 mt-0.5">Historical average scores vs attrition risk progression</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performance_history} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="semester" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" />
                  <Line yAxisId="left" type="monotone" dataKey="avg_score" name="Avg Score" stroke="#4655F5" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line yAxisId="right" type="monotone" dataKey="risk_score" name="Risk Score" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Subject Breakdown */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-900">Subject Breakdown</h3>
              <p className="text-xs text-slate-500 mt-0.5">All registered courses and assessed examination grades</p>
            </div>
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-xs">
                  <tr className="border-b border-slate-200/80 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3">Sem</th>
                    <th className="py-2.5 px-3">Score</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {performance.subject_scores?.map((subject, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 text-xs font-semibold text-slate-900">{subject.name}</td>
                      <td className="py-2.5 px-3 text-xs text-slate-500">{subject.semester}</td>
                      <td className="py-2.5 px-3 text-xs font-bold text-slate-900">{formatPercent(subject.score)}</td>
                      <td className="py-2.5 px-3">
                        <PerformanceBadge classification={subject.classification} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Interventions - Only show for faculty/admin */}
      {id !== 'me' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Intervention Plan & Follow-ups</h3>
              <p className="text-xs text-slate-500 mt-0.5">Faculty-directed remedial actions and monitoring milestones</p>
            </div>
            <button 
              onClick={() => navigate(`/interventions/create?student_id=${student.id}`)}
              className="bg-[#4655F5] hover:bg-[#3645DB] text-white px-3.5 py-1.5 rounded-lg font-medium transition-all text-xs shadow-xs cursor-pointer"
            >
              + Create New Intervention
            </button>
          </div>
          
          {interventions?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {interventions.map((inv) => (
                <div 
                  key={inv.id} 
                  className="border border-slate-200/80 bg-slate-50/60 rounded-lg p-3.5 hover:border-slate-300 hover:bg-white transition-all cursor-pointer shadow-xs" 
                  onClick={() => navigate(`/interventions/${inv.id}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-slate-900 text-xs">{inv.intervention_type}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(inv.status)}`}>
                      {inv.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-1.5 font-medium">By {inv.faculty_name} on {new Date(inv.created_at).toLocaleDateString()}</p>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{inv.notes}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-50/70 rounded-lg border border-slate-200/70">
              <p className="text-slate-400 text-xs mb-2 font-medium">No active interventions for this student.</p>
              {risk.risk_level === 'HIGH' && (
                <p className="text-rose-600 font-medium text-xs flex items-center justify-center gap-1.5">
                  <Icon name="warning" size={14} color="#e11d48" />
                  <span>This student is HIGH RISK. Immediate intervention is strongly recommended.</span>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
