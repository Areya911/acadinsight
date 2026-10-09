import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  getMyScores,
  getClassPerformance,
  getStudentSemesterMarks,
  getAllStudents,
  getStudentScores,
  getStudentSemesterMarksById
} from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import FilterBar from '../../components/FilterBar';
import SkeletonLoader from '../../components/SkeletonLoader';
import { formatScore, formatPercent } from '../../utils/format';

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
    s.test_score ?? '',
    s.assignment_score ?? '',
    s.quiz_score ?? '',
    s.total_score ?? '',
    (s.total_score || s.score) >= 75 ? 'Strong' : (s.total_score || s.score) >= 50 ? 'Average' : 'Weak'
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

function exportMarksCSV(marks, filename) {
  const headers = ['Semester', 'Subject', 'Marks', 'Max Marks', 'Grade'];
  const rows = marks.map(m => [
    m.semester,
    m.subject_name,
    m.marks,
    m.max_marks || 100,
    m.grade || 'N/A'
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
  const [semesterMarks, setSemesterMarks] = useState([]);
  const [classData, setClassData] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedStudentScores, setSelectedStudentScores] = useState([]);
  const [selectedStudentMarks, setSelectedStudentMarks] = useState([]);
  const [studentLoading, setStudentLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('all');

  const isStudent = user?.role === 'student';

  useEffect(() => {
    const load = async () => {
      try {
        if (isStudent) {
          const [scoreRes, marksRes] = await Promise.all([
            getMyScores().catch(() => ({ data: [] })),
            getStudentSemesterMarks().catch(() => ({ data: [] }))
          ]);
          setScores(scoreRes.data || []);
          setSemesterMarks(marksRes.data || []);
        } else {
          const [classRes, studentsRes] = await Promise.all([
            getClassPerformance().catch(() => ({ data: [] })),
            getAllStudents().catch(() => ({ data: { students: [] } }))
          ]);
          setClassData(classRes.data || []);
          const studentList = studentsRes.data?.students || [];
          setAllStudents(studentList);
          if (studentList.length > 0) {
            setSelectedStudentId(studentList[0].id.toString());
          }
        }
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.role, isStudent]);

  // When faculty selects a different student in the dropdown
  useEffect(() => {
    if (!isStudent && selectedStudentId) {
      const loadSelectedStudent = async () => {
        setStudentLoading(true);
        try {
          const [scRes, mrkRes] = await Promise.all([
            getStudentScores(selectedStudentId).catch(() => ({ data: { scores: [] } })),
            getStudentSemesterMarksById(selectedStudentId).catch(() => ({ data: [] }))
          ]);
          setSelectedStudentScores(scRes.data?.scores || []);
          setSelectedStudentMarks(mrkRes.data || []);
        } catch (err) {
          console.error('Failed to load student details:', err);
        } finally {
          setStudentLoading(false);
        }
      };
      loadSelectedStudent();
    }
  }, [selectedStudentId, isStudent]);

  const categories = useMemo(() => {
    const items = isStudent ? scores : (selectedStudentScores.length > 0 ? selectedStudentScores : classData);
    return [...new Set(items.map(s => s.category).filter(Boolean))];
  }, [scores, selectedStudentScores, classData, isStudent]);

  const filteredScores = useMemo(() => {
    const base = isStudent ? scores : selectedStudentScores;
    if (!selectedCategory) return base;
    return base.filter(s => s.category === selectedCategory);
  }, [scores, selectedStudentScores, selectedCategory, isStudent]);

  const filteredMarks = useMemo(() => {
    const base = isStudent ? semesterMarks : selectedStudentMarks;
    if (selectedSemester === 'all') return base;
    return base.filter(m => m.semester === parseInt(selectedSemester));
  }, [semesterMarks, selectedStudentMarks, selectedSemester, isStudent]);

  const availableSemesters = useMemo(() => {
    const base = isStudent ? semesterMarks : selectedStudentMarks;
    const sems = [...new Set(base.map(m => m.semester))].filter(Boolean);
    return sems.sort((a, b) => a - b);
  }, [semesterMarks, selectedStudentMarks, isStudent]);

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

  const selectedStudentObj = allStudents.find(s => s.id.toString() === selectedStudentId);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Reports & Marks</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {isStudent
              ? 'Detailed score breakdown and semester subject marks'
              : 'Class performance analytics and individual student reports'}
          </p>
        </div>

        {isStudent && (
          <div className="flex items-center gap-3">
            <FilterBar
              filters={{ categories, selectedCategory }}
              onFilterChange={handleFilterChange}
            />
            <button
              onClick={() => exportCSV(filteredScores, `skill-report-${user.name}.csv`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-xs"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </div>
        )}
      </div>

      {/* STUDENT VIEW */}
      {isStudent ? (
        <>
          {/* 1. Score Breakdown Table */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Score Breakdown</h3>
                <p className="text-xs text-slate-500 mt-0.5">Detailed scores per assessment type</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
                {filteredScores.length} assessments
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70">
                    <th className="text-left p-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Skill / Activity</th>
                    <th className="text-center p-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Test Score</th>
                    <th className="text-center p-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Assignment Score</th>
                    <th className="text-center p-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Quiz Score</th>
                    <th className="text-center p-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Total Score</th>
                    <th className="text-center p-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredScores.length > 0 ? (
                    filteredScores.map((s) => (
                      <tr key={s.id || s.skill_name} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3">
                          <div>
                            <p className="font-semibold text-slate-800">{s.skill_name}</p>
                            {s.category && <p className="text-[11px] text-slate-400 font-medium">{s.category}</p>}
                          </div>
                        </td>
                        <td className="p-3 text-center font-medium text-slate-700">
                          {s.test_score != null ? formatScore(s.test_score) : '—'}
                        </td>
                        <td className="p-3 text-center font-medium text-slate-700">
                          {s.assignment_score != null ? formatScore(s.assignment_score) : '—'}
                        </td>
                        <td className="p-3 text-center font-medium text-slate-700">
                          {s.quiz_score != null ? formatScore(s.quiz_score) : '—'}
                        </td>
                        <td className="p-3 text-center font-bold text-slate-900">
                          {formatScore(s.total_score || s.score)}
                        </td>
                        <td className="p-3 text-center">
                          <StatusBadge score={s.total_score || s.score} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400 text-sm">
                        No score breakdown records available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Semester Subject Marks Table */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Semester Marks Breakdown</h3>
                <p className="text-xs text-slate-500 mt-0.5">Subject-wise marks and grades recorded across semesters</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Filter Semester:</span>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="all">All Semesters</option>
                  {availableSemesters.map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
                <button
                  onClick={() => exportMarksCSV(filteredMarks, `semester-marks-${user.name}.csv`)}
                  className="px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Export Marks
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70">
                    <th className="text-left p-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Semester</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Subject Name</th>
                    <th className="text-center p-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Marks</th>
                    <th className="text-center p-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Max Marks</th>
                    <th className="text-center p-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Grade</th>
                    <th className="text-center p-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMarks.length > 0 ? (
                    filteredMarks.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 text-slate-600 font-medium">Sem {m.semester}</td>
                        <td className="p-3 font-semibold text-slate-800">{m.subject_name}</td>
                        <td className="p-3 text-center font-bold text-slate-900">{formatScore(m.marks)}</td>
                        <td className="p-3 text-center text-slate-500">{m.max_marks || 100}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                            m.grade?.startsWith('A') ? 'bg-emerald-100 text-emerald-800' :
                            m.grade?.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                            m.grade?.startsWith('C') ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {m.grade || '—'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <StatusBadge score={m.marks} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400 text-sm">
                        No semester marks recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* FACULTY / ADMIN VIEW */
        <>
          {/* Class Overview Chart (Hidden for Admin) */}
          {user?.role !== 'admin' && (
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900">Class Skill Averages</h3>
                <p className="text-xs text-slate-500 mt-0.5">Min, average, and max scores across all students</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
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
                  <Bar dataKey="avg" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Average" barSize={22} />
                  <Bar dataKey="min" fill="#ef4444" radius={[4, 4, 0, 0]} name="Min" barSize={22} />
                  <Bar dataKey="max" fill="#22c55e" radius={[4, 4, 0, 0]} name="Max" barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Student Selector Card */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Individual Student Score Breakdown & Marks</h3>
                <p className="text-xs text-slate-500 mt-0.5">Select a student to view their complete assessment scores and semester marks</p>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-slate-600">Select Student:</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 outline-none shadow-2xs"
                >
                  {allStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.roll_number || st.email})
                    </option>
                  ))}
                </select>
                {selectedStudentScores.length > 0 && selectedStudentObj && (
                  <button
                    onClick={() => exportCSV(selectedStudentScores, `skill-report-${selectedStudentObj.name}.csv`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-2xs"
                  >
                    Export CSV
                  </button>
                )}
              </div>
            </div>

            {studentLoading ? (
              <div className="py-8">
                <SkeletonLoader type="table" rows={4} />
              </div>
            ) : (
              <div className="space-y-6 pt-5">
                {/* 1. Selected Student Score Breakdown */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Score Breakdown: <span className="text-blue-600">{selectedStudentObj?.name || 'Selected Student'}</span>
                    </h4>
                    <span className="text-xs text-slate-400">{selectedStudentScores.length} skills recorded</span>
                  </div>

                  <div className="overflow-x-auto border border-slate-200/70 rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="text-left p-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Skill / Activity</th>
                          <th className="text-center p-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Test Score</th>
                          <th className="text-center p-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Assignment Score</th>
                          <th className="text-center p-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Quiz Score</th>
                          <th className="text-center p-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Total Score</th>
                          <th className="text-center p-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedStudentScores.length > 0 ? (
                          selectedStudentScores.map((s) => (
                            <tr key={s.id || s.skill_name} className="hover:bg-slate-50/70 transition-colors">
                              <td className="p-3">
                                <p className="font-semibold text-slate-800">{s.skill_name}</p>
                                {s.category && <p className="text-[11px] text-slate-400 font-medium">{s.category}</p>}
                              </td>
                              <td className="p-3 text-center font-medium text-slate-700">
                                {s.test_score != null ? formatScore(s.test_score) : '—'}
                              </td>
                              <td className="p-3 text-center font-medium text-slate-700">
                                {s.assignment_score != null ? formatScore(s.assignment_score) : '—'}
                              </td>
                              <td className="p-3 text-center font-medium text-slate-700">
                                {s.quiz_score != null ? formatScore(s.quiz_score) : '—'}
                              </td>
                              <td className="p-3 text-center font-bold text-slate-900">
                                {formatScore(s.total_score || s.score)}
                              </td>
                              <td className="p-3 text-center">
                                <StatusBadge score={s.total_score || s.score} />
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="text-center py-6 text-slate-400 text-sm">
                              No assessment scores found for this student.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. Selected Student Semester Marks */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Semester Subject Marks: <span className="text-blue-600">{selectedStudentObj?.name || 'Selected Student'}</span>
                    </h4>
                    <span className="text-xs text-slate-400">{selectedStudentMarks.length} subject entries</span>
                  </div>

                  <div className="overflow-x-auto border border-slate-200/70 rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="text-left p-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Semester</th>
                          <th className="text-left p-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Subject Name</th>
                          <th className="text-center p-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Marks</th>
                          <th className="text-center p-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Max Marks</th>
                          <th className="text-center p-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Grade</th>
                          <th className="text-center p-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedStudentMarks.length > 0 ? (
                          selectedStudentMarks.map((m, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                              <td className="p-3 text-slate-600 font-medium">Sem {m.semester}</td>
                              <td className="p-3 font-semibold text-slate-800">{m.subject_name}</td>
                              <td className="p-3 text-center font-bold text-slate-900">{formatScore(m.marks)}</td>
                              <td className="p-3 text-center text-slate-500">{m.max_marks || 100}</td>
                              <td className="p-3 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                                  m.grade?.startsWith('A') ? 'bg-emerald-100 text-emerald-800' :
                                  m.grade?.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                                  m.grade?.startsWith('C') ? 'bg-amber-100 text-amber-800' :
                                  'bg-rose-100 text-rose-800'
                                }`}>
                                  {m.grade || '—'}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <StatusBadge score={m.marks} />
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="text-center py-6 text-slate-400 text-sm">
                              No semester marks recorded for this student.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
