import React, { useState, useEffect } from 'react';
import { getSubjectAnalytics } from '../../services/api';
import SkeletonLoader from '../../components/SkeletonLoader';
import Icon from '../../components/Icon';

export default function SubjectAnalytics() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getSubjectAnalytics().then(res => {
      setSubjects(res.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setError('Failed to load subject analytics');
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-6"><SkeletonLoader /></div>;
  if (error) return <div className="p-6 text-red-600 font-semibold">{error}</div>;

  const totalSubjects = subjects.length;
  const sortedSubjects = [...subjects].sort((a, b) => a.avg_score - b.avg_score);
  const mostDifficult = sortedSubjects[0];
  const bestPerforming = sortedSubjects[sortedSubjects.length - 1];

  const getDifficultyColor = (score) => {
    if (score < 50) return '#f43f5e'; // red
    if (score < 75) return '#f59e0b'; // amber
    return '#10b981'; // green
  };

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Subject Performance Analytics</h1>
        <p className="text-xs text-slate-500 mt-0.5">Detailed distribution and risk concentration across all academic subjects.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4.5 shadow-xs border border-slate-200/80 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-[11px] font-medium uppercase tracking-wider mb-1">Total Subjects</p>
            <p className="text-2xl font-bold text-slate-900">{totalSubjects}</p>
          </div>
          <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-[#4655F5]">
            <Icon name="book" size={20} color="#4655F5" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4.5 shadow-xs border border-slate-200/80 flex items-center justify-between">
          <div>
            <p className="text-rose-600 text-[11px] font-semibold uppercase tracking-wider mb-1">Most Difficult Subject</p>
            <p className="text-base font-semibold text-slate-900 line-clamp-1">{mostDifficult?.subject_name || 'N/A'}</p>
            <p className="text-xs text-rose-600 font-medium mt-0.5">Cohort Avg: {mostDifficult?.avg_score}%</p>
          </div>
          <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center text-rose-600">
            <Icon name="warning" size={20} color="#e11d48" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4.5 shadow-xs border border-slate-200/80 flex items-center justify-between">
          <div>
            <p className="text-emerald-600 text-[11px] font-semibold uppercase tracking-wider mb-1">Best Performing Subject</p>
            <p className="text-base font-semibold text-slate-900 line-clamp-1">{bestPerforming?.subject_name || 'N/A'}</p>
            <p className="text-xs text-emerald-600 font-medium mt-0.5">Cohort Avg: {bestPerforming?.avg_score}%</p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
            <Icon name="trophy" size={20} color="#059669" />
          </div>
        </div>
      </div>

      {/* Subject Cards Grid */}
      <div className="flex items-center justify-between mt-8 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Detailed Subject Breakdown</h3>
          <p className="text-xs text-slate-500 mt-0.5">Curriculum subjects mapped with performance and attrition exposure</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {subjects.map((sub, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-4.5 hover:border-slate-300 transition-all">
            <h4 className="font-semibold text-slate-900 text-sm mb-2.5 line-clamp-1" title={sub.subject_name}>
              {sub.subject_name}
            </h4>
            
            <div className="mb-4">
              <div className="flex justify-between items-end mb-1.5">
                <span className="text-xs font-medium text-slate-500">Average Score</span>
                <span className="font-bold text-slate-900 text-sm">{sub.avg_score}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="h-1.5 rounded-full" 
                  style={{ width: `${sub.avg_score}%`, backgroundColor: getDifficultyColor(sub.avg_score) }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>Min: {sub.min_score}%</span>
                <span>Max: {sub.max_score}%</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Student Performance Spread</p>
              <div className="flex gap-1 h-1.5 rounded-full overflow-hidden w-full mb-3 bg-slate-100">
                <div style={{ width: `${(sub.good_count / sub.total_students) * 100}%` }} className="bg-emerald-500" title={`Good: ${sub.good_count}`}></div>
                <div style={{ width: `${(sub.average_count / sub.total_students) * 100}%` }} className="bg-[#4655F5]" title={`Average: ${sub.average_count}`}></div>
                <div style={{ width: `${(sub.bad_count / sub.total_students) * 100}%` }} className="bg-rose-500" title={`Bad: ${sub.bad_count}`}></div>
              </div>
              
              <div className="flex justify-between items-center bg-slate-50/80 p-2 rounded-lg border border-slate-200/60">
                <div className="text-left">
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Enrolled</p>
                  <p className="font-semibold text-slate-800 text-xs">{sub.total_students} students</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-rose-600 font-medium uppercase tracking-wider">At Risk</p>
                  <p className="font-semibold text-rose-600 text-xs">{sub.high_risk_count} students</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
