import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInterventionById, addInterventionUpdate, updateIntervention } from '../../services/api';
import SkeletonLoader from '../../components/SkeletonLoader';

export default function InterventionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updateText, setUpdateText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchIntervention = async () => {
    try {
      const res = await getInterventionById(id);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntervention();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      await updateIntervention(id, { status: newStatus });
      fetchIntervention();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleAddUpdate = async (e) => {
    e.preventDefault();
    if (!updateText.trim()) return;
    
    setSubmitting(true);
    try {
      await addInterventionUpdate(id, { notes: updateText });
      setUpdateText('');
      fetchIntervention();
    } catch (err) {
      alert('Failed to add update');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6"><SkeletonLoader /></div>;
  if (!data || !data.intervention) return <div className="p-6 text-slate-500">Intervention not found</div>;

  const { intervention, updates, effectiveness } = data;

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'in progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'monitoring': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const isCompletedOrMonitoring = ['completed', 'monitoring'].includes(intervention.status?.toLowerCase());
  const hasImproved = effectiveness?.improvement < 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 transition cursor-pointer">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Intervention Details</h1>
            <p className="text-xs text-slate-500 mt-0.5">Faculty action tracking and risk remediation progress</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Status:</span>
          <select 
            value={intervention.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={`px-3 py-1 rounded-md text-xs font-medium border ${getStatusStyle(intervention.status)} focus:outline-hidden cursor-pointer shadow-xs`}
          >
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Monitoring">Monitoring</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-4.5 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#4655F5] text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-xs">
            {intervention.student_name?.charAt(0)}
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-0.5">Student</p>
            <p className="font-semibold text-sm text-slate-900">{intervention.student_name}</p>
            <button 
              onClick={() => navigate(`/analytics/students/${intervention.student_id}`)}
              className="text-xs text-[#4655F5] font-medium hover:underline mt-1 inline-block"
            >
              View Full Profile &rarr;
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-4.5 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center text-sm font-bold shrink-0">
            {intervention.faculty_name?.charAt(0) || 'U'}
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-0.5">Assigned To</p>
            <p className="font-semibold text-sm text-slate-900">{intervention.faculty_name || 'Unassigned'}</p>
            <p className="text-xs text-slate-500 mt-0.5">Supervising Mentor</p>
          </div>
        </div>
      </div>

      {/* Effectiveness Section - Only show if enough data */}
      {effectiveness && (isCompletedOrMonitoring || intervention.status === 'In Progress') && (
        <div className="bg-gradient-to-r from-[#4655F5] via-[#4050ee] to-[#3645DB] rounded-xl shadow-md border border-white/10 p-5 text-white">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Intervention Effectiveness Evaluation</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="space-y-1.5">
              <p className="text-xs text-white/80 font-medium">Before Intervention</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-white">{effectiveness.before_risk}%</span>
                <span className="text-xs mb-1 text-white/70">Risk</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
                <div className="bg-rose-400 h-1.5 rounded-full" style={{ width: `${Math.min(100, effectiveness.before_risk)}%` }}></div>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center py-3 md:py-0">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white text-[#4655F5] shadow-xs">
                <div className="text-center">
                  <span className="block text-base font-bold leading-none">{hasImproved ? effectiveness.improvement : `+${effectiveness.improvement}`}</span>
                  <span className="block text-[8px] uppercase tracking-wider font-semibold mt-0.5">Pts</span>
                </div>
              </div>
              <p className="text-xs text-white/90 mt-1.5 text-center font-medium">
                {hasImproved ? 'Risk Decreased' : 'Risk Increased'}
              </p>
            </div>
            
            <div className="space-y-1.5">
              <p className="text-xs text-white/80 font-medium">Current Risk</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-white">{effectiveness.current_risk}%</span>
                <span className="text-xs mb-1 text-white/70">Risk</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
                <div className={`h-1.5 rounded-full ${effectiveness.current_risk > 75 ? 'bg-rose-400' : effectiveness.current_risk > 40 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${Math.min(100, effectiveness.current_risk)}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan Details */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 space-y-5">
        <div>
          <h3 className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-3">Plan Parameters</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-[11px] text-slate-500 mb-0.5 font-medium">Type</p>
              <p className="font-semibold text-xs text-slate-900">{intervention.intervention_type}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 mb-0.5 font-medium">Target Area</p>
              <p className="font-semibold text-xs text-slate-900">{intervention.target_subject || 'General'}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 mb-0.5 font-medium">Created</p>
              <p className="font-semibold text-xs text-slate-900">{new Date(intervention.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 mb-0.5 font-medium">Target Date</p>
              <p className="font-semibold text-xs text-slate-900">{intervention.target_date ? new Date(intervention.target_date).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
          
          <div className="bg-slate-50/80 rounded-lg p-3.5 border border-slate-200/70">
            <p className="text-[11px] text-slate-500 mb-1 font-semibold uppercase tracking-wider">Initial Notes & Remedial Plan</p>
            <p className="text-slate-700 whitespace-pre-wrap text-xs leading-relaxed">{intervention.notes}</p>
          </div>
          
          {intervention.target_improvement && (
            <div className="mt-3 flex items-start gap-2 bg-indigo-50 text-[#4655F5] p-2.5 rounded-lg text-xs font-medium border border-indigo-100">
              <span className="font-semibold">Goal:</span>
              <span>{intervention.target_improvement}</span>
            </div>
          )}
        </div>
      </div>

      {/* Updates / Timeline */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-2.5">Progress Updates</h3>
        
        <div className="space-y-5">
          {/* Add update form */}
          <form onSubmit={handleAddUpdate} className="flex flex-col items-end gap-2.5">
            <textarea 
              value={updateText}
              onChange={(e) => setUpdateText(e.target.value)}
              placeholder="Add a progress update, meeting note, or observation..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-lg focus:border-[#4655F5] focus:bg-white resize-none text-xs text-slate-900 transition outline-none"
              rows={3}
            />
            <button 
              type="submit"
              disabled={submitting || !updateText.trim()}
              className="px-4 py-1.5 bg-[#4655F5] hover:bg-[#3645DB] text-white text-xs rounded-lg font-medium transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {submitting ? 'Adding...' : 'Add Update'}
            </button>
          </form>

          {/* Timeline */}
          <div className="relative border-l border-slate-200 ml-3 pl-5 space-y-4 pt-2 mt-4">
            {updates?.map((update) => (
              <div key={update.id} className="relative">
                <div className="absolute -left-[27px] bg-white p-0.5 rounded-full border border-slate-200">
                  <div className="w-2 h-2 bg-[#4655F5] rounded-full"></div>
                </div>
                <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-200/70 shadow-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-slate-900">{update.faculty_name}</span>
                    <span className="text-[10px] text-slate-400">{new Date(update.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{update.notes}</p>
                </div>
              </div>
            ))}
            
            {(!updates || updates.length === 0) && (
              <div className="text-xs text-slate-400 italic mt-2 mb-2">No updates recorded yet.</div>
            )}
            
            {/* Origin node */}
            <div className="relative">
              <div className="absolute -left-[27px] bg-white p-0.5 rounded-full border border-slate-200">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Intervention created on {new Date(intervention.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
