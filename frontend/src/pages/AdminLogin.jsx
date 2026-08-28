import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { ShieldAlert, LogIn, ArrowLeft } from 'lucide-react';
import Header from '../components/Header';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      const data = await authService.loginAdmin(username.trim(), password);
      
      // Save details to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', 'admin');
      localStorage.setItem('name', data.name);
      localStorage.setItem('username', data.username);
      localStorage.setItem('contactNumber', data.contactNumber);

      navigate('/admin-panel');
    } catch (err) {
      console.error('Login Error:', err);
      setError(err.response?.data?.message || 'Invalid Administrator Username or Password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-tcet-lightBg">
      <Header />

      <main className="flex-grow flex items-center justify-center p-4 py-16">
        <div className="bg-white border-2 border-slate-800 w-full max-w-md shadow-xl">
          {/* Card Top Border */}
          <div className="h-2 bg-slate-800"></div>

          {/* Back button */}
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-xs text-tcet-mutedText hover:text-tcet-navy font-bold p-4 pb-0"
          >
            <ArrowLeft className="w-4 h-4" /> BACK TO PORTAL CHOICE
          </button>

          <div className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-tcet-navy tracking-tight uppercase">Admin Console</h2>
              <p className="text-xs text-tcet-mutedText mt-1">Live Asset Tracking & Inventory Controller</p>
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
                  Admin Username
                </label>
                <input
                  type="text"
                  placeholder="e.g. admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-sm transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-tcet-navy uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-sm transition-all"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 border border-slate-900 uppercase transition-all tracking-wider flex items-center justify-center gap-1"
                >
                  <LogIn className="w-4 h-4 text-tcet-gold" />
                  <span>{loading ? 'LOGGING IN...' : 'ADMIN SECURE LOG IN'}</span>
                </button>
              </div>
            </form>

            <div className="mt-6 border-t border-slate-200 pt-4 text-[10px] text-center text-tcet-mutedText leading-relaxed">
              <p>System administrators only. Initial account configuration is seeded at database initialization. Keep log keys confidential.</p>
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

export default AdminLogin;
