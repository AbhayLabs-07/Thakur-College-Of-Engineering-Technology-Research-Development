import React, { useState, useMemo } from 'react';
import { 
  ArrowLeftRight, 
  Search, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  Scan, 
  Filter, 
  FileSpreadsheet, 
  User, 
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { adminService } from '../../services/api';

const ActiveLoansView = ({ onManageLoan }) => {
  const { activeLoans, runOverdueScan } = useAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'due_soon', 'overdue', 'partially_returned', 'returned'

  const now = new Date();

  // Calculate remaining or overdue days helper
  const getLoanTiming = (dueDateStr, status) => {
    if (['returned', 'closed'].includes(status)) {
      return { text: 'Closed', isOverdue: false, isDueSoon: false, days: 0 };
    }
    const due = new Date(dueDateStr);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));

    if (diffDays < 0) {
      const overdueDays = Math.abs(diffDays);
      return { 
        text: `Overdue by ${overdueDays} day${overdueDays > 1 ? 's' : ''}`, 
        isOverdue: true, 
        isDueSoon: false, 
        days: diffDays 
      };
    } else if (diffDays === 0) {
      return { text: 'Due Today', isOverdue: false, isDueSoon: true, days: 0 };
    } else if (diffDays === 1) {
      return { text: 'Due Tomorrow', isOverdue: false, isDueSoon: true, days: 1 };
    } else {
      return { text: `${diffDays} days remaining`, isOverdue: false, isDueSoon: false, days: diffDays };
    }
  };

  const filteredLoans = useMemo(() => {
    return activeLoans
      .filter((loan) => {
        // Status filter
        if (statusFilter !== 'all') {
          if (statusFilter === 'active' && !['active', 'partially_returned'].includes(loan.status)) return false;
          if (statusFilter === 'due_soon' && loan.status !== 'due_soon') return false;
          if (statusFilter === 'overdue' && loan.status !== 'overdue') return false;
          if (statusFilter === 'returned' && loan.status !== 'returned') return false;
        }

        // Search term
        const term = searchTerm.toLowerCase();
        if (!term) return true;

        return (
          loan._id?.toLowerCase().includes(term) ||
          loan.qrToken?.toLowerCase().includes(term) ||
          loan.student?.name?.toLowerCase().includes(term) ||
          loan.student?.erpId?.includes(term) ||
          loan.facultyMentor?.name?.toLowerCase().includes(term) ||
          loan.projectTitle?.toLowerCase().includes(term) ||
          loan.cartItems?.some((ci) => ci.componentName?.toLowerCase().includes(term))
        );
      })
      .sort((a, b) => {
        // Overdue first, then due date ASC
        const isOverdueA = new Date(a.dueDate) < now && !['returned', 'closed'].includes(a.status);
        const isOverdueB = new Date(b.dueDate) < now && !['returned', 'closed'].includes(b.status);
        if (isOverdueA && !isOverdueB) return -1;
        if (!isOverdueA && isOverdueB) return 1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [activeLoans, statusFilter, searchTerm, now]);

  const overdueTotalCount = activeLoans.filter(
    (l) => !['returned', 'closed'].includes(l.status) && new Date(l.dueDate) < now
  ).length;

  const handleExportLoans = async () => {
    try {
      await adminService.downloadExport('/admin/export/loans', 'tcet_hardware_loans_export.csv');
    } catch {
      window.open(adminService.getExportLoansUrl(), '_blank');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Top Banner */}
      <div className="bg-white border-2 border-slate-300 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-tcet-navy text-tcet-gold px-2 py-0.5 border border-tcet-gold">
              Live Asset Checkout & Allocation Tracking
            </span>
            <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 font-bold">
              Health: 100% Green
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-tcet-navy uppercase tracking-tight">
            Active Loans Management
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Complete loan register tracking student leads, faculty mentors, remaining loan days, return reconciliation, and overdue compliance.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportLoans}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase border border-slate-300 transition-colors shadow-xs"
            title="Download CSV report of all loans"
          >
            <FileSpreadsheet className="w-4 h-4 text-tcet-gold" />
            <span>Export Loans CSV</span>
          </button>
          <button
            type="button"
            onClick={runOverdueScan}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-tcet-navy hover:bg-slate-800 text-white font-bold text-xs uppercase border border-tcet-navy transition-all shadow-xs"
          >
            <Scan className="w-4 h-4 text-tcet-gold" />
            <span>Run Overdue Scan</span>
          </button>
        </div>
      </div>

      {/* Overdue Warning Alert Bar or Clean Green Status Bar */}
      {overdueTotalCount > 0 ? (
        <div className="bg-red-50 border-2 border-red-300 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-red-950">
          <div className="flex items-center gap-2.5 font-bold">
            <AlertTriangle className="w-5 h-5 text-red-700 shrink-0 animate-pulse" />
            <span>
              <strong>OVERDUE ALERT:</strong> {overdueTotalCount} loan session(s) exceed institutional return deadlines. Automatic notices dispatched.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter('overdue')}
            className="text-[11px] font-mono font-bold uppercase bg-red-600 text-white px-3 py-1 border border-red-700 hover:bg-red-700 self-start sm:self-auto"
          >
            Filter Overdue Loans
          </button>
        </div>
      ) : (
        <div className="bg-emerald-50 border-2 border-emerald-300 p-3 flex items-center justify-between gap-3 text-xs text-emerald-950">
          <div className="flex items-center gap-2.5 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              <strong>LOAN REGISTER COMPLIANT:</strong> All hardware loans in good standing. 0 overdue delinquent checkouts.
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 border border-emerald-300">
            Health: Green
          </span>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white border-2 border-slate-300 p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          
          <div className="lg:col-span-8 relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Search loans by token (TCET-RD-...), student ERP, student name, mentor or project..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-xs h-10 font-medium"
            />
          </div>

          <div className="lg:col-span-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-xs bg-white h-10 font-semibold text-slate-800"
            >
              <option value="all">All Loan Statuses ({activeLoans.length})</option>
              <option value="active">Active Sessions Only</option>
              <option value="due_soon">Due Soon (≤ 24h)</option>
              <option value="overdue">Overdue Alerts Only</option>
              <option value="returned">Returned / Closed</option>
            </select>
          </div>

        </div>
      </div>

      {/* Comprehensive Active Loans Table */}
      <div className="bg-white border-2 border-slate-300 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-tcet-navy text-white uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="p-3 w-28 text-center">Token / Loan ID</th>
                <th className="p-3">Student Lead</th>
                <th className="p-3">Hardware Issued</th>
                <th className="p-3">Faculty Mentor</th>
                <th className="p-3 text-center">Issue Date</th>
                <th className="p-3 text-center">Due Date</th>
                <th className="p-3 text-center">Remaining</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-16 text-center text-slate-500">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                    <p className="font-bold text-xs text-slate-800">No Active Loans (Operational Status: All Green)</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">All hardware assets are accounted for and no overdue checkouts exist.</p>
                  </td>
                </tr>
              ) : (filteredLoans.map((loan) => {
                  const timing = getLoanTiming(loan.dueDate, loan.status);
                  const isClosed = ['returned', 'closed'].includes(loan.status);

                  return (
                    <tr 
                      key={loan._id} 
                      className={`transition-colors ${
                        timing.isOverdue 
                          ? 'bg-red-50/40 hover:bg-red-50/70' 
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Token */}
                      <td className="p-3 text-center font-mono font-bold text-slate-700">
                        <span className="bg-slate-100 border border-slate-300 px-2 py-1 text-[11px] block">
                          {loan.qrToken || loan._id}
                        </span>
                      </td>

                      {/* Student */}
                      <td className="p-3">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block">{loan.student?.name}</span>
                          <span className="text-[11px] font-mono text-slate-500">ERP: {loan.student?.erpId}</span>
                          <span className="text-[10px] text-slate-400 block">{loan.student?.branch}</span>
                        </div>
                      </td>

                      {/* Component(s) */}
                      <td className="p-3">
                        <div className="space-y-1 max-w-xs">
                          {loan.cartItems.map((ci, i) => (
                            <div key={i} className="flex items-center justify-between text-[11px] bg-slate-50 p-1 border border-slate-200">
                              <span className="font-semibold text-slate-800 truncate pr-2">
                                {ci.componentName}
                              </span>
                              <span className="font-mono font-bold bg-slate-200 px-1 py-0.2 text-[10px] shrink-0">
                                ×{ci.quantityIssued}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Faculty */}
                      <td className="p-3">
                        <span className="font-semibold text-slate-800 block">{loan.facultyMentor?.name}</span>
                        <span className="text-[10px] text-slate-500">{loan.facultyMentor?.department}</span>
                      </td>

                      {/* Issue Date */}
                      <td className="p-3 text-center font-mono text-slate-600 text-[11px]">
                        {new Date(loan.issueDate).toLocaleDateString()}
                      </td>

                      {/* Due Date */}
                      <td className={`p-3 text-center font-mono text-[11px] ${
                        timing.isOverdue ? 'font-black text-red-600' : 'text-slate-700 font-semibold'
                      }`}>
                        {new Date(loan.dueDate).toLocaleDateString()}
                      </td>

                      {/* Remaining / Overdue badge */}
                      <td className="p-3 text-center">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 border ${
                          timing.isOverdue ? 'bg-red-600 text-white border-red-700 animate-pulse' :
                          timing.isDueSoon ? 'bg-amber-100 text-amber-900 border-amber-300' :
                          isClosed ? 'bg-slate-100 text-slate-500 border-slate-200' :
                          'bg-slate-100 text-slate-700 border-slate-300'
                        }`}>
                          {timing.text}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center">
                        <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 border ${
                          timing.isOverdue ? 'bg-red-600 text-white border-red-700' :
                          loan.status === 'partially_returned' ? 'bg-blue-50 text-blue-800 border-blue-300 font-bold' :
                          isClosed ? 'bg-slate-200 text-slate-700 border-slate-300' :
                          'bg-emerald-600 text-white border-emerald-700'
                        }`}>
                          {loan.status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => onManageLoan(loan)}
                          className="w-full py-1.5 px-2.5 bg-tcet-navy hover:bg-slate-800 text-white font-bold text-xs uppercase transition-colors shadow-xs"
                        >
                          Manage
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-mono">
          <span>Showing {filteredLoans.length} of {activeLoans.length} active records</span>
          <span>Click "Manage" to process full or partial returns</span>
        </div>
      </div>

    </div>
  );
};

export default ActiveLoansView;
