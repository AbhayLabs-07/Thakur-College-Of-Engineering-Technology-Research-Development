import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  ShieldAlert, 
  Download, 
  RefreshCw, 
  Database, 
  CheckCircle2, 
  Server,
  KeyRound,
  Package
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { adminService } from '../../services/api';

const UtilitiesView = () => {
  const { runOverdueScan, activeLoans, components } = useAdmin();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const handleRunScan = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await runOverdueScan();
      setScanResult(res);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 max-w-5xl mx-auto">
      
      {/* Top Banner */}
      <div className="bg-white border-2 border-slate-300 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-tcet-navy text-tcet-gold px-2 py-0.5 border border-tcet-gold">
              Administrative Utilities & Exporters
            </span>
            <span className="text-[10px] font-mono text-slate-500 font-bold">
              Production Suite
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-tcet-navy uppercase tracking-tight">
            Utilities & Data Exports
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Export official institutional credentials spreadsheets, inventory catalogs, and trigger the automated overdue alert email transporter.
          </p>
        </div>
      </div>

      {/* Two Main Data Exporters Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Exporter 1: Credentials Distribution Sheet */}
        <div className="bg-white border-2 border-slate-300 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 bg-amber-50 border border-amber-300 text-amber-800 flex items-center justify-center font-bold">
                <KeyRound className="w-5 h-5 text-tcet-gold" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm uppercase text-tcet-navy">
                  Credentials Distribution Sheet
                </h3>
                <span className="text-[10px] font-mono text-slate-400">
                  Student ERP & Initial Access Keys
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Export the complete master spreadsheet containing student generated User IDs, ERP numbers, and initial access passwords. Distribute this sheet via secure administrative channels.
            </p>

            <div className="bg-slate-50 p-3 border border-slate-200 mb-6 space-y-1 text-[11px] text-slate-600 font-mono">
              <p>• Format: Microsoft Excel compatible (.csv)</p>
              <p>• Fields: Name, ERP_ID, Email, UserID, Password</p>
              <p>• Access Level: Restricted to Principal / Dean / Admin</p>
            </div>
          </div>

          <a
            href={adminService.getExportCredentialsUrl()}
            download="tcet_student_credentials.csv"
            className="w-full text-center bg-tcet-navy hover:bg-slate-800 text-white font-bold text-xs py-3 border border-tcet-navy uppercase transition-all shadow-xs flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-tcet-gold" />
            <span>DOWNLOAD CREDENTIALS CSV</span>
          </a>
        </div>

        {/* Exporter 2: Inventory Asset Log */}
        <div className="bg-white border-2 border-slate-300 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 bg-blue-50 border border-blue-300 text-blue-800 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm uppercase text-tcet-navy">
                  Inventory Asset Log
                </h3>
                <span className="text-[10px] font-mono text-slate-400">
                  Laboratory Equipment Master Roster
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Export comprehensive snapshot of all laboratory hardware components, current stock metrics, categories, technical specs, storage locations, and keywords.
            </p>

            <div className="bg-slate-50 p-3 border border-slate-200 mb-6 space-y-1 text-[11px] text-slate-600 font-mono">
              <p>• Current Catalogued Items: {components.length}</p>
              <p>• Fields: Component ID, Name, Category, Total, Available, Loaned</p>
              <p>• Encoding: UTF-8 Standard Excel</p>
            </div>
          </div>

          <a
            href={adminService.getExportInventoryUrl()}
            download="tcet_inventory_log.csv"
            className="w-full text-center bg-tcet-navy hover:bg-slate-800 text-white font-bold text-xs py-3 border border-tcet-navy uppercase transition-all shadow-xs flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-tcet-gold" />
            <span>DOWNLOAD INVENTORY CSV</span>
          </a>
        </div>

      </div>

      {/* Automated Overdue Scanner Suite */}
      <div className="bg-white border-2 border-slate-300 p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-red-700" />
            <h3 className="font-extrabold text-sm uppercase text-tcet-navy">
              Automated Email Alert & Overdue Scanner Suite
            </h3>
          </div>
          <span className="text-[10px] font-mono font-bold uppercase bg-red-100 text-red-900 border border-red-300 px-2 py-0.5">
            Daily Midnight Cron Active
          </span>
        </div>

        <div className="bg-red-50 border-2 border-red-200 p-5 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="space-y-1 max-w-xl text-center md:text-left">
            <h4 className="font-extrabold text-sm text-red-950 uppercase">
              Trigger Manual Overdue Scan & Dispatch Email Reminders
            </h4>
            <p className="text-xs text-red-800 leading-relaxed">
              The background cron task scans overdue checkout sessions daily. Triggering it manually performs a live scan across all {activeLoans.length} loans, flags delinquent deadlines, and sends email notifications to students and mentors via Nodemailer transporter.
            </p>
          </div>

          <button
            type="button"
            disabled={scanning}
            onClick={handleRunScan}
            className="w-full md:w-auto shrink-0 bg-red-800 hover:bg-red-700 text-white font-bold text-xs px-6 py-3 uppercase border border-red-950 transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'SCANNING DATABASE...' : 'RUN OVERDUE SCAN NOW'}</span>
          </button>
        </div>

        {/* Scan Results Feedback */}
        {scanResult && (
          <div className="bg-slate-50 border border-slate-300 p-4 font-mono text-xs text-slate-800 space-y-1 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-tcet-navy">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>OVERDUE SCAN EXECUTION REPORT:</span>
            </div>
            <p className="pl-6">• Total active records evaluated: {activeLoans.length}</p>
            <p className="pl-6">• Overdue sessions identified: <strong className="text-red-600">{scanResult.overdueFound}</strong></p>
            <p className="pl-6">• Loans expiring within 24 hours: <strong className="text-amber-600">{scanResult.dueSoonFound}</strong></p>
            <p className="pl-6">• Automated alert emails queued to student & faculty mentors.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default UtilitiesView;
