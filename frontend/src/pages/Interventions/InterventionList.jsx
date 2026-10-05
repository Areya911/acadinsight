import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInterventions } from '../../services/api';
import SkeletonLoader from '../../components/SkeletonLoader';

export default function InterventionList() {
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchInterventions();
  }, [statusFilter]);

  const fetchInterventions = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'ALL' ? { status: statusFilter } : {};
      const res = await getInterventions(params);
      setInterventions(res.data.interventions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'in progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'monitoring': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200'; // Pending
    }
  };

  const getRiskColor = (score) => {
    if (score > 75) return 'text-red-600 font-bold';
    if (score > 40) return 'text-amber-600 font-bold';
    return 'text-green-600 font-bold';
  };

  const pendingCount = interventions.filter(i => i.status?.toLowerCase() === 'pending').length;
  const inProgressCount = interventions.filter(i => i.status?.toLowerCase() === 'in progress').length;
  const completedCount = interventions.filter(i => i.status?.toLowerCase() === 'completed').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Intervention Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track, supervise, and assign academic support initiatives.</p>
        </div>
        <button 
          onClick={() => navigate('/interventions/create')}
          className="bg-[#4655F5] hover:bg-[#3645DB] text-white px-3.5 py-1.5 rounded-lg font-medium transition-all text-xs shadow-xs cursor-pointer"
        >
          + Create New Intervention
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4.5 shadow-xs border border-slate-200/80">
          <p className="text-slate-500 text-[11px] font-medium uppercase tracking-wider mb-1">Total Interventions</p>
          <p className="text-2xl font-bold text-slate-900">{interventions.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4.5 shadow-xs border border-slate-200/80">
          <p className="text-slate-500 text-[11px] font-medium uppercase tracking-wider mb-1">Pending</p>
          <p className="text-2xl font-bold text-slate-900">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4.5 shadow-xs border border-slate-200/80">
          <p className="text-[#4655F5] text-[11px] font-medium uppercase tracking-wider mb-1">In Progress</p>
          <p className="text-2xl font-bold text-[#4655F5]">{inProgressCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4.5 shadow-xs border border-slate-200/80">
          <p className="text-emerald-600 text-[11px] font-medium uppercase tracking-wider mb-1">Completed</p>
          <p className="text-2xl font-bold text-emerald-600">{completedCount}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-1.5 flex gap-1.5 overflow-x-auto">
        {['ALL', 'Pending', 'In Progress', 'Monitoring', 'Completed'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === status 
                ? 'bg-[#4655F5] text-white shadow-xs' 
                : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 overflow-hidden">
        {loading ? (
          <div className="p-6"><SkeletonLoader /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/75 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3 rounded-l-lg">Student</th>
                  <th className="py-2.5 px-3">Intervention Type</th>
                  <th className="py-2.5 px-3">Assigned Faculty</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Risk Change</th>
                  <th className="py-2.5 px-3">Target Date</th>
                  <th className="py-2.5 px-3 text-right rounded-r-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {interventions.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-900 text-xs group-hover:text-[#4655F5] transition-colors">{inv.student_name}</p>
                      <button 
                        onClick={() => navigate(`/analytics/students/${inv.student_id}`)}
                        className="text-[11px] text-[#4655F5] font-medium hover:underline mt-0.5 inline-block"
                      >
                        View Profile
                      </button>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200/80">
                        {inv.intervention_type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-500">{inv.faculty_name}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusStyle(inv.status)}`}>
                        {inv.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span className={getRiskColor(inv.before_risk_score)}>{inv.before_risk_score}%</span>
                        <span className="text-slate-400">→</span>
                        <span className={getRiskColor(inv.current_risk_score)}>{inv.current_risk_score}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-500">
                      {inv.target_date ? new Date(inv.target_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button 
                        onClick={() => navigate(`/interventions/${inv.id}`)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-[#4655F5] hover:text-white text-[#4655F5] rounded-md transition-colors font-medium text-xs cursor-pointer"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
                {interventions.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-400 text-xs">
                      No interventions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
