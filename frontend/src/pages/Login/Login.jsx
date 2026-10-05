import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      
      // Store token and user data
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      onLogin(res.data.user);
      
      // Role-based redirect
      const role = res.data.user.role;
      if (role === 'admin') {
        navigate('/admin-dashboard');
      } else if (role === 'faculty') {
        navigate('/faculty-dashboard');
      } else {
        navigate('/student-dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
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
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Sign In to Your Account</h2>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200/60 text-rose-700 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Email Address</label>
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
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-lg focus:border-[#4655F5] focus:bg-white outline-none transition text-xs font-normal text-slate-900"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-[#4655F5] hover:bg-[#3645DB] text-white rounded-lg font-medium transition shadow-xs disabled:opacity-50 text-xs cursor-pointer mt-1"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-xs text-slate-500">
              Don't have an account?{' '}
              <a href="/register" className="text-[#4655F5] hover:text-[#3645DB] font-medium">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
