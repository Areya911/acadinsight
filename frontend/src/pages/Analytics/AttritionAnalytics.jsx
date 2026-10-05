import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { getAttritionAnalytics } from '../../services/api';
import RiskBadge from '../../components/RiskBadge';
import SkeletonLoader from '../../components/SkeletonLoader';

const COLORS = {
  low: '#22c55e', // green-500
  medium: '#f59e0b', // amber-500
  high: '#ef4444' // red-500
};

export default function AttritionAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getAttritionAnalytics().then(res => {
      setData(res.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-6"><SkeletonLoader /></div>;
  if (!data) return <div className="p-6 text-red-500">Failed to load attrition data</div>;

  const distributionData = [
    { name: 'Low Risk', value: data.distribution.low },
    { name: 'Medium Risk', value: data.distribution.medium },
    { name: 'High Risk', value: data.distribution.high }
  ];

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Attrition Risk Analytics</h1>
        <p className="text-xs text-slate-500 mt-0.5">Predictive evaluation and dropout probability trends across active cohorts.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4.5 shadow-xs border border-slate-200/80">
          <p className="text-slate-500 text-[11px] font-medium uppercase tracking-wider mb-1">Total Analyzed</p>
          <p className="text-2xl font-bold text-slate-900">{data.distribution.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4.5 shadow-xs border border-slate-200/80">
          <p className="text-emerald-600 text-[11px] font-medium uppercase tracking-wider mb-1">Low Risk</p>
          <p className="text-2xl font-bold text-emerald-600">{data.distribution.low}</p>
        </div>
        <div className="bg-white rounded-xl p-4.5 shadow-xs border border-slate-200/80">
          <p className="text-amber-600 text-[11px] font-medium uppercase tracking-wider mb-1">Medium Risk</p>
          <p className="text-2xl font-bold text-amber-600">{data.distribution.medium}</p>
        </div>
        <div className="bg-rose-50/40 rounded-xl p-4.5 shadow-xs border border-rose-200/80">
          <p className="text-rose-600 text-[11px] font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            High Risk
          </p>
          <p className="text-2xl font-bold text-rose-600">{data.distribution.high}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Overall Risk Distribution</h3>
            <p className="text-xs text-slate-500 mt-0.5">Ratio of students across designated danger tiers</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={distributionData} 
                  cx="50%" cy="50%" 
                  innerRadius={65} 
                  outerRadius={95} 
                  paddingAngle={5} 
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  <Cell fill={COLORS.low} />
                  <Cell fill={COLORS.medium} />
                  <Cell fill={COLORS.high} />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Risk */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Risk by Department</h3>
            <p className="text-xs text-slate-500 mt-0.5">Aggregated risk indices across engineering branches</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.department_risk} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="department" type="category" width={80} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" />
                <Bar dataKey="avg_risk" name="Average Risk Score" fill="#4655F5" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Semester Trend & Top Risk Factors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Risk Trend by Semester</h3>
            <p className="text-xs text-slate-500 mt-0.5">Longitudinal analysis across academic terms</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.semester_risk} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="semester" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" />
                <Line type="monotone" dataKey="avg_risk" name="Avg Risk Score" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Primary Risk Factors</h3>
            <p className="text-xs text-slate-500 mt-0.5">Most recurrent contributing factors to student attrition</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.top_risk_factors} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="factor" type="category" width={120} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" name="Affected Students" fill="#f59e0b" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Increasing Risk Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5">
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Students with Rapidly Increasing Risk
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Priority review for students with high upward delta in danger score</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/75 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3 rounded-l-lg">Student Name</th>
                <th className="py-2.5 px-3">Previous Risk</th>
                <th className="py-2.5 px-3">Current Risk</th>
                <th className="py-2.5 px-3">Change</th>
                <th className="py-2.5 px-3">Current Level</th>
                <th className="py-2.5 px-3 text-right rounded-r-lg">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.increasing_risk_students?.map((student) => {
                const change = student.risk_score - student.previous_risk_score;
                return (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="py-3 px-3 text-xs font-semibold text-slate-900 group-hover:text-[#4655F5] transition-colors">{student.name}</td>
                    <td className="py-3 px-3 text-xs text-slate-500">{student.previous_risk_score}%</td>
                    <td className="py-3 px-3 text-xs font-bold text-slate-900">{student.risk_score}%</td>
                    <td className="py-3 px-3 text-xs font-bold text-rose-600">+{change}%</td>
                    <td className="py-3 px-3">
                      <RiskBadge level={student.risk_score > 75 ? 'HIGH' : student.risk_score > 40 ? 'MEDIUM' : 'LOW'} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button 
                        onClick={() => navigate(`/analytics/students/${student.id}`)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-[#4655F5] hover:text-white text-[#4655F5] rounded-md transition-colors font-medium text-xs cursor-pointer inline-flex items-center gap-1 group"
                      >
                        Investigate 
                        <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {(!data.increasing_risk_students || data.increasing_risk_students.length === 0) && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400 text-xs">
                    No students with rapidly increasing risk detected.
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
