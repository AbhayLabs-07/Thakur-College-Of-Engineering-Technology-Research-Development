import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { ShieldAlert, LogIn, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Header from '../components/Header';

const StudentLogin = () => {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!loginId || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      // Clear prior sessions
      localStorage.clear();

      const data = await authService.loginStudent(loginId.trim(), password.trim());
      
      // Save details to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', 'student');
      localStorage.setItem('name', data.name);
      localStorage.setItem('erpId', data.erpId);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('branch', data.branch);
      localStorage.setItem('division', data.division);
      localStorage.setItem('email', data.email);
      localStorage.setItem('contactNumber', data.contactNumber || '');
      localStorage.setItem('rollNo', data.rollNo || '');

      navigate('/student-dashboard');
    } catch (err) {
      console.error('Login Error:', err);
      setError(err.response?.data?.message || 'Invalid ERP ID / User ID or Password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-tcet-lightBg">
      <Header />

      <main className="flex-grow flex items-center justify-center p-4 py-16">
        <div className="bg-white border-2 border-tcet-navy w-full max-w-md shadow-xl">
          {/* Card Top Border */}
          <div className="h-2 bg-tcet-navy"></div>

          {/* Back button */}
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-xs text-tcet-mutedText hover:text-tcet-navy font-bold p-4 pb-0"
          >
            <ArrowLeft className="w-4 h-4" /> BACK TO PORTAL CHOICE
          </button>

          <div className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-tcet-navy tracking-tight uppercase">Student Login</h2>
              <p className="text-xs text-tcet-mutedText mt-1">Research & Development Cell Inventory Access</p>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-600 text-red-800 text-xs p-3.5 mb-6 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-tcet-navy uppercase tracking-wider mb-1">
                  ERP ID or User ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1032250997 or tcet.std.1032250997"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-sm transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-tcet-navy uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-sm transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-tcet-navy transition-colors focus:outline-none"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-tcet-navy hover:bg-slate-800 text-white font-bold text-xs py-3 border border-tcet-navy uppercase transition-all tracking-wider flex items-center justify-center gap-1"
                >
                  <LogIn className="w-4 h-4 text-tcet-gold" />
                  <span>{loading ? 'LOGGING IN...' : 'SECURE LOG IN'}</span>
                </button>
              </div>
            </form>

            <div className="mt-6 border-t border-slate-200 pt-4 text-[10px] text-center text-tcet-mutedText leading-relaxed">
              <p>Credentials are deterministically generated and physical copy distributed by cell coordinators. Direct registration is disabled.</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-tcet-navy text-slate-400 py-4 text-center text-xs">
        <p>© {new Date().getFullYear()} TCET R&D Cell</p>
      </footer>
    </div>
  );
};

export default StudentLogin;
