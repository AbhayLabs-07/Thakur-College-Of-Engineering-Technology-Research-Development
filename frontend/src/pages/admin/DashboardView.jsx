import React from 'react';
import { 
  Cpu, 
  CheckCircle2, 
  ArrowLeftRight, 
  Inbox, 
  AlertTriangle, 
  Plus, 
  UserPlus, 
  FileSpreadsheet, 
  Scan, 
  ArrowRight,
  Clock,
  ExternalLink,
  ShieldAlert,
  Calendar
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { adminService } from '../../services/api';

const DashboardView = ({ onOpenAddComponent, onOpenAddFaculty }) => {
  const { 
    kpis, 
    activeLoans, 
    requests, 
    activityLogs, 
    setActiveTab, 
    runOverdueScan,
    adminProfile 
  } = useAdmin();

  // Dynamic greeting based on current local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Filter active loan sessions for dashboard summary (only active, due_soon, overdue, partially_returned)
  const activeStudentSessions = activeLoans
    .filter((l) => ['active', 'due_soon', 'overdue', 'partially_returned'].includes(l.status))
    .slice(0, 5); // Max 4-5 students

  // Pending requests for dashboard summary (max 3-5)
  const pendingRequestsList = requests
    .filter((r) => r.status === 'pending_admin' || r.status === 'pending_faculty')
    .slice(0, 4);

  // Recent activity logs (max 5)
  const recentActivities = activityLogs.slice(0, 5);

  const handleExportInventory = () => {
    const url = adminService.getExportInventoryUrl();
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* 1. Header Banner */}
      <div className="bg-white border-2 border-slate-300 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5">
              R&D CELL ADMIN CONTROL CENTER
            </span>
            <span className="text-[10px] font-mono text-slate-500 font-semibold">
              {currentDateFormatted}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-tcet-navy tracking-tight font-sans">
            {getGreeting()}, {adminProfile.name.split(' ')[0]}!
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Here's what's happening in the R&D Inventory Portal.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenAddComponent}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-tcet-navy hover:bg-slate-800 text-white font-bold text-xs uppercase border border-tcet-navy transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-tcet-gold" />
            <span>+ Add Component</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-tcet-navy font-bold text-xs uppercase border border-slate-300 transition-all shadow-xs"
          >
            <Inbox className="w-3.5 h-3.5 text-amber-600" />
            <span>Review Requests ({kpis.pendingRequests})</span>
          </button>
        </div>
      </div>

      {/* Institutional Hardware Audit Readiness Banner */}
      <div className="bg-amber-50 border-2 border-amber-300 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-amber-800" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-extrabold uppercase bg-amber-200 text-amber-950 px-2 py-0.5 border border-amber-300">
                Institutional Hardware Audit Active
              </span>
              <span className="text-[10px] font-mono text-amber-800 font-bold">
                Upcoming Mon • Tue • Wed
              </span>
            </div>
            <p className="text-xs text-amber-900 font-medium mt-0.5">
              Laboratory inventory has been systematically cleared for physical audit verification on Monday, Tuesday, and Wednesday. Urgently needed hardware components will be catalogued immediately post-audit.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('utilities')}
          className="shrink-0 px-3.5 py-1.5 bg-amber-800 hover:bg-amber-700 text-white font-bold text-xs uppercase border border-amber-950 transition-colors shadow-xs"
        >
          Audit Utilities & Reports
        </button>
      </div>

      {/* 2. Five Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* KPI 1: TOTAL COMPONENTS */}
        <div className="bg-white border-2 border-slate-300 p-4 shadow-xs flex flex-col justify-between hover:border-tcet-navy transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
              Total Components
            </span>
            <div className="w-7 h-7 bg-slate-100 flex items-center justify-center border border-slate-200">
              <Cpu className="w-4 h-4 text-tcet-navy" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
              {kpis.totalComponents}
            </span>
            <span className="block text-[10px] text-amber-700 font-bold mt-0.5">
              Cleared for Mon-Wed audit
            </span>
          </div>
        </div>

        {/* KPI 2: AVAILABLE COMPONENTS */}
        <div className="bg-white border-2 border-slate-300 p-4 shadow-xs flex flex-col justify-between hover:border-emerald-600 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
              Available Components
            </span>
            <div className="w-7 h-7 bg-emerald-50 flex items-center justify-center border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
              {kpis.availableComponents}
            </span>
            <span className="block text-[10px] text-slate-500 mt-0.5 font-medium">
              Post-audit cataloguing
            </span>
          </div>
        </div>

        {/* KPI 3: ACTIVE LOAN SESSIONS */}
        <div className="bg-white border-2 border-slate-300 p-4 shadow-xs flex flex-col justify-between hover:border-blue-600 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
              Active Loan Sessions
            </span>
            <div className="w-7 h-7 bg-blue-50 flex items-center justify-center border border-blue-200">
              <ArrowLeftRight className="w-4 h-4 text-blue-700" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black font-mono text-blue-900">
              {kpis.activeSessions}
            </span>
            <span className="block text-[10px] text-blue-600 mt-0.5 font-medium">
              Hardware currently deployed
            </span>
          </div>
        </div>

        {/* KPI 4: PENDING REQUESTS */}
        <div className="bg-white border-2 border-slate-300 p-4 shadow-xs flex flex-col justify-between hover:border-amber-500 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
              Pending Requests
            </span>
            <div className="w-7 h-7 bg-amber-50 flex items-center justify-center border border-amber-200">
              <Inbox className="w-4 h-4 text-amber-700" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black font-mono text-amber-700">
              {kpis.pendingRequests}
            </span>
            <span className="block text-[10px] text-amber-600 mt-0.5 font-medium">
              Awaiting admin decision
            </span>
          </div>
        </div>

        {/* KPI 5: OVERDUE COMPONENTS */}
        <div className={`bg-white border-2 p-4 shadow-xs flex flex-col justify-between transition-colors ${
          kpis.overdueComponents > 0 
            ? 'border-red-500 bg-red-50/30' 
            : 'border-emerald-500 bg-emerald-50/20'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
              Overdue Components
            </span>
            <div className={`w-7 h-7 flex items-center justify-center border ${
              kpis.overdueComponents > 0 
                ? 'bg-red-100 border-red-300' 
                : 'bg-emerald-100 border-emerald-300'
            }`}>
              {kpis.overdueComponents > 0 ? (
                <AlertTriangle className="w-4 h-4 text-red-700 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              )}
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl sm:text-3xl font-black font-mono ${
              kpis.overdueComponents > 0 ? 'text-red-600' : 'text-emerald-700'
            }`}>
              {kpis.overdueComponents}
            </span>
            <span className={`block text-[10px] mt-0.5 font-bold ${
              kpis.overdueComponents > 0 ? 'text-red-600' : 'text-emerald-700'
            }`}>
              {kpis.overdueComponents > 0 ? 'Urgent attention required' : 'Health: 100% Green (0 Overdue)'}
            </span>
          </div>
        </div>

      </div>

      {/* 3. Two-Column Section 1: ACTIVE LOANS (SIMPLIFIED) + PENDING REQUESTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT: ACTIVE LOAN SESSIONS (STRICTLY SIMPLIFIED) */}
        <div className="bg-white border-2 border-slate-300 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-blue-700" />
                <h3 className="font-extrabold text-xs uppercase text-tcet-navy tracking-wider">
                  Active Loan Sessions ({kpis.activeSessions})
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Live Laboratory Checkouts
              </span>
            </div>

            {/* Students List: ONLY Student Name & ● Session Active */}
            <div className="divide-y divide-slate-100">
              {activeStudentSessions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                  <p className="font-bold text-slate-700">All Laboratory Hardware Reconciled</p>
                  <p className="text-[11px] text-slate-400">0 active checkouts. Operational Health: 100% Green.</p>
                </div>
              ) : (
                activeStudentSessions.map((loan) => (
                  <div 
                    key={loan._id} 
                    className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 transition-colors"
                  >
                    <span className="font-bold text-xs text-slate-900">
                      {loan.student?.name}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                      <span>Session Active</span>
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom link: View All Active Loans → */}
          <div className="pt-4 mt-2 border-t border-slate-200 text-right">
            <button
              type="button"
              onClick={() => setActiveTab('loans')}
              className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase text-tcet-navy hover:text-blue-900 tracking-wide transition-colors"
            >
              <span>View All Active Loans</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* RIGHT: PENDING REQUESTS (COMPACT SUMMARY) */}
        <div className="bg-white border-2 border-slate-300 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-amber-700" />
                <h3 className="font-extrabold text-xs uppercase text-tcet-navy tracking-wider">
                  Pending Requests ({kpis.pendingRequests})
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Awaiting Verification
              </span>
            </div>

            {/* Compact Requests Table */}
            <div className="divide-y divide-slate-100">
              {pendingRequestsList.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                  <p className="font-bold text-slate-700">Requisition Queue Clear</p>
                  <p className="text-[11px] text-slate-400">No student requisitions pending administrative decision.</p>
                </div>
              ) : (
                pendingRequestsList.map((req) => (
                  <div 
                    key={req._id}
                    onClick={() => setActiveTab('requests')}
                    className="py-2.5 px-2 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {req.student?.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                          • {new Date(req.requestedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {req.projectTitle}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-300 px-2 py-0.5 uppercase">
                        Review
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom link: View All Requests → */}
          <div className="pt-4 mt-2 border-t border-slate-200 text-right">
            <button
              type="button"
              onClick={() => setActiveTab('requests')}
              className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase text-tcet-navy hover:text-blue-900 tracking-wide transition-colors"
            >
              <span>Manage All Requests</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* 4. Two-Column Section 2: RECENT ACTIVITY + QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT: RECENT ACTIVITY (2/3 width) */}
        <div className="lg:col-span-2 bg-white border-2 border-slate-300 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-600" />
                <h3 className="font-extrabold text-xs uppercase text-tcet-navy tracking-wider">
                  Recent Activity Log
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                System Audit Stream
              </span>
            </div>

            <div className="space-y-3">
              {recentActivities.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                  <p className="font-bold text-slate-700">Audit Trail Ready & Clean</p>
                  <p className="text-[11px] text-slate-400">Sample student activities have been purged. Genuine requisitions will be logged here.</p>
                </div>
              ) : (
                recentActivities.map((act) => (
                  <div 
                    key={act._id}
                    className="flex items-start gap-3 p-2.5 hover:bg-slate-50 transition-colors border-l-2 border-slate-300 pl-3"
                  >
                    <div className="w-2 h-2 rounded-full bg-tcet-navy mt-1.5 shrink-0"></div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {act.action}: {act.component}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {act.student !== '—' && <span>Student: {act.student} • </span>}
                        {act.faculty !== '—' && <span>Mentor: {act.faculty} • </span>}
                        <span className="text-slate-500">{act.notes}</span>
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-200 text-right">
            <button
              type="button"
              onClick={() => setActiveTab('activity')}
              className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase text-tcet-navy hover:text-blue-900 tracking-wide transition-colors"
            >
              <span>View All System Activity</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* RIGHT: QUICK ACTIONS (1/3 width) */}
        <div className="lg:col-span-1 bg-white border-2 border-slate-300 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="font-extrabold text-xs uppercase text-tcet-navy tracking-wider">
                Quick Actions
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                Admin Shortcuts
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Action 1: Add Component */}
              <button
                type="button"
                onClick={onOpenAddComponent}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <Plus className="w-4 h-4 text-tcet-navy group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">+ Add Component</span>
                    <span className="text-[10px] text-slate-500">Catalogue hardware into inventory</span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-tcet-navy" />
              </button>

              {/* Action 2: Add Faculty */}
              <button
                type="button"
                onClick={onOpenAddFaculty}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <UserPlus className="w-4 h-4 text-tcet-navy group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">+ Add Faculty</span>
                    <span className="text-[10px] text-slate-500">Enroll new mentor to academic roster</span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-tcet-navy" />
              </button>

              {/* Action 3: Review Requests */}
              <button
                type="button"
                onClick={() => setActiveTab('requests')}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <Inbox className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">Review Requests</span>
                    <span className="text-[10px] text-slate-500">{kpis.pendingRequests} student requests in queue</span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-tcet-navy" />
              </button>

              {/* Action 4: Run Overdue Scan */}
              <button
                type="button"
                onClick={runOverdueScan}
                className="w-full p-3 bg-red-50/50 hover:bg-red-50 border border-red-200 text-left transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <Scan className="w-4 h-4 text-red-700 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="font-bold text-xs text-red-950 block">Run Overdue Scan</span>
                    <span className="text-[10px] text-red-700">Check expiration dates & alert</span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-red-400 group-hover:text-red-700" />
              </button>

              {/* Action 5: Export Inventory */}
              <button
                type="button"
                onClick={handleExportInventory}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-tcet-gold group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">Export Inventory</span>
                    <span className="text-[10px] text-slate-500">Download Excel-compatible CSV</span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-tcet-navy" />
              </button>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono">
            TCET R&D Cell v2.4 Enterprise Core
          </div>
        </div>

      </div>

    </div>
  );
};

export default DashboardView;
