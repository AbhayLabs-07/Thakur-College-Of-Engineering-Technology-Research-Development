import React, { useState } from 'react';
import { 
  X, 
  Inbox, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Cpu, 
  User, 
  GraduationCap, 
  FileText, 
  Calendar,
  ShieldAlert
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

const RequestDetailDrawer = ({ isOpen, onClose, request }) => {
  const { components, approveRequest, rejectRequest } = useAdmin();
  const [adminNote, setAdminNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Perform live stock availability check for each requested component using useMemo before any early return
  const { itemChecks, hasInsufficientStock } = React.useMemo(() => {
    if (!request || !request.cartItems) return { itemChecks: [], hasInsufficientStock: false };
    let insufficient = false;
    const checks = request.cartItems.map((item) => {
      const comp = components.find(
        (c) => c._id === item.component || c.name.toLowerCase() === (item.componentName || '').toLowerCase()
      );
      const available = comp ? comp.quantityAvailable : 0;
      const total = comp ? comp.quantityTotal : 0;
      const isSufficient = available >= item.quantity;
      if (!isSufficient) insufficient = true;

      return {
        ...item,
        componentRecord: comp,
        available,
        total,
        isSufficient
      };
    });
    return { itemChecks: checks, hasInsufficientStock: insufficient };
  }, [request, components]);

  if (!isOpen || !request) return null;

  const handleApprove = () => {
    if (hasInsufficientStock) {
      alert('Cannot approve request: One or more requested components have insufficient available stock in inventory.');
      return;
    }
    const result = approveRequest(request._id, adminNote);
    if (result.success) {
      onClose();
    }
  };

  const handleReject = () => {
    rejectRequest(request._id, rejectReason || 'Declined by Administrator');
    setIsRejecting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white border-l-2 border-slate-300 shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="bg-tcet-navy text-white px-6 py-4 flex items-center justify-between border-b-2 border-tcet-gold">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-500/20 border border-tcet-gold text-tcet-gold flex items-center justify-center font-mono font-bold text-sm">
                <Inbox className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base tracking-wide uppercase">
                    {request.requestId || 'REQ-RECORD'}
                  </h3>
                  <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.2 border ${
                    request.status === 'approved' ? 'bg-green-600 text-white border-green-700' :
                    request.status === 'rejected' ? 'bg-red-600 text-white border-red-700' :
                    'bg-amber-400 text-slate-950 border-amber-500'
                  }`}>
                    {request.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-tcet-gold font-mono">
                  Requested on {new Date(request.requestedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-grow overflow-y-auto p-6 space-y-6 text-xs text-slate-800">
            
            {/* Live Stock Warning Banner if insufficient */}
            {hasInsufficientStock && request.status === 'pending_admin' && (
              <div className="bg-red-50 border-2 border-red-300 p-4 text-red-900 space-y-1 animate-pulse">
                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wide">
                  <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                  <span>INSUFFICIENT STOCK DETECTED</span>
                </div>
                <p className="text-[11px] text-red-800 leading-relaxed">
                  One or more hardware components exceed available inventory quantities. To protect data integrity, approval is locked until stock is returned or requisition quantity is adjusted.
                </p>
              </div>
            )}

            {/* Project & Purpose Information */}
            <div className="bg-slate-50 border-2 border-slate-200 p-4 space-y-2">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">
                Research Project Profile
              </span>
              <h4 className="font-extrabold text-sm text-tcet-navy">
                {request.projectTitle}
              </h4>
              <p className="text-xs text-slate-600 font-medium">
                <strong>Domain:</strong> {request.projectDomain}
              </p>
              {request.projectDescription && (
                <p className="text-xs text-slate-600 italic bg-white p-2.5 border border-slate-200">
                  "{request.projectDescription}"
                </p>
              )}
            </div>

            {/* Student & Faculty Mentor Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Student */}
              <div className="p-3.5 border border-slate-200 bg-white space-y-1.5">
                <div className="flex items-center gap-1.5 text-tcet-navy font-bold uppercase text-[11px]">
                  <User className="w-3.5 h-3.5 text-tcet-gold" />
                  <span>Student Applicant</span>
                </div>
                <p className="font-extrabold text-slate-900">{request.student?.name}</p>
                <p className="text-slate-500 font-mono text-[11px]">ERP: {request.student?.erpId}</p>
                <p className="text-slate-500 text-[11px]">{request.student?.branch} (Div {request.student?.division})</p>
                <p className="text-slate-500 font-mono text-[11px]">{request.student?.contactNumber || 'N/A'}</p>
              </div>

              {/* Faculty Mentor */}
              <div className="p-3.5 border border-slate-200 bg-white space-y-1.5">
                <div className="flex items-center gap-1.5 text-tcet-navy font-bold uppercase text-[11px]">
                  <GraduationCap className="w-3.5 h-3.5 text-tcet-gold" />
                  <span>Faculty Mentor</span>
                </div>
                <p className="font-extrabold text-slate-900">{request.facultyMentor?.name}</p>
                <p className="text-slate-500 text-[11px]">{request.facultyMentor?.department}</p>
                {request.facultyDecision?.remarks && (
                  <div className="bg-amber-50 p-2 border-l-2 border-tcet-gold text-[10px] text-amber-950 font-medium">
                    <strong>Mentor Endorsement:</strong> {request.facultyDecision.remarks}
                  </div>
                )}
              </div>
            </div>

            {/* Requested Hardware & Stock Verification Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="font-extrabold text-xs uppercase text-tcet-navy tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-tcet-gold" />
                  <span>Hardware Requisition & Stock Check</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {itemChecks.length} Item(s)
                </span>
              </div>

              <div className="divide-y divide-slate-200 border border-slate-200">
                {itemChecks.map((item, idx) => (
                  <div key={idx} className={`p-3 flex items-center justify-between gap-4 ${!item.isSufficient ? 'bg-red-50/70' : 'bg-white'}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-slate-100 border border-slate-200 p-1 shrink-0 flex items-center justify-center">
                        <img 
                          src={item.componentRecord?.imageUrl || '/Photos/Arduino Uno.png'} 
                          alt="" 
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => { e.target.src = '/Photos/Arduino Uno.png'; }}
                        />
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-bold text-slate-900 truncate text-xs">
                          {item.componentName}
                        </h5>
                        <p className="text-[10px] text-slate-500">
                          Storage: {item.componentRecord?.storageLocation || 'Lab Storage'}
                        </p>
                      </div>
                    </div>

                    {/* Stock comparison badge */}
                    <div className="text-right shrink-0">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-mono text-xs font-black bg-slate-100 border border-slate-300 px-2 py-0.5">
                          Req: ×{item.quantity}
                        </span>
                        <span className={`font-mono text-xs font-black px-2 py-0.5 border ${
                          item.isSufficient
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-red-600 text-white border-red-700'
                        }`}>
                          Avail: {item.available} / {item.total}
                        </span>
                      </div>
                      {!item.isSufficient && (
                        <span className="text-[10px] font-bold text-red-600 block mt-0.5 uppercase tracking-wide">
                          Short by {item.quantity - item.available} unit(s)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Dispatch / Decision Note */}
            {request.status === 'pending_admin' && (
              <div className="space-y-1.5 pt-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Administrative Notes / Storage Dispatch Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Handed over with power adapter and USB cable..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-xs bg-white"
                />
              </div>
            )}

            {/* Rejection Remarks Form if toggled */}
            {isRejecting && (
              <div className="p-4 bg-red-50 border-2 border-red-300 space-y-3">
                <h5 className="font-extrabold text-xs text-red-900 uppercase">
                  State Reason for Requisition Rejection:
                </h5>
                <textarea
                  rows="2"
                  placeholder="e.g. Incompatible hardware setup, please consult mentor to revise item specs..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full p-2 border border-red-300 text-xs bg-white focus:outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRejecting(false)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 uppercase bg-white border border-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleReject}
                    className="px-4 py-1.5 text-xs font-bold text-white uppercase bg-red-700 hover:bg-red-800"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Drawer Actions Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 font-bold uppercase text-slate-600 hover:text-slate-900 border border-slate-300 bg-white transition-colors"
            >
              CLOSE
            </button>

            {request.status === 'pending_admin' && !isRejecting && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRejecting(true)}
                  className="px-4 py-2.5 font-bold uppercase text-red-600 hover:bg-red-50 border border-red-600 transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>REJECT</span>
                </button>

                <button
                  type="button"
                  disabled={hasInsufficientStock}
                  onClick={handleApprove}
                  className="px-6 py-2.5 font-bold uppercase text-white bg-tcet-navy hover:bg-slate-800 border border-tcet-navy shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={hasInsufficientStock ? 'Cannot approve: Insufficient stock' : 'Approve and deduct stock'}
                >
                  <CheckCircle2 className="w-4 h-4 text-tcet-gold" />
                  <span>APPROVE & ISSUE HARDWARE</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default RequestDetailDrawer;
