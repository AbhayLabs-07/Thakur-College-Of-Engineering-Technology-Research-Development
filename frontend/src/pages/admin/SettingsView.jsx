import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  User, 
  Shield, 
  Bell, 
  Sliders, 
  LogOut, 
  CheckCircle, 
  Save, 
  Key, 
  Calendar 
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { authStorage } from '../../utils/storage';

const SettingsView = () => {
  const navigate = useNavigate();
  const { 
    adminProfile, 
    setAdminProfile, 
    portalSettings, 
    setPortalSettings, 
    showToast 
  } = useAdmin();

  const [activeSection, setActiveSection] = useState('profile'); // 'profile', 'account', 'notifications', 'portal'

  // Profile Form
  const [profileData, setProfileData] = useState({
    name: adminProfile.name || 'Ashish Mudholkar',
    username: adminProfile.username || 'Admin',
    email: adminProfile.email || 'ashish.mudholkar75@gmail.com',
    contactNumber: adminProfile.contactNumber || '+91 9920123456',
    department: 'Research & Development Cell'
  });

  // Settings form
  const [settingsData, setSettingsData] = useState({
    ...portalSettings
  });

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setAdminProfile((prev) => ({ ...prev, ...profileData }));
    authStorage.setItem('name', profileData.name);
    authStorage.setItem('email', profileData.email);
    authStorage.setItem('contactNumber', profileData.contactNumber);
    showToast('Administrator profile updated successfully.', 'success');
  };

  const handleSavePortalSettings = (e) => {
    e.preventDefault();
    setPortalSettings(settingsData);
    showToast('Portal configuration rules saved.', 'success');
  };

  const handleLogout = () => {
    authStorage.clear();
    navigate('/');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="bg-white border-2 border-slate-300 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-tcet-navy text-tcet-gold px-2 py-0.5 border border-tcet-gold">
              Administrative Control Center
            </span>
            <span className="text-[10px] font-mono text-slate-500 font-bold">
              Institutional Configuration
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-tcet-navy uppercase tracking-tight">
            Portal Settings & Governance
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Configure administrator credentials, checkout durations, automated alert notifications, and academic term parameters.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 font-bold text-xs uppercase transition-colors shrink-0"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Sub-navigation */}
        <div className="md:col-span-4 bg-white border-2 border-slate-300 p-2 shadow-xs h-fit space-y-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveSection('profile')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
              activeSection === 'profile'
                ? 'bg-tcet-navy text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <User className="w-4 h-4 text-tcet-gold" />
            <span>Admin Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('account')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
              activeSection === 'account'
                ? 'bg-tcet-navy text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-4 h-4 text-tcet-gold" />
            <span>Account Security</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('notifications')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
              activeSection === 'notifications'
                ? 'bg-tcet-navy text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-4 h-4 text-tcet-gold" />
            <span>Notification Preferences</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('portal')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
              activeSection === 'portal'
                ? 'bg-tcet-navy text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-4 h-4 text-tcet-gold" />
            <span>Portal Preferences</span>
          </button>
        </div>

        {/* Right Content Area */}
        <div className="md:col-span-8 bg-white border-2 border-slate-300 p-6 shadow-xs">
          
          {/* Section 1: Admin Profile */}
          {activeSection === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="border-b border-slate-200 pb-3 mb-4">
                <h3 className="font-extrabold text-sm uppercase text-tcet-navy">
                  Admin Profile Details
                </h3>
                <p className="text-[11px] text-slate-500">
                  Update primary administrative officer identity and official contact channels.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Administrator Full Name
                </label>
                <input
                  type="text"
                  required
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    System Username
                  </label>
                  <input
                    type="text"
                    disabled
                    value={profileData.username}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-100 font-mono text-slate-600 cursor-not-allowed"
                  />
                  <span className="text-[10px] text-slate-400">Fixed root admin role identifier.</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Official Institutional Email
                  </label>
                  <input
                    type="email"
                    required
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Emergency Contact Number
                  </label>
                  <input
                    type="tel"
                    value={profileData.contactNumber}
                    onChange={(e) => setProfileData({ ...profileData, contactNumber: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Department / Cell
                  </label>
                  <input
                    type="text"
                    disabled
                    value={profileData.department}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-100 text-slate-600 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-tcet-navy hover:bg-slate-800 text-white font-bold uppercase transition-colors shadow-xs flex items-center gap-2"
                >
                  <Save className="w-4 h-4 text-tcet-gold" />
                  <span>Save Profile Changes</span>
                </button>
              </div>
            </form>
          )}

          {/* Section 2: Account Security */}
          {activeSection === 'account' && (
            <div className="space-y-4 text-xs text-slate-800">
              <div className="border-b border-slate-200 pb-3 mb-4">
                <h3 className="font-extrabold text-sm uppercase text-tcet-navy">
                  Account Security & Session Isolation
                </h3>
                <p className="text-[11px] text-slate-500">
                  Manage active administrator session tokens and authentication enforcement.
                </p>
              </div>

              <div className="bg-slate-50 p-4 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Session Type:</span>
                  <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 border border-emerald-300">
                    Tab-Isolated SessionStorage Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Multiple roles (Admin, Faculty, Student) can be verified simultaneously across independent browser tabs without credential cross-contamination.
                </p>
              </div>

              <div className="p-4 border border-slate-200 space-y-3">
                <h4 className="font-bold uppercase text-slate-800">Password Policy</h4>
                <p className="text-[11px] text-slate-600">
                  Current admin password hash encrypted with bcrypt (10 rounds). Default credential root: <code className="bg-slate-100 px-1 py-0.5 font-mono">12345678</code>
                </p>
              </div>
            </div>
          )}

          {/* Section 3: Notification Preferences */}
          {activeSection === 'notifications' && (
            <div className="space-y-4 text-xs text-slate-800">
              <div className="border-b border-slate-200 pb-3 mb-4">
                <h3 className="font-extrabold text-sm uppercase text-tcet-navy">
                  Automated Notification Preferences
                </h3>
                <p className="text-[11px] text-slate-500">
                  Control real-time system alerts dispatched via top notification bell and transporter.
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsData.autoEmailAlerts}
                    onChange={(e) => setSettingsData({ ...settingsData, autoEmailAlerts: e.target.checked })}
                    className="mt-0.5 h-4 w-4 text-tcet-navy border-slate-300"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Automated Email Transporter Alerts</span>
                    <span className="text-[11px] text-slate-500">Dispatch warnings to students and faculty mentors automatically when loans pass due dates.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsData.requireFacultyApproval}
                    onChange={(e) => setSettingsData({ ...settingsData, requireFacultyApproval: e.target.checked })}
                    className="mt-0.5 h-4 w-4 text-tcet-navy border-slate-300"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Require Faculty Mentor Endorsement</span>
                    <span className="text-[11px] text-slate-500">Only present student requisitions to administrator after faculty mentor approves project schematics.</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Section 4: Portal Preferences */}
          {activeSection === 'portal' && (
            <form onSubmit={handleSavePortalSettings} className="space-y-4 text-xs text-slate-800">
              <div className="border-b border-slate-200 pb-3 mb-4">
                <h3 className="font-extrabold text-sm uppercase text-tcet-navy">
                  Portal Rules & Checkout Policies
                </h3>
                <p className="text-[11px] text-slate-500">
                  Global limits governing component loan durations and academic session terms.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={settingsData.academicYear}
                    onChange={(e) => setSettingsData({ ...settingsData, academicYear: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Default Loan Duration (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settingsData.maxLoanDays}
                    onChange={(e) => setSettingsData({ ...settingsData, maxLoanDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none font-bold font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Due Soon Warning Threshold (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={settingsData.overdueWarningDays}
                    onChange={(e) => setSettingsData({ ...settingsData, overdueWarningDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Max Components Per Student Request
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={settingsData.maxComponentsPerRequest}
                    onChange={(e) => setSettingsData({ ...settingsData, maxComponentsPerRequest: Number(e.target.value) })}
                    className="w-full px-3 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none font-bold font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-tcet-navy hover:bg-slate-800 text-white font-bold uppercase transition-colors shadow-xs flex items-center gap-2"
                >
                  <Save className="w-4 h-4 text-tcet-gold" />
                  <span>Update Portal Policies</span>
                </button>
              </div>
            </form>
          )}

        </div>

      </div>

    </div>
  );
};

export default SettingsView;
