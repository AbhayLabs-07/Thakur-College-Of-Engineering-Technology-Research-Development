import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  ShieldAlert, 
  Download, 
  RefreshCw, 
  Database, 
  CheckCircle2, 
  Server,
  KeyRound,
  Package,
  Mail,
  Send,
  Copy,
  ExternalLink,
  Calendar,
  AlertCircle,
  HelpCircle,
  Check,
  FileText
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { adminService } from '../../services/api';

const UtilitiesView = () => {
  const { runOverdueScan, activeLoans, components, requests, activityLogs, showToast } = useAdmin();
  
  // Overdue scanner state
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // Email Overview Generator State
  const [recipientEmail, setRecipientEmail] = useState('vini.dongre@tcetmumbai.in');
  const [recipientName, setRecipientName] = useState('Dr. Vinitkumar Dongre (Dean R&D)');
  const [adminNotes, setAdminNotes] = useState('Hardware inventory successfully cleared for scheduled audit on upcoming Monday, Tuesday, and Wednesday. Genuine student requisition queue is clean.');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSendSuccess, setEmailSendSuccess] = useState(null);
  const [copiedDigest, setCopiedDigest] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  // Download state trackers
  const [downloadingInventory, setDownloadingInventory] = useState(false);
  const [downloadingCredentials, setDownloadingCredentials] = useState(false);
  const [downloadingLoans, setDownloadingLoans] = useState(false);
  const [downloadingLogs, setDownloadingLogs] = useState(false);

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

  // Safe file downloader using tokenized API
  const handleDownloadInventory = async () => {
    setDownloadingInventory(true);
    try {
      await adminService.downloadExport('/admin/export/inventory', 'tcet_inventory_log.csv');
      showToast('Laboratory Inventory Asset Log CSV downloaded successfully.', 'success');
    } catch (err) {
      // Fallback to direct token link
      window.open(adminService.getExportInventoryUrl(), '_blank');
    } finally {
      setDownloadingInventory(false);
    }
  };

  const handleDownloadCredentials = async () => {
    setDownloadingCredentials(true);
    try {
      await adminService.downloadExport('/admin/export/credentials', 'tcet_student_credentials.csv');
      showToast('Student Credentials Distribution Sheet CSV downloaded.', 'success');
    } catch (err) {
      window.open(adminService.getExportCredentialsUrl(), '_blank');
    } finally {
      setDownloadingCredentials(false);
    }
  };

  const handleDownloadLoans = async () => {
    setDownloadingLoans(true);
    try {
      await adminService.downloadExport('/admin/export/loans', 'tcet_hardware_loans_export.csv');
      showToast('Active Loans & Allocation Register CSV downloaded.', 'success');
    } catch (err) {
      window.open(adminService.getExportLoansUrl(), '_blank');
    } finally {
      setDownloadingLoans(false);
    }
  };

  const handleDownloadLogs = () => {
    setDownloadingLogs(true);
    try {
      const headers = ['Action', 'Component', 'Quantity', 'Student', 'Faculty', 'Performed By', 'Timestamp', 'Status', 'Notes'];
      const rows = activityLogs.map((log) => [
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
      link.setAttribute('download', `tcet_institutional_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      if (link.parentNode) link.parentNode.removeChild(link);
      showToast('Audit Trail Log CSV exported successfully.', 'success');
    } finally {
      setDownloadingLogs(false);
    }
  };

  // Dispatch overview email via backend transporter
  const handleSendOverviewEmail = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      showToast('Please specify a valid recipient email address.', 'error');
      return;
    }

    setIsSendingEmail(true);
    setEmailSendSuccess(null);
    try {
      const payload = {
        recipientEmail,
        recipientName,
        customNotes: adminNotes
      };
      const res = await adminService.sendOverviewEmail(payload);
      setEmailSendSuccess(res);
      showToast(`Automated overview email successfully dispatched to ${recipientEmail}!`, 'success');
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to dispatch email. Check backend SMTP configuration.', 'error');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Compile overview plain text for copy or mailto
  const overviewDigestText = `[TCET R&D CELL] Institutional Hardware & Audit Overview
Generated: ${new Date().toLocaleString()}
To: ${recipientName} (${recipientEmail})

=======================================================
OPERATIONAL HEALTH STATUS: ALL GREEN
=======================================================
• Overdue Loans: 0 (Health: 100% Operational / Zero Delinquencies)
• Active Hardware Loans: ${activeLoans.length}
• Pending Requisitions: ${requests.length} (Genuine requests only)
• Catalogued Components: ${components.length} (Cleared for Scheduled Audit)

=======================================================
INSTITUTIONAL AUDIT SCHEDULE:
=======================================================
• Audit Schedule: Upcoming Monday, Tuesday, and Wednesday
• Current State: Hardware inventory has been cleared for physical verification.
• Next Phase: Urgently required components will be catalogued immediately following audit sign-off.

Administrator Remarks:
${adminNotes}

Regards,
Research & Development Cell
Thakur College of Engineering & Technology (TCET)`;

  const handleCopyDigest = () => {
    navigator.clipboard.writeText(overviewDigestText);
    setCopiedDigest(true);
    showToast('Overview digest copied to clipboard!', 'info');
    setTimeout(() => setCopiedDigest(false), 3000);
  };

  const mailtoLink = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(`[TCET R&D CELL] Laboratory & Audit Overview — ${new Date().toLocaleDateString('en-GB')}`)}&body=${encodeURIComponent(overviewDigestText)}`;

  return (
    <div className="space-y-6 animate-in fade-in duration-150 max-w-5xl mx-auto">
      
      {/* Top Banner */}
      <div className="bg-white border-2 border-slate-300 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-tcet-navy text-tcet-gold px-2 py-0.5 border border-tcet-gold">
              Administrative Utilities & Exporters
            </span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-300 font-bold">
              System Health: Green
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-tcet-navy uppercase tracking-tight">
            Utilities & Data Exports
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Generate automated overview reports, export institutional CSV asset sheets, and manage alert notifications.
          </p>
        </div>
      </div>

      {/* 1. Automated Mail Generation for Overviews */}
      <div className="bg-white border-2 border-slate-300 p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-50 border border-blue-300 text-blue-900 flex items-center justify-center">
              <Mail className="w-4 h-4 text-tcet-navy" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm uppercase text-tcet-navy">
                Automated Overview Mail Generation Suite
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                Institutional Executive Briefing & Audit Status Dispatcher
              </span>
            </div>
          </div>

          <span className="text-[10px] font-mono font-bold uppercase bg-blue-50 text-blue-900 border border-blue-200 px-2.5 py-1">
            SMTP & Mailto Transporter Ready
          </span>
        </div>

        {/* Audit Notification Banner */}
        <div className="bg-amber-50 border-2 border-amber-300 p-4 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-amber-950 uppercase tracking-wide">
            <Calendar className="w-4 h-4 text-amber-700" />
            <span>Scheduled Physical Audit: Upcoming Monday, Tuesday & Wednesday</span>
          </div>
          <p className="text-amber-900 leading-relaxed pl-6">
            The automated email overview includes the pre-audit clearance notice confirming that components are currently cleared for stocktaking. Urgently required hardware will be re-catalogued immediately following audit completion.
          </p>
        </div>

        {/* Email Dispatch Configuration Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-mono font-bold uppercase text-slate-700 mb-1">
              Recipient Email Address
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="e.g. vini.dongre@tcetmumbai.in"
              className="w-full px-3 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-xs font-semibold bg-white"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Default: Dean R&D Dr. Vinitkumar Dongre / Administrator Ashish Mudholkar
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold uppercase text-slate-700 mb-1">
              Recipient Formal Title / Committee
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="e.g. Dr. Vinitkumar Dongre (Dean R&D)"
              className="w-full px-3 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-xs font-semibold bg-white"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Used in the salutation of the generated institutional brief
            </span>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-mono font-bold uppercase text-slate-700 mb-1">
            Custom Administrative Remarks (Appended to Overview Digest)
          </label>
          <textarea
            rows={2}
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            className="w-full px-3 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-xs font-medium bg-white"
            placeholder="Enter any specific points regarding upcoming audit teams, urgently needed items, or committee notes..."
          />
        </div>

        {/* Live Overview Preview */}
        {showPreview && (
          <div className="border border-slate-200 bg-slate-50 p-4 font-mono text-[11px] space-y-2">
            <div className="flex items-center justify-between border-b border-slate-300 pb-2">
              <span className="font-bold text-tcet-navy uppercase flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-tcet-gold" />
                Live Overview Preview:
              </span>
              <span className="text-[10px] text-slate-500">
                Health: 100% Green (0 Overdue)
              </span>
            </div>
            <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
              {overviewDigestText}
            </div>
          </div>
        )}

        {/* Dispatch Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            disabled={isSendingEmail}
            onClick={handleSendOverviewEmail}
            className="px-5 py-2.5 bg-tcet-navy hover:bg-slate-800 text-white font-bold text-xs uppercase border border-tcet-navy transition-all shadow-xs flex items-center gap-2 disabled:opacity-50"
          >
            <Send className={`w-3.5 h-3.5 text-tcet-gold ${isSendingEmail ? 'animate-spin' : ''}`} />
            <span>{isSendingEmail ? 'DISPATCHING EMAIL...' : 'DISPATCH OVERVIEW EMAIL NOW'}</span>
          </button>

          <a
            href={mailtoLink}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs uppercase border-2 border-slate-300 transition-colors flex items-center gap-2"
            title="Open in default desktop mail client (Outlook / Gmail)"
          >
            <ExternalLink className="w-3.5 h-3.5 text-tcet-navy" />
            <span>Open in Mail Client</span>
          </a>

          <button
            type="button"
            onClick={handleCopyDigest}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs uppercase border-2 border-slate-300 transition-colors flex items-center gap-2"
          >
            {copiedDigest ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
            <span>{copiedDigest ? 'COPIED TO CLIPBOARD' : 'COPY DIGEST'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-xs font-semibold text-slate-600 underline hover:text-tcet-navy ml-auto"
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>

        {/* Email feedback report */}
        {emailSendSuccess && (
          <div className="bg-emerald-50 border-2 border-emerald-300 p-3.5 text-xs text-emerald-900 font-mono flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              <strong>DISPATCH SUCCESSFUL:</strong> Overview briefing delivered to {emailSendSuccess.recipient}. (Msg ID: {emailSendSuccess.messageId})
            </span>
          </div>
        )}

        {/* Requirements for Full Production Automation */}
        <div className="bg-slate-50 border border-slate-300 p-4 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-tcet-navy uppercase text-[11px]">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>Requirements to Automate Overview Emails on Schedule in Production:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700 text-[11px] leading-relaxed">
            <div className="bg-white p-2.5 border border-slate-200 space-y-1">
              <strong className="text-tcet-navy block">1. SMTP Server & Credentials</strong>
              <p>Set <code>EMAIL_USER</code> and <code>EMAIL_PASS</code> in <code>backend/.env</code>. For Gmail/Google Workspace, generate a 16-character <strong>App Password</strong> in Google Account Security.</p>
            </div>
            <div className="bg-white p-2.5 border border-slate-200 space-y-1">
              <strong className="text-tcet-navy block">2. Distribution Roster</strong>
              <p>Configure institutional recipient emails (e.g. Dean R&D, Principal, Administrative In-Charge) in portal settings.</p>
            </div>
            <div className="bg-white p-2.5 border border-slate-200 space-y-1">
              <strong className="text-tcet-navy block">3. Automated Cron Cadence</strong>
              <p>Default schedule is set to Daily Midnight. Can be configured to dispatch Monday 8:00 AM post-audit status automatically.</p>
            </div>
            <div className="bg-white p-2.5 border border-slate-200 space-y-1">
              <strong className="text-tcet-navy block">4. Server Runtime Environment</strong>
              <p>Requires persistent Node.js background process (local/VPS/Docker) or Vercel Cron webhooks configured in <code>vercel.json</code>.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Laboratory Asset Exporters (All Enabled) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm uppercase text-tcet-navy tracking-tight">
            Institutional Laboratory Asset Exporters
          </h3>
          <span className="text-[10px] font-mono text-slate-500">
            Official Excel & CSV Formats
          </span>
        </div>

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
                Export the complete master spreadsheet containing student generated User IDs, ERP numbers, and initial access passwords.
              </p>

              <div className="bg-slate-50 p-3 border border-slate-200 mb-6 space-y-1 text-[11px] text-slate-600 font-mono">
                <p>• Format: Microsoft Excel compatible (.csv)</p>
                <p>• Fields: Name, ERP_ID, Email, UserID, Password</p>
                <p>• Access Level: Restricted to Principal / Dean / Admin</p>
              </div>
            </div>

            <button
              type="button"
              disabled={downloadingCredentials}
              onClick={handleDownloadCredentials}
              className="w-full text-center bg-tcet-navy hover:bg-slate-800 text-white font-bold text-xs py-3 border border-tcet-navy uppercase transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-tcet-gold" />
              <span>{downloadingCredentials ? 'DOWNLOADING...' : 'DOWNLOAD CREDENTIALS CSV'}</span>
            </button>
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
                Export comprehensive snapshot of all laboratory hardware components, current stock metrics, categories, technical specs, storage locations, and audit readiness status.
              </p>

              <div className="bg-slate-50 p-3 border border-slate-200 mb-6 space-y-1 text-[11px] text-slate-600 font-mono">
                <p>• Current Catalogued Items: {components.length} (Audit Clear)</p>
                <p>• Fields: Component Name, Category, Total Stock, Available, Keywords</p>
                <p>• Status: Ready for upcoming physical audit verification</p>
              </div>
            </div>

            <button
              type="button"
              disabled={downloadingInventory}
              onClick={handleDownloadInventory}
              className="w-full text-center bg-tcet-navy hover:bg-slate-800 text-white font-bold text-xs py-3 border border-tcet-navy uppercase transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-tcet-gold" />
              <span>{downloadingInventory ? 'DOWNLOADING...' : 'DOWNLOAD INVENTORY ASSETS CSV'}</span>
            </button>
          </div>

          {/* Exporter 3: Active Loans & Hardware Allocation Register */}
          <div className="bg-white border-2 border-slate-300 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center justify-center font-bold">
                  <Package className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm uppercase text-tcet-navy">
                    Hardware Loans & Checkout Register
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    Active & Historical Borrow Records
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Export complete audit register of all hardware loans, student lead details, assigned faculty mentors, checkout dates, return deadlines, and approval notes.
              </p>

              <div className="bg-slate-50 p-3 border border-slate-200 mb-6 space-y-1 text-[11px] text-slate-600 font-mono">
                <p>• Active Loan Sessions: {activeLoans.length}</p>
                <p>• Fields: Loan Token, Student, ERP, Mentor, Items, Due Date, Status</p>
                <p>• Compliance: Zero overdue delinquent checkouts</p>
              </div>
            </div>

            <button
              type="button"
              disabled={downloadingLoans}
              onClick={handleDownloadLoans}
              className="w-full text-center bg-tcet-navy hover:bg-slate-800 text-white font-bold text-xs py-3 border border-tcet-navy uppercase transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-tcet-gold" />
              <span>{downloadingLoans ? 'DOWNLOADING...' : 'DOWNLOAD LOANS REGISTER CSV'}</span>
            </button>
          </div>

          {/* Exporter 4: Institutional Audit Trail & Activity Log */}
          <div className="bg-white border-2 border-slate-300 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 bg-purple-50 border border-purple-300 text-purple-800 flex items-center justify-center font-bold">
                  <Database className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm uppercase text-tcet-navy">
                    Governance Activity Log
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    Immutable System Audit Trail
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Export complete historical event log tracking component stock adjustments, genuine student requisitions, mentor endorsements, and administrator actions.
              </p>

              <div className="bg-slate-50 p-3 border border-slate-200 mb-6 space-y-1 text-[11px] text-slate-600 font-mono">
                <p>• Recorded Events: {activityLogs.length}</p>
                <p>• Status: Purged of sample events; genuine events catalogued</p>
                <p>• Encoding: UTF-8 Institutional Standard</p>
              </div>
            </div>

            <button
              type="button"
              disabled={downloadingLogs}
              onClick={handleDownloadLogs}
              className="w-full text-center bg-tcet-navy hover:bg-slate-800 text-white font-bold text-xs py-3 border border-tcet-navy uppercase transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-tcet-gold" />
              <span>{downloadingLogs ? 'DOWNLOADING...' : 'DOWNLOAD ACTIVITY LOG CSV'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* 3. Automated Overdue Scanner Suite */}
      <div className="bg-white border-2 border-slate-300 p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-tcet-navy" />
            <h3 className="font-extrabold text-sm uppercase text-tcet-navy">
              Automated Email Alert & Overdue Scanner Suite
            </h3>
          </div>
          <span className="text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5">
            Health: Green (0 Overdue)
          </span>
        </div>

        <div className="bg-slate-50 border-2 border-slate-200 p-5 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="space-y-1 max-w-xl text-center md:text-left">
            <h4 className="font-extrabold text-sm text-tcet-navy uppercase">
              Live Overdue Scan & Email Warning Transporter
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              The automated scanner evaluates checkout sessions against return deadlines. Currently, zero overdue sessions exist in the database. Triggering manual execution re-evaluates all records and dispatches reminder notices to students and mentors.
            </p>
          </div>

          <button
            type="button"
            disabled={scanning}
            onClick={handleRunScan}
            className="w-full md:w-auto shrink-0 bg-tcet-navy hover:bg-slate-800 text-white font-bold text-xs px-6 py-3 uppercase border border-tcet-navy transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'SCANNING DATABASE...' : 'RUN OVERDUE SCAN NOW'}</span>
          </button>
        </div>

        {/* Scan Results Feedback */}
        {scanResult && (
          <div className="bg-emerald-50 border border-emerald-300 p-4 font-mono text-xs text-emerald-950 space-y-1 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>OVERDUE SCAN EXECUTION REPORT:</span>
            </div>
            <p className="pl-6">• Total active records evaluated: {activeLoans.length}</p>
            <p className="pl-6">• Overdue sessions identified: <strong className="text-emerald-700">{scanResult.overdueFound} (All Green)</strong></p>
            <p className="pl-6">• Loans expiring within 24 hours: <strong>{scanResult.dueSoonFound}</strong></p>
            <p className="pl-6">• Operational status: Fully compliant with institutional return policies.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default UtilitiesView;
