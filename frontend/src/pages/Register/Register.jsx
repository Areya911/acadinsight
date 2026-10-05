import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../../services/api';

export default function Register({ onLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    setLoading(true);
    try {
      const res = await register(name, email, password, role);
      
      // Show success message and redirect to login
      setSuccess('Registration successful! Please login with your credentials.');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="w-10 h-10 rounded-xl bg-[#4655F5] flex items-center justify-center text-white font-bold text-lg shadow-xs mb-3">
            A
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">AcadInsight</h1>
          <p className="text-xs text-slate-500 mt-0.5">Performance Analytics & Intervention Platform</p>
        </div>

        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-6 sm:p-7">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Create Account</h2>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200/60 text-rose-700 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200/60 text-emerald-700 rounded-lg text-xs font-medium">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-lg focus:border-[#4655F5] focus:bg-white outline-none transition text-xs font-normal text-slate-900"
                placeholder="Enter your full name"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-lg focus:border-[#4655F5] focus:bg-white outline-none transition text-xs font-medium text-slate-900 cursor-pointer"
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-lg focus:border-[#4655F5] focus:bg-white outline-none transition text-xs font-normal text-slate-900"
                placeholder="name@acadinsight.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-lg focus:border-[#4655F5] focus:bg-white outline-none transition text-xs font-normal text-slate-900"
                placeholder="At least 6 characters"
                required
                minLength="6"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-lg focus:border-[#4655F5] focus:bg-white outline-none transition text-xs font-normal text-slate-900"
                placeholder="Confirm password"
                required
                minLength="6"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-[#4655F5] hover:bg-[#3645DB] text-white rounded-lg font-medium transition shadow-xs disabled:opacity-50 text-xs cursor-pointer mt-1"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <a href="/" className="text-[#4655F5] hover:text-[#3645DB] font-medium">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
