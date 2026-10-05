import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createStudent, getSkills, addStudentScores } from '../../services/api';
import Loader from '../../components/Loader';
import Icon from '../../components/Icon';

export default function AddStudent() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [skills, setSkills] = useState([]);
  
  // Comprehensive Student Info
  const [studentInfo, setStudentInfo] = useState({
    name: '',
    email: '',
    password: '',
    roll_number: '',
    department: 'Computer Science',
    semester: '1',
    year: '1',
    batch: '2023-2027'
  });
  
  // Skill scores
  const [skillScores, setSkillScores] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      const res = await getSkills();
      setSkills(res.data);
      
      // Initialize skill scores with empty values
      const initialScores = {};
      res.data.forEach(skill => {
        initialScores[skill.name] = '';
      });
      setSkillScores(initialScores);
    } catch (err) {
      console.error('Failed to load skills:', err);
    }
  };

  const handleStudentInfoChange = (e) => {
    const { name, value } = e.target;
    
    // Automatically keep year and semester aligned if year changes
    if (name === 'year') {
      const yr = parseInt(value) || 1;
      setStudentInfo(prev => ({
        ...prev,
        year: value,
        semester: String((yr * 2) - 1)
      }));
      return;
    }

    setStudentInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleScoreChange = (skillName, value) => {
    setSkillScores({
      ...skillScores,
      [skillName]: value
    });
  };

  const validateStep1 = () => {
    if (!studentInfo.name.trim() || !studentInfo.email.trim() || !studentInfo.password.trim()) {
      setError('Name, email, and password are required');
      return false;
    }
    if (studentInfo.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (!studentInfo.roll_number.trim()) {
      setError('Roll number is required');
      return false;
    }
    if (!studentInfo.department.trim()) {
      setError('Department is required');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const scores = Object.entries(skillScores).filter(([_, score]) => score !== '');
    if (scores.length === 0) {
      setError('Please enter at least one skill score');
      return false;
    }
    
    for (const [skillName, score] of scores) {
      const numScore = parseInt(score);
      if (isNaN(numScore) || numScore < 0 || numScore > 100) {
        setError(`Invalid score for ${skillName}. Must be between 0 and 100`);
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setError('');
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateStep2()) return;
    
    setLoading(true);
    try {
      // Step 1: Create student with all academic details
      const studentRes = await createStudent(studentInfo);
      const newStudent = studentRes.data.student;
      
      // Step 2: Add skill scores
      const scores = Object.entries(skillScores)
        .filter(([_, score]) => score !== '')
        .map(([skillName, score]) => ({
          skillName,
          score: parseInt(score)
        }));
      
      if (scores.length > 0 && newStudent?.id) {
        await addStudentScores(newStudent.id, scores);
      }
      
      setSuccess('Student account & academic profile created successfully!');
      setTimeout(() => {
        navigate('/students/manage');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add student');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Add New Student</h2>
          <p className="text-slate-500 text-sm mt-1">
            {step === 1 ? 'Enter student basic and academic information' : 'Enter baseline skill scores'}
          </p>
        </div>
        <button
          onClick={() => navigate('/students/manage')}
          className="text-slate-500 hover:text-slate-700 flex items-center gap-1.5 text-sm font-medium transition"
        >
          <Icon name="arrow-left" size={16} /> Back to Students
        </button>
      </div>

      {/* Step Indicator */}
      <div className="mb-6 bg-white rounded-xl p-4 border border-slate-200">
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              1
            </div>
            <span className={`text-sm font-semibold ${step >= 1 ? 'text-indigo-600' : 'text-slate-400'}`}>
              Academic Profile
            </span>
          </div>
          <div className={`w-16 h-0.5 ${step >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              2
            </div>
            <span className={`text-sm font-semibold ${step >= 2 ? 'text-indigo-600' : 'text-slate-400'}`}>
              Initial Skills
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
          <Icon name="warning" size={18} color="#dc2626" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center gap-2">
          <Icon name="check-circle" size={18} color="#16a34a" />
          <span>{success}</span>
        </div>
      )}

      {step === 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-xs">
          {/* Personal Details */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Icon name="user" size={18} color="#4f46e5" />
              <span>Personal & Account Details</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={studentInfo.name}
                  onChange={handleStudentInfoChange}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm"
                  placeholder="e.g. John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={studentInfo.email}
                  onChange={handleStudentInfoChange}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm"
                  placeholder="e.g. john@student.com"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={studentInfo.password}
                  onChange={handleStudentInfoChange}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm"
                  placeholder="Temporary password (min 6 characters)"
                  required
                />
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Icon name="graduation" size={18} color="#4f46e5" />
              <span>Academic Details</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Roll Number *</label>
                <input
                  type="text"
                  name="roll_number"
                  value={studentInfo.roll_number}
                  onChange={handleStudentInfoChange}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm"
                  placeholder="e.g. CS2024001"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department *</label>
                <select
                  name="department"
                  value={studentInfo.department}
                  onChange={handleStudentInfoChange}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm bg-white"
                  required
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics">Electronics & Communication</option>
                  <option value="Mechanical">Mechanical Engineering</option>
                  <option value="Electrical">Electrical Engineering</option>
                  <option value="Civil">Civil Engineering</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Year of Study *</label>
                <select
                  name="year"
                  value={studentInfo.year}
                  onChange={handleStudentInfoChange}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm bg-white"
                  required
                >
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Current Semester *</label>
                <select
                  name="semester"
                  value={studentInfo.semester}
                  onChange={handleStudentInfoChange}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm bg-white"
                  required
                >
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                  <option value="3">Semester 3</option>
                  <option value="4">Semester 4</option>
                  <option value="5">Semester 5</option>
                  <option value="6">Semester 6</option>
                  <option value="7">Semester 7</option>
                  <option value="8">Semester 8</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Batch / Academic Cycle *</label>
                <input
                  type="text"
                  name="batch"
                  value={studentInfo.batch}
                  onChange={handleStudentInfoChange}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm"
                  placeholder="e.g. 2023-2027"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={handleNext}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <span>Next: Add Skills</span>
              <Icon name="arrow-right" size={16} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="mb-6 pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">Baseline Skill Scores</h3>
            <p className="text-sm text-slate-600">
              Student: <span className="font-bold text-slate-800">{studentInfo.name}</span> ({studentInfo.roll_number} • {studentInfo.department} • Sem {studentInfo.semester})
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {skills.map((skill) => (
              <div key={skill.name} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  {skill.name}
                  {skill.category && (
                    <span className="text-xs text-slate-500 ml-1 font-normal">({skill.category})</span>
                  )}
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={skillScores[skill.name] || ''}
                  onChange={(e) => handleScoreChange(skill.name, e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm"
                  placeholder="0 - 100"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={handleBack}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm font-semibold flex items-center gap-2 cursor-pointer"
            >
              <Icon name="arrow-left" size={16} />
              <span>Back</span>
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-semibold disabled:opacity-50 flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Icon name="check" size={16} color="#fff" />
              <span>{loading ? 'Creating Student...' : 'Create Student Profile'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
