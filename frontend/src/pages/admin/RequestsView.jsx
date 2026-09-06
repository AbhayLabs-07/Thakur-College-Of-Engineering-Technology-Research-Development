import React, { useState, useMemo } from 'react';
import { 
  Inbox, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Cpu, 
  FileText, 
  Eye, 
  Filter, 
  User, 
  GraduationCap,
  ShieldAlert
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

const RequestsView = ({ onSelectRequest }) => {
  const { requests, components, approveRequest, rejectRequest } = useAdmin();

  const [activeStatusTab, setActiveStatusTab] = useState('pending'); // 'pending', 'approved', 'rejected', 'all'
  const [searchTerm, setSearchTerm] = useState('');

  // Pre-calculate stock sufficiency for quick badge rendering
  const requestsWithStockCheck = useMemo(() => {
    return requests.map((req) => {
      let isInsufficient = false;
      const verifiedItems = req.cartItems.map((item) => {
        const comp = components.find(
          (c) => c._id === item.component || c.name.toLowerCase() === (item.componentName || '').toLowerCase()
        );
        const available = comp ? comp.quantityAvailable : 0;
        if (available < item.quantity) {
          isInsufficient = true;
        }
        return {
          ...item,
          available,
          isSufficient: available >= item.quantity
        };
      });

      return {
        ...req,
        verifiedItems,
        hasInsufficientStock: isInsufficient
      };
    });
  }, [requests, components]);

  // Tab counts
  const pendingCount = requests.filter((r) => r.status === 'pending_admin' || r.status === 'pending_faculty').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  const filteredRequests = useMemo(() => {
    return requestsWithStockCheck.filter((req) => {
      // Tab filter
      if (activeStatusTab === 'pending') {
        if (req.status !== 'pending_admin' && req.status !== 'pending_faculty') return false;
      } else if (activeStatusTab === 'approved') {
        if (req.status !== 'approved') return false;
      } else if (activeStatusTab === 'rejected') {
        if (req.status !== 'rejected') return false;
      }

      // Search term
      const term = searchTerm.toLowerCase();
      if (!term) return true;

      return (
        req.requestId?.toLowerCase().includes(term) ||
        req.student?.name?.toLowerCase().includes(term) ||
        req.student?.erpId?.includes(term) ||
        req.facultyMentor?.name?.toLowerCase().includes(term) ||
        req.projectTitle?.toLowerCase().includes(term) ||
        req.cartItems?.some((ci) => ci.componentName?.toLowerCase().includes(term))
      );
    });
  }, [requestsWithStockCheck, activeStatusTab, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Header Banner */}
      <div className="bg-white border-2 border-slate-300 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-tcet-navy text-tcet-gold px-2 py-0.5 border border-tcet-gold">
              Hardware Allocation Requisition Queue
            </span>
            <span className="text-[10px] font-mono text-slate-500 font-bold">
              {pendingCount} Pending Decision
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-tcet-navy uppercase tracking-tight">
            Component Requisitions
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Review student project requests, inspect faculty endorsements, verify live component stock, and authorize hardware issuance.
          </p>
        </div>

        {/* Status Tab Badges */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-300 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveStatusTab('pending')}
            className={`px-3 py-1.5 text-xs font-bold uppercase transition-all ${
              activeStatusTab === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveStatusTab('approved')}
            className={`px-3 py-1.5 text-xs font-bold uppercase transition-all ${
              activeStatusTab === 'approved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveStatusTab('rejected')}
            className={`px-3 py-1.5 text-xs font-bold uppercase transition-all ${
              activeStatusTab === 'rejected'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rejected ({rejectedCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveStatusTab('all')}
            className={`px-3 py-1.5 text-xs font-bold uppercase transition-all ${
              activeStatusTab === 'all'
                ? 'bg-tcet-navy text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({requests.length})
          </button>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="bg-white border-2 border-slate-300 p-4 shadow-xs">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="Search requests by student ERP, student name, project title, component or mentor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-xs h-10 font-medium"
          />
        </div>
      </div>

      {/* Requests Table / Cards */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-white border-2 border-slate-300 p-16 text-center text-slate-400">
            <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h4 className="font-bold text-xs text-slate-600">No requests found in this tab.</h4>
            <p className="text-[11px] text-slate-400 mt-1">Student submissions will automatically appear here once requested.</p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isPending = req.status === 'pending_admin' || req.status === 'pending_faculty';
            const isApproved = req.status === 'approved';
            const isRejected = req.status === 'rejected';

            return (
              <div
                key={req._id}
                className={`bg-white border-2 p-5 shadow-xs transition-all ${
                  req.hasInsufficientStock && isPending
                    ? 'border-red-400 bg-red-50/20'
                    : 'border-slate-300 hover:border-tcet-navy'
                }`}
              >
                <div className="flex flex-col lg:flex-row justify-between gap-6">
                  
                  {/* Left Column: Project, Student, Mentor Details */}
                  <div className="space-y-3 flex-grow">
                    
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono bg-slate-200 text-slate-800 px-2 py-0.5 font-bold uppercase">
                        {req.requestId || req._id}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase border ${
                        isApproved ? 'bg-green-50 text-green-800 border-green-300' :
                        isRejected ? 'bg-red-50 text-red-800 border-red-300' :
                        'bg-amber-100 text-amber-950 border-amber-300'
                      }`}>
                        {req.status.replace('_', ' ')}
                      </span>
                      {req.hasInsufficientStock && isPending && (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-red-600 text-white border border-red-700 animate-pulse flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          <span>Insufficient Stock</span>
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono ml-auto">
                        Req Date: {new Date(req.requestedAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Project Title */}
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-tcet-navy">
                        {req.projectTitle}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Domain: {req.projectDomain}
                      </p>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-700 bg-slate-50 p-3 border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Student Applicant</span>
                        <span className="font-bold text-slate-900">{req.student?.name}</span>
                        <span className="text-slate-500 font-mono text-[11px] block">{req.student?.erpId} • Div {req.student?.division}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Faculty Mentor Endorsement</span>
                        <span className="font-bold text-slate-900">{req.facultyMentor?.name}</span>
                        <span className="text-slate-500 text-[11px] block">{req.facultyMentor?.department}</span>
                      </div>
                    </div>

                    {req.facultyDecision?.remarks && (
                      <p className="text-[11px] text-slate-600 italic bg-amber-50/50 p-2 border-l-2 border-tcet-gold">
                        <strong>Mentor Note:</strong> {req.facultyDecision.remarks}
                      </p>
                    )}

                  </div>

                  {/* Right Column: Hardware List & Decision Controls */}
                  <div className="flex flex-col justify-between lg:w-80 shrink-0 gap-4 border-t lg:border-t-0 lg:border-l border-slate-200 pt-4 lg:pt-0 lg:pl-6">
                    
                    {/* Hardware Items Requested & Live Stock Check */}
                    <div>
                      <span className="font-bold text-xs uppercase text-slate-700 tracking-wide block mb-2">
                        Hardware Items ({req.cartItems.length}):
                      </span>
                      <div className="space-y-1.5">
                        {req.verifiedItems.map((ci, i) => (
                          <div 
                            key={i} 
                            className={`p-2 border text-xs flex items-center justify-between gap-2 ${
                              !ci.isSufficient ? 'bg-red-50 border-red-300' : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <span className="font-medium text-slate-800 truncate">
                              {ci.componentName}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="bg-slate-200 font-mono font-bold text-[10px] px-1.5 py-0.5">
                                ×{ci.quantity}
                              </span>
                              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 border ${
                                ci.isSufficient 
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                                  : 'bg-red-600 text-white border-red-700'
                              }`}>
                                Avail: {ci.available}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions & Decision buttons */}
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => onSelectRequest(req)}
                        className="w-full py-2 bg-white hover:bg-slate-50 text-tcet-navy font-bold text-xs uppercase border border-slate-300 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Full Details & Verify</span>
                      </button>

                      {isPending && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => rejectRequest(req._id, 'Declined by Administrator')}
                            className="flex-1 py-2 bg-white hover:bg-red-50 text-red-600 font-bold text-xs uppercase border border-red-600 transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            disabled={req.hasInsufficientStock}
                            onClick={() => approveRequest(req._id)}
                            className="flex-1 py-2 bg-tcet-navy hover:bg-slate-800 text-white font-bold text-xs uppercase border border-tcet-navy shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={req.hasInsufficientStock ? 'Cannot approve: Insufficient stock' : 'Approve & Issue'}
                          >
                            Approve
                          </button>
                        </div>
                      )}

                      {isApproved && (
                        <div className="text-center font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 py-1.5 text-xs font-mono">
                          ✓ APPROVED & ACTIVE LOAN CREATED
                        </div>
                      )}

                      {isRejected && (
                        <div className="text-center font-bold text-red-700 bg-red-50 border border-red-200 py-1.5 text-xs font-mono">
                          ✕ REQUISITION CLOSED / REJECTED
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default RequestsView;
