import React, { useState } from 'react';
import { 
  X, 
  ArrowLeftRight, 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle, 
  Calendar, 
  Clock, 
  User, 
  GraduationCap, 
  PackageCheck,
  ShieldCheck,
  Info
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

const LoanManagementModal = ({ isOpen, onClose, loan }) => {
  const { processReturn } = useAdmin();

  const [returnItems, setReturnItems] = useState(() => {
    if (!loan) return [];
    return loan.cartItems.map((item) => {
      const remaining = item.quantityIssued - ((item.quantityReturned || 0) + (item.quantityDamaged || 0) + (item.quantityLost || 0));
      return {
        componentId: item.component,
        componentName: item.componentName,
        quantityIssued: item.quantityIssued,
        remaining,
        returnGoodQty: remaining > 0 ? remaining : 0, // Default to full good return
        damagedQty: 0,
        lostQty: 0,
        remarks: ''
      };
    });
  });

  const [generalNotes, setGeneralNotes] = useState('');

  // Re-initialize state when loan opens
  React.useEffect(() => {
    if (loan) {
      setReturnItems(
        loan.cartItems.map((item) => {
          const remaining = item.quantityIssued - ((item.quantityReturned || 0) + (item.quantityDamaged || 0) + (item.quantityLost || 0));
          return {
            componentId: item.component,
            componentName: item.componentName,
            quantityIssued: item.quantityIssued,
            remaining,
            returnGoodQty: remaining > 0 ? remaining : 0,
            damagedQty: 0,
            lostQty: 0,
            remarks: ''
          };
        })
      );
      setGeneralNotes('');
    }
  }, [loan, isOpen]);

  if (!isOpen || !loan) return null;

  const handleQtyChange = (idx, field, value) => {
    setReturnItems((prev) => {
      const copy = [...prev];
      const target = { ...copy[idx] };
      const val = Math.max(0, parseInt(value, 10) || 0);

      target[field] = val;

      // Prevent sum of processed quantities from exceeding remaining loan
      const currentSum = (field === 'returnGoodQty' ? val : target.returnGoodQty) +
                         (field === 'damagedQty' ? val : target.damagedQty) +
                         (field === 'lostQty' ? val : target.lostQty);

      if (currentSum > target.remaining) {
        // Adjust the current field to fit exactly
        const excess = currentSum - target.remaining;
        target[field] = Math.max(0, val - excess);
      }

      copy[idx] = target;
      return copy;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const result = processReturn(loan._id, {
      items: returnItems,
      generalNotes
    });

    if (result.success) {
      onClose();
    }
  };

  const isLoanClosed = ['returned', 'closed'].includes(loan.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border-2 border-slate-300 w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-tcet-navy text-white px-6 py-3.5 flex items-center justify-between border-b-2 border-tcet-gold">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500/20 border border-tcet-gold text-tcet-gold flex items-center justify-center font-bold">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm uppercase tracking-wider">
                  Manage Loan Session: {loan.qrToken || loan._id}
                </h3>
                <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 border ${
                  loan.status === 'overdue' ? 'bg-red-600 text-white border-red-700' :
                  loan.status === 'due_soon' ? 'bg-amber-400 text-slate-950 border-amber-500' :
                  loan.status === 'returned' ? 'bg-slate-200 text-slate-800 border-slate-300' :
                  'bg-emerald-600 text-white border-emerald-700'
                }`}>
                  {loan.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-[11px] text-tcet-gold font-mono">
                Issued: {new Date(loan.issueDate).toLocaleDateString()} • Due: {new Date(loan.dueDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs text-slate-800">
          
          {/* Student & Project Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 border border-slate-200 p-3.5">
            <div>
              <span className="text-[10px] text-slate-500 font-mono font-bold uppercase block">Student Lead</span>
              <p className="font-bold text-slate-900 text-xs">{loan.student?.name} ({loan.student?.erpId})</p>
              <p className="text-[11px] text-slate-600">{loan.student?.branch} • Div {loan.student?.division}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-mono font-bold uppercase block">Supervising Faculty</span>
              <p className="font-bold text-slate-900 text-xs">{loan.facultyMentor?.name}</p>
              <p className="text-[11px] text-slate-600 truncate">{loan.projectTitle}</p>
            </div>
          </div>

          {/* Condition Instructions Warning */}
          <div className="bg-amber-50/80 border border-amber-200 p-3 text-amber-950 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-[11px] leading-relaxed">
              <span className="font-bold uppercase tracking-wider block">Automatic Stock Synchronization Rules:</span>
              <p>• <strong>Good Condition:</strong> Units are automatically added back to Available Stock.</p>
              <p>• <strong>Damaged:</strong> Units are placed in inspection quarantine. Stock is NOT incremented until repaired.</p>
              <p>• <strong>Lost / Missing:</strong> Units are deducted from active loans and logged for accountability.</p>
            </div>
          </div>

          {/* Hardware Return Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <span className="font-extrabold uppercase text-tcet-navy text-xs tracking-wider">
                Hardware Return Reconciliation
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Adjust quantities below based on physical inspection
              </span>
            </div>

            <div className="border border-slate-200 divide-y divide-slate-200">
              {returnItems.map((item, idx) => (
                <div key={idx} className="p-3 bg-white space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs">{item.componentName}</h5>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Total Issued: <strong>{item.quantityIssued}</strong> | Remaining on Loan: <strong className="text-tcet-navy">{item.remaining}</strong>
                      </span>
                    </div>

                    {item.remaining === 0 && (
                      <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 border border-slate-300">
                        Already Fully Reconciled
                      </span>
                    )}
                  </div>

                  {item.remaining > 0 && !isLoanClosed && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      {/* Good condition */}
                      <div className="bg-emerald-50/60 border border-emerald-200 p-2">
                        <label className="block text-[10px] font-bold text-emerald-900 uppercase mb-1">
                          ✓ Return in Good Condition
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={item.remaining}
                          value={item.returnGoodQty}
                          onChange={(e) => handleQtyChange(idx, 'returnGoodQty', e.target.value)}
                          className="w-full px-2 py-1 border border-emerald-300 bg-white font-mono font-bold text-xs text-emerald-900 focus:outline-none"
                        />
                        <span className="text-[9px] text-emerald-700 block mt-0.5">Adds to available stock</span>
                      </div>

                      {/* Damaged */}
                      <div className="bg-amber-50/60 border border-amber-200 p-2">
                        <label className="block text-[10px] font-bold text-amber-900 uppercase mb-1">
                          ⚠ Marked Damaged
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={item.remaining}
                          value={item.damagedQty}
                          onChange={(e) => handleQtyChange(idx, 'damagedQty', e.target.value)}
                          className="w-full px-2 py-1 border border-amber-300 bg-white font-mono font-bold text-xs text-amber-900 focus:outline-none"
                        />
                        <span className="text-[9px] text-amber-700 block mt-0.5">Quarantined for repair</span>
                      </div>

                      {/* Lost */}
                      <div className="bg-red-50/60 border border-red-200 p-2">
                        <label className="block text-[10px] font-bold text-red-900 uppercase mb-1">
                          ✕ Marked Lost / Missing
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={item.remaining}
                          value={item.lostQty}
                          onChange={(e) => handleQtyChange(idx, 'lostQty', e.target.value)}
                          className="w-full px-2 py-1 border border-red-300 bg-white font-mono font-bold text-xs text-red-900 focus:outline-none"
                        />
                        <span className="text-[9px] text-red-700 block mt-0.5">Audit recorded</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Administrative Return Remarks */}
          {!isLoanClosed && (
            <div className="space-y-1">
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Return Inspection Remarks & Lab Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Components tested on bench, all pins intact, power cables included..."
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                className="w-full px-3 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-xs bg-white font-medium"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 font-bold uppercase text-slate-600 hover:text-slate-900 border border-slate-300 bg-white transition-colors"
            >
              CANCEL
            </button>

            {!isLoanClosed && (
              <button
                type="submit"
                className="px-6 py-2.5 font-bold uppercase text-white bg-green-700 hover:bg-green-800 border border-green-800 shadow-xs transition-colors flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4 text-white" />
                <span>CONFIRM RETURN & RECONCILE STOCK</span>
              </button>
            )}
          </div>

        </form>

      </div>
    </div>
  );
};

export default LoanManagementModal;
