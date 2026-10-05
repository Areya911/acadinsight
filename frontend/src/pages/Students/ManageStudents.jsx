import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllStudents, deleteStudent, getStudentScores } from '../../services/api';
import Loader from '../../components/Loader';
import Icon from '../../components/Icon';

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showScores, setShowScores] = useState(false);
  const [studentScores, setStudentScores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  const navigate = useNavigate();

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const res = await getAllStudents();
      setStudents(res.data.students || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleViewScores = async (student) => {
    try {
      setSelectedStudent(student);
      setShowScores(true);
      const res = await getStudentScores(student.id);
      setStudentScores(res.data.scores || []);
    } catch (err) {
      console.error('Failed to load student scores:', err);
    }
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    if (!confirm(`Are you sure you want to delete ${studentName}? This will permanently remove their records.`)) {
      return;
    }

    try {
      await deleteStudent(studentId);
      setStudents(students.filter(s => s.id !== studentId));
      if (showScores && selectedStudent?.id === studentId) {
        setShowScores(false);
        setSelectedStudent(null);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete student');
    }
  };

  const filteredStudents = students.filter(student => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (
      (student.name && student.name.toLowerCase().includes(term)) ||
      (student.email && student.email.toLowerCase().includes(term)) ||
      (student.roll_number && student.roll_number.toLowerCase().includes(term)) ||
      (student.department && student.department.toLowerCase().includes(term))
    );
    const matchesDept = deptFilter === 'ALL' || student.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#202124] tracking-tight">Manage Students</h2>
          <p className="text-[#777777] text-xs mt-0.5">View, edit, and maintain academic records & student cohort profiles</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/students/semester-marks')}
            className="px-3.5 py-2 bg-[#059669] hover:bg-[#047857] text-white rounded-xl transition text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Icon name="book" size={15} color="#fff" />
            <span>Manage Semester Marks</span>
          </button>
          <button
            onClick={() => navigate('/students/add')}
            className="px-4 py-2 bg-gradient-to-r from-[#4f46e5] to-[#6366f1] hover:from-[#4338ca] hover:to-[#4f46e5] text-white rounded-xl transition text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Icon name="plus" size={15} color="#fff" />
            <span>Add New Student</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-[#fff1f2] border border-[#fecdd3] text-[#e11d48] rounded-xl text-xs font-semibold flex items-center gap-2">
          <Icon name="warning" size={16} color="#e11d48" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8E8EC] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3.5 py-2 pl-9.5 bg-[#F5F6FA] border border-[#E8E8EC] rounded-xl focus:border-[#4d5bf8] focus:bg-white outline-none transition text-xs text-[#202124]"
            placeholder="Search by name, roll number, or email..."
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#777777]">
            <Icon name="search" size={15} />
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <label className="text-[11px] font-bold text-[#777777] uppercase tracking-wider">Department:</label>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 bg-[#F5F6FA] border border-[#E8E8EC] rounded-xl text-xs font-semibold text-[#202124] outline-none focus:border-[#4d5bf8] focus:bg-white cursor-pointer"
          >
            <option value="ALL">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Electronics">Electronics</option>
            <option value="Mechanical">Mechanical</option>
            <option value="Electrical">Electrical</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-[#E8E8EC] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E8E8EC] text-[#777777] text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-3 font-semibold">Student</th>
                <th className="py-3 px-3 font-semibold">Roll Number</th>
                <th className="py-3 px-3 font-semibold">Department</th>
                <th className="py-3 px-3 font-semibold">Academic Level</th>
                <th className="py-3 px-3 font-semibold">Batch</th>
                <th className="py-3 px-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    {searchTerm ? 'No students found matching your search.' : 'No students found. Click "Add New Student" to get started.'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{student.name}</div>
                      <div className="text-xs text-slate-500">{student.email}</div>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-1 rounded-md">
                        {student.roll_number || 'N/A'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{student.department || 'N/A'}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-800 font-medium">
                        {student.semester ? `Semester ${student.semester}` : 'N/A'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {student.year ? `Year ${student.year}` : ''}
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 font-medium">
                      {student.batch || 'N/A'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => navigate(`/analytics/students/${student.id}`)}
                          className="px-2.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition text-xs font-semibold"
                          title="View Profile"
                        >
                          Profile
                        </button>
                        <button
                          onClick={() => handleViewScores(student)}
                          className="px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition text-xs font-semibold"
                          title="View Skills"
                        >
                          Skills
                        </button>
                        <button
                          onClick={() => navigate(`/students/edit/${student.id}`)}
                          className="px-2.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-xs font-semibold"
                          title="Edit Student"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student.id, student.name)}
                          className="px-2.5 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-xs font-semibold"
                          title="Delete Student"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Scores Modal */}
      {showScores && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Skill Scores — {selectedStudent.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedStudent.roll_number} • {selectedStudent.department} • Semester {selectedStudent.semester}
                </p>
              </div>
              <button
                onClick={() => setShowScores(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <Icon name="x-circle" size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
              {studentScores.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No skill scores recorded for this student yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {studentScores.map((s, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-800 text-sm">{s.skill_name}</div>
                        <div className="text-xs text-slate-500">{s.category || 'Skill'}</div>
                      </div>
                      <span className={`text-sm font-bold px-2.5 py-1 rounded-lg ${
                        s.score >= 75 ? 'bg-emerald-100 text-emerald-800' : s.score >= 50 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {s.score}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setShowScores(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-sm rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
