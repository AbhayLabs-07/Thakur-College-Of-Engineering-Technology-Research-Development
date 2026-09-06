import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, Search, Bell, User, Settings, LogOut, ChevronDown, 
  Shield, CheckCircle2, AlertTriangle, AlertCircle, Info, X
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { authStorage } from '../../utils/storage';

const AdminHeader = () => {
  const navigate = useNavigate();
  const { 
    adminProfile, 
    notifications, 
    unreadNotificationCount, 
    markNotificationsRead, 
    setActiveTab,
    setIsSearchOpen 
  } = useAdmin();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  // Live academic clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format real-time academic date and time
  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const handleLogout = () => {
    authStorage.clear();
    navigate('/');
  };

  const handleNotificationClick = (notif) => {
    if (notif.linkTab) {
      setActiveTab(notif.linkTab);
    }
    setIsNotificationOpen(false);
  };

  return (
    <header className="bg-tcet-navy text-white border-b-2 border-tcet-gold sticky top-0 z-40 shadow-sm select-none">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        
        {/* LEFT: TCET Branding & Logo */}
        <div 
          className="flex items-center gap-3.5 cursor-pointer hover:opacity-95 transition-opacity"
          onClick={() => setActiveTab('dashboard')}
          title="TCET R&D Cell Admin Control Center"
        >
          <img 
            src="/tcetlogo.png" 
            alt="TCET Logo" 
            className="h-10 w-auto bg-white p-1 border border-slate-200 shrink-0 shadow-xs"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black tracking-tight text-white uppercase font-sans">
                Thakur College of Engineering & Technology
              </h1>
              <span className="hidden xl:inline-block text-[9px] font-mono font-bold bg-amber-500/20 text-tcet-gold px-1.5 py-0.5 border border-amber-400/40 uppercase">
                Autonomous Institute
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-tcet-gold font-bold tracking-widest uppercase">
              Research & Development Cell • Inventory Management Portal
            </p>
          </div>
        </div>

        {/* RIGHT: Live Clock, Global Search, Notifications, Admin Profile */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          
          {/* Real-time Institutional Clock */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-900/60 border border-slate-700/80 px-3 py-1.5 font-mono text-[11px] text-slate-200">
            <Clock className="w-3.5 h-3.5 text-tcet-gold animate-pulse shrink-0" />
            <span className="font-semibold text-slate-300">{formattedDate}</span>
            <span className="text-slate-600">|</span>
            <span className="font-bold text-white tracking-wider">{formattedTime}</span>
          </div>

          {/* Global Search Button Trigger */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-tcet-gold px-3 py-1.5 text-xs text-slate-300 transition-colors shadow-xs"
            title="Global Search (Ctrl + K)"
          >
            <Search className="w-3.5 h-3.5 text-tcet-gold" />
            <span className="hidden md:inline text-[11px] font-medium text-slate-300">Quick search...</span>
            <kbd className="hidden md:inline-block text-[9px] font-mono bg-slate-900 border border-slate-700 px-1.5 py-0.5 text-slate-400">
              Ctrl K
            </kbd>
          </button>

          {/* Notification Bell with Badge & Dropdown */}
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative p-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 transition-colors"
              title="System Alerts & Notifications"
            >
              <Bell className="w-4 h-4 text-slate-200" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white font-mono text-[9px] font-black h-4 w-4 flex items-center justify-center border border-slate-900 animate-pulse">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border-2 border-slate-300 shadow-2xl text-slate-800 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Header */}
                <div className="bg-tcet-navy px-4 py-3 flex items-center justify-between border-b border-tcet-gold text-white">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-tcet-gold" />
                    <span className="font-extrabold text-xs uppercase tracking-wider">System Alerts</span>
                    {unreadNotificationCount > 0 && (
                      <span className="bg-red-600 text-white text-[10px] font-mono font-bold px-1.5 py-0.2">
                        {unreadNotificationCount} new
                      </span>
                    )}
                  </div>
                  {unreadNotificationCount > 0 && (
                    <button
                      type="button"
                      onClick={markNotificationsRead}
                      className="text-[10px] text-tcet-gold hover:text-white uppercase font-bold tracking-wide transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Notification List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No active alerts in the system
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const isCritical = notif.priority === 'Critical';
                      const isWarning = notif.priority === 'Warning';
                      const isSuccess = notif.priority === 'Success';
                      return (
                        <div
                          key={notif._id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors text-left flex gap-3 ${
                            !notif.read ? 'bg-amber-50/40 border-l-4 border-l-tcet-navy' : ''
                          }`}
                        >
                          <div className="shrink-0 mt-0.5">
                            {isCritical ? (
                              <AlertCircle className="w-4 h-4 text-red-600" />
                            ) : isWarning ? (
                              <AlertTriangle className="w-4 h-4 text-amber-600" />
                            ) : isSuccess ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <Info className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-grow space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 border ${
                                isCritical ? 'bg-red-50 text-red-700 border-red-200' :
                                isWarning ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                isSuccess ? 'bg-green-50 text-green-800 border-green-200' :
                                'bg-blue-50 text-blue-800 border-blue-200'
                              }`}>
                                {notif.type}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-900 leading-snug">
                              {notif.title}
                            </h4>
                            <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                              {notif.description}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer action */}
                <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('activity');
                      setIsNotificationOpen(false);
                    }}
                    className="text-xs font-bold text-tcet-navy hover:text-blue-900 uppercase tracking-wide"
                  >
                    View All Notifications in Activity Log &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Admin Profile Pill & Enterprise Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2.5 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-tcet-gold px-3 py-1.5 transition-all text-left"
            >
              <div className="w-6 h-6 bg-tcet-gold text-tcet-navy flex items-center justify-center font-bold text-xs shrink-0">
                A
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-xs font-bold text-white tracking-wide">
                  {adminProfile.name || 'Ashish Mudholkar'}
                </span>
                <span className="text-[9px] font-mono font-bold text-tcet-gold uppercase tracking-wider">
                  {adminProfile.role || 'ADMIN'}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Enterprise Dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border-2 border-slate-300 shadow-2xl text-slate-800 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Admin info badge */}
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-tcet-navy" />
                    <span className="text-[10px] font-mono font-bold uppercase text-tcet-navy bg-amber-100 px-2 py-0.5 border border-amber-300">
                      Primary Administrator
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900">{adminProfile.name}</h4>
                  <p className="text-xs text-slate-500 font-mono truncate">{adminProfile.email}</p>
                </div>

                {/* Menu items */}
                <div className="py-1 text-xs font-semibold text-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('settings');
                      setIsProfileOpen(false);
                    }}
                    className="w-full px-4 py-2.5 hover:bg-slate-100 flex items-center gap-2.5 text-left text-slate-800 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-500" />
                    <span>Admin Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('settings');
                      setIsProfileOpen(false);
                    }}
                    className="w-full px-4 py-2.5 hover:bg-slate-100 flex items-center gap-2.5 text-left text-slate-800 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>Portal Settings</span>
                  </button>
                </div>

                {/* Logout Divider */}
                <div className="border-t border-slate-200 py-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 hover:bg-red-50 text-red-600 flex items-center gap-2.5 text-left font-bold transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-red-600" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
