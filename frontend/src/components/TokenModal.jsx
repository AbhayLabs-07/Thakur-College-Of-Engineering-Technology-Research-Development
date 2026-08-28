import React from 'react';
import { X, Printer, Download } from 'lucide-react';

const TokenModal = ({ isOpen, onClose, record }) => {
  if (!isOpen || !record) return null;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(record.qrToken)}&size=250x250&color=0b2545`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 glass-backdrop flex items-center justify-center z-50 p-4">
      <div className="bg-white border-2 border-tcet-navy w-full max-w-lg shadow-2xl relative">
        {/* Modal Header */}
        <div className="bg-tcet-navy text-white px-4 py-3 flex justify-between items-center border-b-2 border-tcet-gold">
          <h3 className="font-bold tracking-wide">SECURE CHECKOUT TOKEN</h3>
          <button onClick={onClose} className="text-white hover:text-tcet-gold transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[80vh] print-content">
          <div className="text-center mb-6">
            <p className="text-xs text-tcet-mutedText uppercase font-bold tracking-wider mb-2">
              Present this QR Code to the Lab Admin for Verification
            </p>
            <div className="inline-block border-2 border-tcet-navy p-3 bg-white mb-2">
              <img 
                src={qrCodeUrl} 
                alt="Verification QR Code" 
                className="w-48 h-48 mx-auto"
              />
            </div>
            <p className="font-mono text-sm font-bold text-tcet-navy">{record.qrToken}</p>
          </div>

          <div className="border-t border-b border-slate-200 py-4 mb-4 text-sm space-y-2">
            <div>
              <span className="text-tcet-mutedText font-semibold block text-xs uppercase">Project Title</span>
              <span className="font-bold text-tcet-darkText">{record.projectTitle}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-tcet-mutedText font-semibold block text-xs uppercase">Domain</span>
                <span className="font-semibold">{record.projectDomain}</span>
              </div>
              <div>
                <span className="text-tcet-mutedText font-semibold block text-xs uppercase">Status</span>
                <span className={`inline-block px-2 py-0.5 text-xs font-bold uppercase ${
                  record.status === 'pending_faculty' ? 'bg-yellow-100 text-yellow-800' :
                  record.status === 'pending_admin' ? 'bg-blue-100 text-blue-800' :
                  record.status === 'handed_out' ? 'bg-green-100 text-green-800 border border-green-300' :
                  record.status === 'returned' ? 'bg-slate-100 text-slate-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {record.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-tcet-mutedText font-semibold block text-xs uppercase">Mentor</span>
                <span className="font-semibold">{record.facultyMentor?.name}</span>
              </div>
              <div>
                <span className="text-tcet-mutedText font-semibold block text-xs uppercase">Due Date</span>
                <span className="font-mono font-semibold">{new Date(record.dueDate).toDateString()}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-xs uppercase text-tcet-navy tracking-wider mb-2">Requested Hardware</h4>
            <div className="border border-slate-200 divide-y divide-slate-200 text-xs">
              {record.cartItems.map((item, idx) => (
                <div key={idx} className="p-2 flex justify-between items-center bg-slate-50">
                  <span className="font-semibold text-slate-800">{item.component?.name}</span>
                  <span className="bg-tcet-navy text-white px-2 py-0.5 font-bold">Qty: {item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="bg-slate-100 px-6 py-4 flex justify-end gap-3 border-t border-slate-200">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-tcet-navy hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 border border-tcet-navy transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>PRINT RECEIPT</span>
          </button>
          <a
            href={qrCodeUrl}
            download={`token-${record.qrToken}.png`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-tcet-navy text-xs font-bold px-4 py-2 border-2 border-tcet-navy transition-all"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD QR</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default TokenModal;
