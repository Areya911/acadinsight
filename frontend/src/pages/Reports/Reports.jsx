import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import { getMyScores, getClassPerformance } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import FilterBar from '../../components/FilterBar';
import SkeletonLoader from '../../components/SkeletonLoader';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-slate-800 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-slate-600">
          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

function exportCSV(data, filename) {
  const headers = ['Skill', 'Test Score', 'Assignment Score', 'Quiz Score', 'Total Score', 'Status'];
  const rows = data.map(s => [
    s.skill_name,
    s.test_score,
    s.assignment_score,
    s.quiz_score,
    s.total_score,
    s.total_score >= 75 ? 'Strong' : s.total_score >= 50 ? 'Average' : 'Weak'
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Reports({ user }) {
  const [scores, setScores] = useState([]);
  const [classData, setClassData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        if (user?.role === 'student') {
          const res = await getMyScores();
          setScores(res.data);
        } else {
          const res = await getClassPerformance();
          setClassData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.role]);

  const categories = useMemo(() => {
    const items = user?.role === 'student' ? scores : classData;
    return [...new Set(items.map(s => s.category).filter(Boolean))];
  }, [scores, classData, user?.role]);

  const filteredScores = useMemo(() => {
    if (!selectedCategory) return scores;
    return scores.filter(s => s.category === selectedCategory);
  }, [scores, selectedCategory]);

  const handleFilterChange = (key, value) => {
    if (key === 'category') setSelectedCategory(value);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="skeleton h-7 w-32 mb-2" />
          <div className="skeleton h-4 w-48" />
        </div>
        <SkeletonLoader type="chart" />
        <SkeletonLoader type="table" rows={5} />
      </div>
    );
  }

  const isStudent = user?.role === 'student';

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Reports</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {isStudent ? 'Detailed score breakdown and analysis' : 'Class performance analytics'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <FilterBar
            filters={{ categories, selectedCategory }}
            onFilterChange={handleFilterChange}
          />
          {isStudent && (
            <button
              onClick={() => exportCSV(filteredScores, `skill-report-${user.name}.csv`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all btn-primary"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          )}
        </div>
      </div>

      {isStudent ? (
        <>
          {/* Score Table */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Score Breakdown</h3>
                <p className="text-xs text-slate-400 mt-0.5">Detailed scores per assessment type</p>
              </div>
              <span className="text-xs text-slate-400">{filteredScores.length} skills</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Skill</th>
                    <th className="text-center p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Test</th>
                    <th className="text-center p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Assignment</th>
                    <th className="text-center p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Quiz</th>
                    <th className="text-center p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                    <th className="text-center p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredScores.map((s) => (
                    <tr key={s.id} className="border-b border-slate-50 table-row-hover transition-colors">
                      <td className="p-3">
                        <div>
                          <p className="font-medium text-slate-700">{s.skill_name}</p>
                          {s.category && <p className="text-[10px] text-slate-400">{s.category}</p>}
                        </div>
                      </td>
                      <td className="p-3 text-center text-slate-600">{s.test_score}</td>
                      <td className="p-3 text-center text-slate-600">{s.assignment_score}</td>
                      <td className="p-3 text-center text-slate-600">{s.quiz_score}</td>
                      <td className="p-3 text-center">
                        <span className="font-bold text-slate-900">{s.total_score}%</span>
                      </td>
                      <td className="p-3 text-center">
                        <StatusBadge score={s.total_score} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Class Performance Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-800">Class Skill Averages</h3>
              <p className="text-xs text-slate-400 mt-0.5">Min, average, and max scores per skill</p>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={classData.map((c) => ({
                name: c.skill_name,
                avg: parseInt(c.avg_score),
                min: c.min_score,
                max: c.max_score
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} iconType="circle" iconSize={8} />
                <Bar dataKey="avg" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Average" barSize={20} />
                <Bar dataKey="min" fill="#ef4444" radius={[4, 4, 0, 0]} name="Min" barSize={20} />
                <Bar dataKey="max" fill="#22c55e" radius={[4, 4, 0, 0]} name="Max" barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Class Table */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Performance Summary</h3>
                <p className="text-xs text-slate-400 mt-0.5">Detailed breakdown by skill</p>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Skill</th>
                  <th className="text-center p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Score</th>
                  <th className="text-center p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Min</th>
                  <th className="text-center p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Max</th>
                  <th className="text-center p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Students</th>
                  <th className="text-center p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {classData.map((c, i) => (
                  <tr key={i} className="border-b border-slate-50 table-row-hover transition-colors">
                    <td className="p-3 font-medium text-slate-700">{c.skill_name}</td>
                    <td className="p-3 text-center font-bold text-slate-900">{c.avg_score}%</td>
                    <td className="p-3 text-center text-slate-600">{c.min_score}</td>
                    <td className="p-3 text-center text-slate-600">{c.max_score}</td>
                    <td className="p-3 text-center text-slate-600">{c.student_count}</td>
                    <td className="p-3 text-center">
                      <StatusBadge score={parseInt(c.avg_score)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
