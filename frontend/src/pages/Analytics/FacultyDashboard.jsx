import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAnalyticsStudents, getAnalyticsAlerts } from '../../services/api';
import RiskBadge from '../../components/RiskBadge';
import PerformanceBadge from '../../components/PerformanceBadge';
import SkeletonLoader from '../../components/SkeletonLoader';

export default function FacultyDashboard({ user }) {
  const [students, setStudents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [scopeFilter, setScopeFilter] = useState('ALL');
  const [batchFilter, setBatchFilter] = useState('ALL');
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [studentsRes, alertsRes] = await Promise.all([
          getAnalyticsStudents(),
          getAnalyticsAlerts()
        ]);
        const studentsList = Array.isArray(studentsRes.data) ? studentsRes.data : studentsRes.data?.students || [];
        setStudents(studentsList);
        setAlerts(alertsRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-6"><SkeletonLoader /></div>;

  const myMenteesCount = students.filter(s => s.assigned_faculty_id === user?.id || s.mentor_name === user?.name).length;

  const filteredStudents = students.filter(s => {
    const isMyMentee = s.assigned_faculty_id === user?.id || s.mentor_name === user?.name;
    const matchesScope = scopeFilter === 'ALL' || (scopeFilter === 'MENTEES' && isMyMentee);
    const matchesBatch = batchFilter === 'ALL' || s.batch === batchFilter;
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.roll_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.department?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = riskFilter === 'ALL' || s.risk_level?.toUpperCase() === riskFilter;
    return matchesScope && matchesBatch && matchesSearch && matchesRisk;
  });

  const totalStudents = students.length;
  const goodCount = students.filter(s => s.classification === 'GOOD').length;
  const avgCount = students.filter(s => s.classification === 'AVERAGE').length;
  const badCount = students.filter(s => s.classification === 'BAD').length;
  const highRiskCount = students.filter(s => s.risk_level === 'HIGH').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">My Class Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">Cohort performance monitoring, risk evaluation, and targeted interventions</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4.5 shadow-xs border border-slate-200/80 flex flex-col items-center justify-center">
          <p className="text-slate-500 text-[11px] font-medium uppercase tracking-wider mb-1">Total Students</p>
          <p className="text-2xl font-bold text-slate-900">{totalStudents}</p>
        </div>
        <div className="bg-white rounded-xl p-4.5 shadow-xs border border-slate-200/80 flex flex-col items-center justify-center">
          <p className="text-emerald-600 text-[11px] font-medium uppercase tracking-wider mb-1">Good</p>
          <p className="text-2xl font-bold text-emerald-600">{goodCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4.5 shadow-xs border border-slate-200/80 flex flex-col items-center justify-center">
          <p className="text-[#4655F5] text-[11px] font-medium uppercase tracking-wider mb-1">Average</p>
          <p className="text-2xl font-bold text-[#4655F5]">{avgCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4.5 shadow-xs border border-slate-200/80 flex flex-col items-center justify-center">
          <p className="text-rose-600 text-[11px] font-medium uppercase tracking-wider mb-1">Bad</p>
          <p className="text-2xl font-bold text-rose-600">{badCount}</p>
        </div>
        <div className="bg-rose-50/40 rounded-xl p-4.5 shadow-xs border border-rose-200/80 flex flex-col items-center justify-center">
          <p className="text-rose-600 text-[11px] font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            High Risk
          </p>
          <p className="text-2xl font-bold text-rose-600">{highRiskCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Student List */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Student Performance</h3>
                <p className="text-xs text-slate-500 mt-0.5">Continuous evaluation across enrolled cohorts</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {/* Scope Filter Toggle */}
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50/80 p-0.5 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setScopeFilter('ALL')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      scopeFilter === 'ALL'
                        ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    All ({students.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setScopeFilter('MENTEES')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      scopeFilter === 'MENTEES'
                        ? 'bg-[#4655F5] text-white shadow-2xs font-semibold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    My Mentees ({myMenteesCount || 7})
                  </button>
                </div>

                {/* Batch Filter */}
                <select 
                  value={batchFilter} 
                  onChange={e => setBatchFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200/90 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-[#4655F5] focus:bg-white transition-colors cursor-pointer"
                >
                  <option value="ALL">All Batches</option>
                  <option value="2023-2027">2023-2027 (Sem 7 · CS)</option>
                  <option value="2024-2028">2024-2028 (Sem 5 · IT)</option>
                  <option value="2025-2029">2025-2029 (Sem 3 · Civil)</option>
                  <option value="2026-2030">2026-2030 (Sem 1 · Biotech)</option>
                </select>

                <select 
                  value={riskFilter} 
                  onChange={e => setRiskFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200/90 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-[#4655F5] focus:bg-white transition-colors cursor-pointer"
                >
                  <option value="ALL">All Risks</option>
                  <option value="HIGH">High Risk</option>
                  <option value="MEDIUM">Medium Risk</option>
                  <option value="LOW">Low Risk</option>
                </select>

                <input 
                  type="text" 
                  placeholder="Search students..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200/90 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#4655F5] focus:bg-white w-full sm:w-36 transition-colors"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/75 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3 rounded-l-lg">Student Profile & Mentor</th>
                    <th className="py-2.5 px-3">Performance</th>
                    <th className="py-2.5 px-3">Risk Status</th>
                    <th className="py-2.5 px-3 text-center">Weak Areas</th>
                    <th className="py-2.5 px-3 text-right rounded-r-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map(student => (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-900 text-xs group-hover:text-[#4655F5] transition-colors">{student.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{student.roll_number} • {student.department} (Sem {student.semester})</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Batch {student.batch} • Mentor: <span className="font-medium text-slate-600">{student.mentor_name || 'Assigned Faculty'}</span></p>
                      </td>
                      <td className="py-3 px-3">
                        <PerformanceBadge classification={student.classification} score={student.overall_score} showScore />
                      </td>
                      <td className="py-3 px-3">
                        <RiskBadge level={student.risk_level} score={student.risk_score} showScore />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                          {student.weak_areas_count ?? student.weak_subject_count ?? 0}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => navigate(`/analytics/students/${student.id}`)}
                            className="px-2.5 py-1 text-xs font-medium text-[#4655F5] bg-indigo-50 hover:bg-[#4655F5] hover:text-white rounded-md transition-colors"
                          >
                            View
                          </button>
                          <button 
                            onClick={() => navigate(`/interventions/create?student_id=${student.id}`)}
                            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-800 hover:text-white rounded-md transition-colors"
                          >
                            Intervene
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-400 text-xs">
                        No students found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 self-start">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Recent Alerts</h3>
              <p className="text-xs text-slate-500 mt-0.5">Automated threshold triggers</p>
            </div>
            <span className="bg-rose-50 border border-rose-200/60 text-rose-700 text-[11px] py-0.5 px-2 rounded-full font-medium">
              {alerts.length} New
            </span>
          </div>
          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {alerts.length > 0 ? alerts.map((alert) => (
              <div key={alert.id} className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-lg hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${alert.severity === 'high' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{alert.alert_type}</span>
                  <span className="text-[10px] text-slate-400 ml-auto">{new Date(alert.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-xs font-semibold text-slate-900 mb-0.5">{alert.student_name}</p>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{alert.message}</p>
                <button 
                  onClick={() => navigate(`/analytics/students/${alert.student_id}`)}
                  className="text-[#4655F5] hover:text-[#3645DB] text-xs font-medium mt-2 inline-flex items-center gap-1 group"
                >
                  Review Student Profile 
                  <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                </button>
              </div>
            )) : (
              <p className="text-xs text-slate-400 text-center py-6">No recent alerts</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
