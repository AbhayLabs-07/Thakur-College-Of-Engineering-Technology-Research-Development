import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, LogOut, User } from 'lucide-react';

const Header = () => {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatClock = (date) => {
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const userName = localStorage.getItem('name') || localStorage.getItem('username') || 'User';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <header className="bg-tcet-navy text-white border-b-4 border-tcet-gold sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Branding & Logo */}
        <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
          <img 
            src="/tcetlogo.png" 
            alt="TCET Logo" 
            className="h-12 w-auto bg-white p-1 border border-slate-300 mr-4"
            onError={(e) => {
              e.target.style.display = 'none'; // fallback if image fails
            }}
          />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">THAKUR COLLEGE OF ENGINEERING & TECHNOLOGY</h1>
            <p className="text-xs text-tcet-gold font-semibold tracking-wider">RESEARCH & DEVELOPMENT CELL • SMART INVENTORY</p>
          </div>
        </div>

        {/* Real-time Academic Clock & User Session */}
        <div className="flex flex-col md:flex-end items-center md:items-end gap-2">
          {/* Clock */}
          <div className="flex items-center text-xs text-slate-300 bg-slate-900 bg-opacity-40 px-3 py-1.5 border border-slate-700 font-mono gap-2">
            <Clock className="w-3.5 h-3.5 text-tcet-gold animate-pulse" />
            <span>{formatClock(time)}</span>
          </div>

          {/* Session Details */}
          {token && (
            <div className="flex items-center gap-4">
              <div className="flex items-center text-sm font-semibold text-slate-100 bg-slate-800 px-3 py-1 border border-slate-700 gap-1.5">
                <User className="w-4 h-4 text-tcet-gold" />
                <span>{userName}</span>
                <span className="text-xs font-mono uppercase bg-tcet-gold text-tcet-navy px-1.5 py-0.5 ml-1.5 font-bold">
                  {role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center bg-red-800 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 border border-red-950 transition-colors gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>LOGOUT</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
