import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  Clock, 
  User, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  FileText 
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

const ACTION_TYPES = [
  'All Actions',
  'Component Issued',
  'Component Returned',
  'Partial Return',
  'Component Added',
  'Component Edited',
  'Component Deleted',
  'Component Restored',
  'New Request Received',
  'Request Approved',
  'Request Rejected',
  'Faculty Added',
  'Faculty Removed',
  'Loan Marked Overdue',
  'Overdue Scan Run'
];

const ActivityLogView = () => {
  const { activityLogs } = useAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('All Actions');

  const filteredLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      const matchesAction = selectedAction === 'All Actions' || log.action === selectedAction;
      const term = searchTerm.toLowerCase();
      if (!term) return matchesAction;

      const matchesSearch = (
        log.action.toLowerCase().includes(term) ||
        (log.student && log.student.toLowerCase().includes(term)) ||
        (log.faculty && log.faculty.toLowerCase().includes(term)) ||
        (log.component && log.component.toLowerCase().includes(term)) ||
        (log.notes && log.notes.toLowerCase().includes(term))
      );

      return matchesAction && matchesSearch;
    });
  }, [activityLogs, selectedAction, searchTerm]);

  // Download Activity Logs as CSV
  const handleExportLogsCSV = () => {
    const headers = ['Action', 'Component', 'Quantity', 'Student', 'Faculty', 'Performed By', 'Timestamp', 'Status', 'Notes'];
    const rows = filteredLogs.map((log) => [
      `"${log.action}"`,
      `"${log.component}"`,
      log.quantity,
      `"${log.student}"`,
      `"${log.faculty}"`,
      `"${log.performedBy}"`,
      `"${new Date(log.timestamp).toLocaleString()}"`,
      `"${log.status}"`,
      `"${(log.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tcet_rnd_activity_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Top Banner */}
      <div className="bg-white border-2 border-slate-300 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-tcet-navy text-tcet-gold px-2 py-0.5 border border-tcet-gold">
              Institutional Audit Trail & Governance Log
            </span>
            <span className="text-[10px] font-mono text-slate-500 font-bold">
              {activityLogs.length} Events Catalogued
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-tcet-navy uppercase tracking-tight">
            Activity Log
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Comprehensive immutable audit history of hardware checkouts, inventory adjustments, faculty enrolments, approvals, and returns.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleExportLogsCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-tcet-navy hover:bg-slate-800 text-white font-bold text-xs uppercase border border-tcet-navy transition-all shadow-xs"
          >
            <Download className="w-4 h-4 text-tcet-gold" />
            <span>Export Audit Log CSV</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border-2 border-slate-300 p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          
          <div className="lg:col-span-8 relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Search audit trail by student, mentor, component name, action or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-xs h-10 font-medium"
            />
          </div>

          <div className="lg:col-span-4">
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full px-3 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-xs bg-white h-10 font-semibold text-slate-800"
            >
              {ACTION_TYPES.map((act) => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Activity Log Table */}
      <div className="bg-white border-2 border-slate-300 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-tcet-navy text-white uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="p-3 w-40">Action Event</th>
                <th className="p-3">Component / Resource</th>
                <th className="p-3 text-center">Qty</th>
                <th className="p-3">Student Involved</th>
                <th className="p-3">Faculty Mentor</th>
                <th className="p-3 text-center">Timestamp</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3">Audit Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center text-slate-400">
                    <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-xs text-slate-600">No activity events match your filter criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isReturn = log.action.includes('Return');
                  const isIssue = log.action.includes('Issued');
                  const isOverdue = log.action.includes('Overdue');
                  const isApproval = log.action.includes('Approved');

                  return (
                    <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                      
                      {/* Action Event */}
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                            isReturn ? 'bg-emerald-600' :
                            isIssue ? 'bg-blue-600' :
                            isOverdue ? 'bg-red-600' :
                            isApproval ? 'bg-green-600' :
                            'bg-amber-600'
                          }`}></span>
                          <span className="font-extrabold text-slate-900 text-xs">
                            {log.action}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block pl-4 font-mono">
                          By: {log.performedBy.split(' ')[0]}
                        </span>
                      </td>

                      {/* Component */}
                      <td className="p-3 text-tcet-navy font-bold">
                        {log.component}
                      </td>

                      {/* Quantity */}
                      <td className="p-3 text-center font-mono font-bold text-slate-800">
                        {log.quantity || '—'}
                      </td>

                      {/* Student */}
                      <td className="p-3 text-slate-700">
                        {log.student}
                      </td>

                      {/* Faculty */}
                      <td className="p-3 text-slate-700">
                        {log.faculty}
                      </td>

                      {/* Timestamp */}
                      <td className="p-3 text-center font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center">
                        <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-300">
                          {log.status}
                        </span>
                      </td>

                      {/* Audit Remarks */}
                      <td className="p-3 text-slate-500 text-[11px] max-w-xs truncate" title={log.notes}>
                        {log.notes || '—'}
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
          <span>Showing {filteredLogs.length} audit entries</span>
          <span>Automatic System Generator Active</span>
        </div>
      </div>

    </div>
  );
};

export default ActivityLogView;
