import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAnalyticsStudents, getAllStudents, getStudentAnalyticsProfile, getAllUsers, createIntervention } from '../../services/api';
import RiskBadge from '../../components/RiskBadge';
import SkeletonLoader from '../../components/SkeletonLoader';
import Icon from '../../components/Icon';

const INTERVENTION_TYPES = [
  'Academic Mentoring', 
  'Subject Remedial Session', 
  'Attendance Follow-up', 
  'Assignment Support', 
  'Counselling Referral', 
  'Peer Learning', 
  'Extra Practice', 
  'Faculty Meeting', 
  'Combined Approach'
];

export default function CreateIntervention() {
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const urlStudentId = searchParams.get('student_id');

  const [formData, setFormData] = useState({
    student_id: urlStudentId || '',
    faculty_id: '',
    intervention_type: INTERVENTION_TYPES[0],
    target_subject: '',
    notes: '',
    target_improvement: '',
    target_date: ''
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);

        // Fetch students (try analytics students, fallback to regular students)
        let studentList = [];
        try {
          const sRes = await getAnalyticsStudents();
          studentList = Array.isArray(sRes.data) ? sRes.data : (sRes.data?.students || []);
        } catch (e) {
          console.warn('getAnalyticsStudents failed, falling back to getAllStudents', e);
          const sFallback = await getAllStudents();
          studentList = Array.isArray(sFallback.data) ? sFallback.data : (sFallback.data?.students || []);
        }
        setStudents(studentList);

        // Fetch users to populate faculty list
        try {
          const uRes = await getAllUsers();
          const userList = uRes.data?.users || uRes.data || [];
          const facultyMembers = userList.filter(u => u.role === 'faculty' || u.role === 'admin');
          setFaculty(facultyMembers);

          // Auto-select logged in user as faculty if faculty/admin
          const currentUserStr = localStorage.getItem('user');
          if (currentUserStr) {
            const currentUser = JSON.parse(currentUserStr);
            if (currentUser.role === 'faculty' || currentUser.role === 'admin') {
              setFormData(prev => ({
                ...prev,
                faculty_id: prev.faculty_id || String(currentUser.id)
              }));
            }
          }
        } catch (e) {
          console.error('Failed to load faculty members:', e);
        }

        // If student_id came in URL query
        if (urlStudentId) {
          fetchStudentDetails(urlStudentId);
        }
      } catch (err) {
        console.error('Failed to initialize intervention form:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [urlStudentId]);

  const fetchStudentDetails = async (id) => {
    if (!id) return;
    try {
      const res = await getStudentAnalyticsProfile(id);
      const data = res.data;
      setStudentDetails(data);
      setSelectedStudent(id);

      // Pre-fill target subject with their top weak subject if empty
      if (data?.weak_areas?.length > 0) {
        setFormData(prev => ({
          ...prev,
          target_subject: prev.target_subject || data.weak_areas[0].name
        }));
      }
    } catch (err) {
      console.error('Failed to fetch student details:', err);
    }
  };

  const handleStudentSelect = (e) => {
    const id = e.target.value;
    setFormData(prev => ({ ...prev, student_id: id }));
    if (id) {
      fetchStudentDetails(id);
    } else {
      setSelectedStudent(null);
      setStudentDetails(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.student_id) {
      return alert('Please select a student for the intervention plan.');
    }
    if (!formData.notes.trim()) {
      return alert('Please enter action plan notes.');
    }
    
    setSubmitting(true);
    try {
      await createIntervention({
        ...formData,
        student_id: parseInt(formData.student_id),
        faculty_id: formData.faculty_id ? parseInt(formData.faculty_id) : null
      });
      navigate('/interventions');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to create intervention plan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <SkeletonLoader type="card" />
        <SkeletonLoader type="card" />
      </div>
    );
  }

  // Filter students for the select list if search is active
  const filteredStudents = studentSearch.trim()
    ? students.filter(s => 
        (s.name && s.name.toLowerCase().includes(studentSearch.toLowerCase())) ||
        (s.roll_number && s.roll_number.toLowerCase().includes(studentSearch.toLowerCase())) ||
        (s.department && s.department.toLowerCase().includes(studentSearch.toLowerCase()))
      )
    : students;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate(-1)} 
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 transition cursor-pointer"
        >
          <Icon name="arrow-left" size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Create Intervention Plan</h1>
          <p className="text-xs text-slate-500 mt-0.5">Assign faculty mentors and define actionable recovery goals for at-risk students</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5.5 space-y-5">
            
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2.5 flex items-center gap-2">
                <Icon name="user" size={15} color="#4655F5" />
                <span>Student & Faculty Assignment</span>
              </h3>
              
              {/* Student Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Select Student *
                </label>
                
                {!urlStudentId && students.length > 8 && (
                  <div className="mb-2">
                    <input
                      type="text"
                      placeholder="Type to filter students by name, roll number, or department..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200/90 rounded-lg focus:border-[#4655F5] focus:bg-white outline-none transition"
                    />
                  </div>
                )}

                <select 
                  name="student_id" 
                  value={formData.student_id} 
                  onChange={handleStudentSelect}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-lg focus:border-[#4655F5] focus:bg-white outline-none text-xs font-medium text-slate-900 transition cursor-pointer"
                  disabled={!!urlStudentId}
                >
                  <option value="">-- Choose a student ({filteredStudents.length} available) --</option>
                  {filteredStudents.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.roll_number ? `(${s.roll_number})` : ''} • {s.department || 'General'} {s.risk_level ? `[${s.risk_level} RISK]` : ''}
                    </option>
                  ))}
                </select>
                {students.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1 font-medium">No student records found in database.</p>
                )}
              </div>

              {/* Faculty Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Assigned Faculty Mentor *
                </label>
                <select 
                  name="faculty_id" 
                  value={formData.faculty_id} 
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-lg focus:border-[#4655F5] focus:bg-white outline-none text-xs font-medium text-slate-900 transition cursor-pointer"
                >
                  <option value="">-- Choose a faculty advisor ({faculty.length} available) --</option>
                  {faculty.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.email}) {f.role === 'admin' ? '[Admin]' : '[Faculty]'}
                    </option>
                  ))}
                </select>
                {faculty.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1 font-medium">No faculty accounts found to assign.</p>
                )}
              </div>

              {/* Intervention Type & Target Subject */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Intervention Type *</label>
                  <select 
                    name="intervention_type" 
                    value={formData.intervention_type} 
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-lg focus:border-[#4655F5] focus:bg-white outline-none text-xs font-medium text-slate-900 transition cursor-pointer"
                  >
                    {INTERVENTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Target Subject / Area</label>
                  <input 
                    type="text" 
                    name="target_subject"
                    value={formData.target_subject}
                    onChange={handleChange}
                    placeholder="e.g., Operating Systems, Attendance"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-lg focus:border-[#4655F5] focus:bg-white outline-none text-xs text-slate-900 transition"
                  />
                </div>
              </div>
            </div>

            {/* Goals & Actions */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2.5 flex items-center gap-2">
                <Icon name="clipboard" size={15} color="#4655F5" />
                <span>Action Plan & Target Outcomes</span>
              </h3>
              
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Intervention Notes / Prescribed Actions *
                </label>
                <textarea 
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Detail the specific steps, weekly tutoring schedule, and remediation milestones..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-lg focus:border-[#4655F5] focus:bg-white outline-none text-xs text-slate-900 resize-none transition leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Target Improvement Goal</label>
                  <input 
                    type="text" 
                    name="target_improvement"
                    value={formData.target_improvement}
                    onChange={handleChange}
                    placeholder="e.g., Improve score from 34% to 60%"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-lg focus:border-[#4655F5] focus:bg-white outline-none text-xs text-slate-900 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Target Completion Date</label>
                  <input 
                    type="date" 
                    name="target_date"
                    value={formData.target_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-lg focus:border-[#4655F5] focus:bg-white outline-none text-xs text-slate-900 transition"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex justify-end gap-2.5 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => navigate(-1)}
                className="px-4 py-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium text-xs transition cursor-pointer border border-slate-200"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={submitting}
                className="px-4 py-1.5 bg-[#4655F5] hover:bg-[#3645DB] text-white rounded-lg font-medium text-xs transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Icon name="check" size={14} color="#fff" />
                <span>{submitting ? 'Creating Plan...' : 'Create Intervention Plan'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Student Context Preview Sidebar */}
        <div className="md:col-span-1">
          {studentDetails ? (
            <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 sticky top-6 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Student Profile</span>
                <p className="font-semibold text-slate-900 text-sm mt-1">{studentDetails.student.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {studentDetails.student.roll_number || 'No Roll #'} • {studentDetails.student.department}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Semester {studentDetails.student.semester} • Batch {studentDetails.student.batch || 'N/A'}
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/60">
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Attrition Risk Score</p>
                  <div className="flex justify-between items-center">
                    <p className="text-xl font-bold text-slate-900">{studentDetails.risk.risk_score}%</p>
                    <RiskBadge level={studentDetails.risk.risk_level} />
                  </div>
                </div>

                <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/60">
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">Weak Subjects Detected</p>
                  {studentDetails.weak_areas?.length > 0 ? (
                    <ul className="space-y-1.5">
                      {studentDetails.weak_areas.slice(0, 4).map((w, i) => (
                        <li key={i} className="flex justify-between items-center text-xs">
                          <span className="font-medium text-slate-800 truncate mr-2">{w.name}</span>
                          <span className="text-rose-600 font-semibold bg-rose-50 border border-rose-200/60 px-1.5 py-0.5 rounded text-[11px] shrink-0">{w.score}%</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No weak subjects detected</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-slate-200 p-8 flex flex-col items-center justify-center text-center text-slate-400">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2.5 text-slate-400">
                <Icon name="user" size={20} color="#94a3b8" />
              </div>
              <p className="text-xs font-medium leading-relaxed">Select a student from the dropdown to preview their academic standing & risk profile.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
