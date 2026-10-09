import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { getAnalyticsOverview, triggerRecalculate } from '../../services/api';
import RiskBadge from '../../components/RiskBadge';
import PerformanceBadge from '../../components/PerformanceBadge';
import SkeletonLoader from '../../components/SkeletonLoader';
import { formatPercent } from '../../utils/format';

const COLORS = {
  good: '#10b981', // emerald-500
  average: '#4655F5', // royal blue
  bad: '#ef4444', // red-500
  low: '#10b981', // green-500
  medium: '#f59e0b', // amber-500
  high: '#ef4444' // red-500
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recalculating, setRecalculating] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const res = await getAnalyticsOverview();
      setData(res.data);
      setLastRefreshed(new Date());
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load analytics data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await triggerRecalculate();
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to recalculate analytics.');
    } finally {
      setRecalculating(false);
    }
  };

  if (loading && !data) return <div className="p-6"><SkeletonLoader /></div>;
  if (error) return <div className="p-6 text-red-600 font-semibold">{error}</div>;
  if (!data) return null;

  const performanceData = [
    { name: 'Good', value: data.good_count },
    { name: 'Average', value: data.average_count },
    { name: 'Bad', value: data.bad_count }
  ];

  const riskData = [
    { name: 'Low Risk', value: data.low_risk },
    { name: 'Medium Risk', value: data.medium_risk },
    { name: 'High Risk', value: data.high_risk }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Performance Intervention Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-refreshes every 30s • Last updated: {lastRefreshed.toLocaleTimeString()}
          </p>
        </div>
        <button 
          onClick={handleRecalculate}
          disabled={recalculating}
          className="bg-[#4655F5] hover:bg-[#3645DB] text-white text-xs font-medium px-3.5 py-1.5 rounded-lg shadow-xs transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
        >
          <svg className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {recalculating ? 'Recalculating...' : 'Recalculate All'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-4.5 shadow-xs border border-slate-200/80 flex flex-col items-center justify-center">
          <p className="text-slate-500 text-[11px] font-medium uppercase tracking-wider mb-1">Total Students</p>
          <p className="text-2xl font-bold text-slate-900">{data.totalStudents}</p>
        </div>
        <div className="bg-white rounded-xl p-4.5 shadow-xs border border-slate-200/80 flex flex-col items-center justify-center">
          <p className="text-emerald-600 text-[11px] font-medium uppercase tracking-wider mb-1">Good</p>
          <p className="text-2xl font-bold text-emerald-600">{data.good_count}</p>
        </div>
        <div className="bg-white rounded-xl p-4.5 shadow-xs border border-slate-200/80 flex flex-col items-center justify-center">
          <p className="text-[#4655F5] text-[11px] font-medium uppercase tracking-wider mb-1">Average</p>
          <p className="text-2xl font-bold text-[#4655F5]">{data.average_count}</p>
        </div>
        <div className="bg-white rounded-xl p-4.5 shadow-xs border border-slate-200/80 flex flex-col items-center justify-center">
          <p className="text-rose-600 text-[11px] font-medium uppercase tracking-wider mb-1">At-Risk (Bad)</p>
          <p className="text-2xl font-bold text-rose-600">{data.bad_count}</p>
        </div>
        <div 
          className="bg-rose-50/40 rounded-xl p-4.5 shadow-xs border border-rose-200/80 flex flex-col items-center justify-center cursor-pointer hover:border-rose-300 transition-colors" 
          onClick={() => navigate('/analytics/attrition')}
        >
          <p className="text-rose-600 text-[11px] font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            High Risk
          </p>
          <p className="text-2xl font-bold text-rose-600">{data.high_risk}</p>
        </div>
        <div className="bg-white rounded-xl p-4.5 shadow-xs border border-slate-200/80 flex flex-col items-center justify-center">
          <p className="text-indigo-600 text-[11px] font-medium uppercase tracking-wider mb-1">Avg Performance</p>
          <p className="text-2xl font-bold text-indigo-600">{formatPercent(data.avg_performance)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Distribution */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Performance Distribution</h3>
              <p className="text-xs text-slate-500 mt-0.5">Categorization across cohorts</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={performanceData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  <Cell fill={COLORS.good} />
                  <Cell fill={COLORS.average} />
                  <Cell fill={COLORS.bad} />
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Risk Distribution</h3>
              <p className="text-xs text-slate-500 mt-0.5">Attrition risk tier segmentation</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  <Cell fill={COLORS.low} />
                  <Cell fill={COLORS.medium} />
                  <Cell fill={COLORS.high} />
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Department & Semester Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Department Risk Analysis</h3>
              <p className="text-xs text-slate-500 mt-0.5">Average risk index per engineering department</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.department_risk} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="department" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="avg_risk" fill="#4655F5" name="Average Risk Score" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Semester Risk Trend</h3>
              <p className="text-xs text-slate-500 mt-0.5">Average risk level across active semesters</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.semester_risk} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="semester" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="avg_risk" fill="#f59e0b" name="Average Risk Score" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* High Risk Students */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Students Requiring Immediate Intervention</h3>
            <p className="text-xs text-slate-500 mt-0.5">Students identified with critical academic or attrition risk scores</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/75 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3 rounded-l-lg">Student</th>
                <th className="py-2.5 px-3">Dept/Sem</th>
                <th className="py-2.5 px-3">Performance</th>
                <th className="py-2.5 px-3">Risk Status</th>
                <th className="py-2.5 px-3 text-right rounded-r-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.high_risk_students?.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center shrink-0">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-xs group-hover:text-[#4655F5] transition-colors">{student.name}</p>
                        <p className="text-[11px] text-slate-400">{student.roll_number}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-xs text-slate-500">
                    {student.department} • Sem {student.semester}
                  </td>
                  <td className="py-3 px-3">
                    <PerformanceBadge classification={student.classification} score={student.overall_score} showScore />
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-col gap-1">
                      <RiskBadge level={student.risk_level} score={student.risk_score} showScore />
                      <div className="w-full bg-slate-100 rounded-full h-1 max-w-[100px] overflow-hidden">
                        <div 
                          className="bg-rose-500 h-1 rounded-full" 
                          style={{ width: `${student.risk_score}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button 
                        onClick={() => navigate(`/analytics/students/${student.id}`)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                      >
                        Profile
                      </button>
                      <button 
                        onClick={() => navigate(`/interventions/create?student_id=${student.id}`)}
                        className="px-2.5 py-1 text-xs font-medium text-white bg-[#4655F5] hover:bg-[#3645DB] rounded-md transition-colors shadow-xs"
                      >
                        Intervene
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.high_risk_students?.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400 text-xs">
                    No high-risk students found. Excellent!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
