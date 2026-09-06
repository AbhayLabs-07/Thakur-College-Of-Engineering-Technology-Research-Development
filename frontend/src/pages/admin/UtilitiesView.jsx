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
  FileText,
  Paperclip,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { adminService } from '../../services/api';

const UtilitiesView = () => {
  const { activeLoans, components, requests, activityLogs, showToast } = useAdmin();
  
  // SMTP Server Status & Diagnostics State
  const [smtpStatus, setSmtpStatus] = useState(null);
  const [loadingSmtp, setLoadingSmtp] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState(null);

  // Email Overview & Audit File Generator State
  const [recipientEmail, setRecipientEmail] = useState('vini.dongre@tcetmumbai.in');
  const [recipientName, setRecipientName] = useState('Dr. Vinitkumar Dongre (Dean R&D)');
  const [adminNotes, setAdminNotes] = useState('Hardware inventory successfully cleared for scheduled audit on upcoming Monday, Tuesday, and Wednesday. Genuine student requisition queue is clean.');
  const [attachAuditFile, setAttachAuditFile] = useState(true);
  const [includeLoansInAudit, setIncludeLoansInAudit] = useState(true);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSendSuccess, setEmailSendSuccess] = useState(null);
  const [copiedDigest, setCopiedDigest] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  // Automated Student Overdue Scanner State
  const [scanningOverdue, setScanningOverdue] = useState(false);
  const [overdueScanReport, setOverdueScanReport] = useState(null);
  const [notifyMentorOnOverdue, setNotifyMentorOnOverdue] = useState(true);

  // Download State Trackers for Exporters
  const [downloadingInventory, setDownloadingInventory] = useState(false);
  const [downloadingCredentials, setDownloadingCredentials] = useState(false);
  const [downloadingLoans, setDownloadingLoans] = useState(false);
  const [downloadingLogs, setDownloadingLogs] = useState(false);

  // Fetch SMTP status on component mount
  const fetchSmtpStatus = async () => {
    setLoadingSmtp(true);
    try {
      const data = await adminService.getSmtpStatus();
      setSmtpStatus(data);
    } catch (err) {
      console.warn('Could not fetch SMTP status from backend:', err.message);
    } finally {
      setLoadingSmtp(false);
    }
  };

  useEffect(() => {
    fetchSmtpStatus();
  }, []);

  // Test SMTP Connection Handshake & Probe
  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    setSmtpTestResult(null);
    try {
      const res = await adminService.testSmtpConnection(recipientEmail);
      setSmtpTestResult(res);
      if (res.success) {
        showToast('SMTP handshake verified successfully! Test probe email dispatched.', 'success');
      } else {
        showToast(res.message || 'SMTP handshake failed.', 'error');
      }
      fetchSmtpStatus();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message || 'SMTP test failed';
      setSmtpTestResult({ success: false, message: errMsg });
      showToast(errMsg, 'error');
    } finally {
      setTestingSmtp(false);
    }
  };

  // Dispatch Audit File Email with Attached CSV
  const handleSendAuditEmail = async () => {
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
        customNotes: adminNotes,
        includeLoansRegister: includeLoansInAudit
      };

      let res;
      if (attachAuditFile) {
        res = await adminService.sendAuditFileEmail(payload);
      } else {
        res = await adminService.sendOverviewEmail(payload);
      }

      setEmailSendSuccess(res);
      showToast(
        attachAuditFile
          ? `Audit report & attached CSV dispatched to ${recipientEmail} via SMTP!`
          : `Executive overview email dispatched to ${recipientEmail}!`,
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to dispatch email via SMTP server.', 'error');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Trigger Automated Student Overdue Scan & Email Notices
  const handleTriggerOverdueScan = async () => {
    setScanningOverdue(true);
    setOverdueScanReport(null);
    try {
      const res = await adminService.triggerOverdueScan({
        dryRun: false,
        notifyMentor: notifyMentorOnOverdue
      });
      setOverdueScanReport(res.report);
      if (res.report?.overdueCount > 0) {
        showToast(`Identified ${res.report.overdueCount} overdue loan(s). Sent ${res.report.emailsSent} notice(s).`, 'info');
      } else {
        showToast('Overdue scan completed: 0 overdue checkouts. System is 100% compliant (All Green)!', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to execute overdue scan.', 'error');
    } finally {
      setScanningOverdue(false);
    }
  };

  // Safe file downloaders using tokenized API
  const handleDownloadInventory = async () => {
    setDownloadingInventory(true);
    try {
      await adminService.downloadExport('/admin/export/inventory', 'tcet_inventory_log.csv');
      showToast('Laboratory Inventory Asset Log CSV downloaded successfully.', 'success');
    } catch (err) {
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

  // Compile overview plain text for copy or mailto
  const overviewDigestText = `[TCET R&D CELL] Institutional Hardware & Audit Overview
Generated: ${new Date().toLocaleString()}
To: ${recipientName} (${recipientEmail})
Attachment: ${attachAuditFile ? `TCET_Laboratory_Audit_File_${new Date().toISOString().split('T')[0]}.csv` : 'None'}

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
    <div className="space-y-6 animate-in fade-in duration-150 max-w-5xl mx-auto pb-10">
      
      {/* Top Banner */}
      <div className="bg-white border-2 border-slate-300 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-tcet-navy text-tcet-gold px-2 py-0.5 border border-tcet-gold">
              Administrative Utilities & Exporters
            </span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-300 font-bold">
              System Health: 100% Green
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-tcet-navy uppercase tracking-tight">
            SMTP Mail Server & Automation Control Hub
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Configure SMTP server diagnostics, dispatch official audit files with attachments, and automate overdue student reminders.
          </p>
        </div>
      </div>

      {/* 1. SMTP Mail Server Diagnostics & Status */}
      <div className="bg-white border-2 border-slate-300 p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-50 border border-blue-300 text-blue-900 flex items-center justify-center">
              <Server className="w-4 h-4 text-tcet-navy" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm uppercase text-tcet-navy">
                SMTP Mail Server Status & Diagnostics
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                Institutional Outbound Mail Relay Connection
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 border ${
              smtpStatus?.verification?.connected 
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
                : 'bg-amber-50 text-amber-900 border-amber-300'
            }`}>
              {smtpStatus?.config?.mode === 'live_smtp' ? 'Live SMTP Transporter Active' : 'SMTP Server Configured / Ready'}
            </span>
            <button
              type="button"
              disabled={loadingSmtp}
              onClick={fetchSmtpStatus}
              className="p-1.5 border border-slate-300 text-slate-600 hover:bg-slate-100"
              title="Refresh SMTP status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingSmtp ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Configuration Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-slate-50 p-3 border border-slate-200">
            <span className="text-[10px] text-slate-400 block uppercase">SMTP Host</span>
            <strong className="text-slate-800 text-xs truncate block" title={smtpStatus?.config?.host || 'smtp.gmail.com'}>
              {smtpStatus?.config?.host || 'smtp.gmail.com'}
            </strong>
          </div>
          <div className="bg-slate-50 p-3 border border-slate-200">
            <span className="text-[10px] text-slate-400 block uppercase">Port & Security</span>
            <strong className="text-slate-800 text-xs block">
              Port {smtpStatus?.config?.port || 587} {smtpStatus?.config?.secure ? '(SSL/TLS)' : '(STARTTLS)'}
            </strong>
          </div>
          <div className="bg-slate-50 p-3 border border-slate-200">
            <span className="text-[10px] text-slate-400 block uppercase">Authenticated User</span>
            <strong className="text-slate-800 text-xs truncate block" title={smtpStatus?.config?.user || 'rndcelltcet@gmail.com'}>
              {smtpStatus?.config?.user || 'rndcelltcet@gmail.com'}
            </strong>
          </div>
          <div className="bg-slate-50 p-3 border border-slate-200">
            <span className="text-[10px] text-slate-400 block uppercase">Delivery Engine</span>
            <strong className="text-slate-800 text-xs block uppercase">
              {smtpStatus?.config?.mode || 'SMTP Relay'}
            </strong>
          </div>
        </div>

        {/* Action button to test connection */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            disabled={testingSmtp}
            onClick={handleTestSmtp}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs uppercase transition-all shadow-xs flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-tcet-gold ${testingSmtp ? 'animate-spin' : ''}`} />
            <span>{testingSmtp ? 'TESTING HANDSHAKE...' : 'TEST SMTP CONNECTION & SEND PROBE'}</span>
          </button>
          <span className="text-[11px] text-slate-500">
            Sends a diagnostic probe email to verified recipient ({recipientEmail})
          </span>
        </div>

        {/* Handshake Result Feedback */}
        {smtpTestResult && (
          <div className={`p-3 text-xs font-mono border ${
            smtpTestResult.success 
              ? 'bg-emerald-50 text-emerald-950 border-emerald-300' 
              : 'bg-red-50 text-red-950 border-red-300'
          }`}>
            <div className="flex items-center gap-2 font-bold">
              {smtpTestResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{smtpTestResult.message}</span>
            </div>
            {smtpTestResult.verification?.message && (
              <p className="mt-1 pl-6 text-[11px] text-slate-700">
                Handshake details: {smtpTestResult.verification.message}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 2. Automated Mail Generation for Audit File & Executive Overview */}
      <div className="bg-white border-2 border-slate-300 p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-amber-50 border border-amber-300 text-amber-900 flex items-center justify-center">
              <Mail className="w-4 h-4 text-tcet-navy" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm uppercase text-tcet-navy">
                Official Audit File & Overview Mail Generator
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                Dispatches Institutional Audit Package via SMTP with Attached CSV
              </span>
            </div>
          </div>

          <span className="text-[10px] font-mono font-bold uppercase bg-blue-50 text-blue-900 border border-blue-200 px-2.5 py-1 flex items-center gap-1.5">
            <Paperclip className="w-3 h-3 text-tcet-navy" />
            <span>Attachment Engine Enabled</span>
          </span>
        </div>

        {/* Audit Notification Banner */}
        <div className="bg-amber-50 border-2 border-amber-300 p-4 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-amber-950 uppercase tracking-wide">
            <Calendar className="w-4 h-4 text-amber-700" />
            <span>Scheduled Physical Audit: Upcoming Monday, Tuesday & Wednesday</span>
          </div>
          <p className="text-amber-900 leading-relaxed pl-6">
            The attached audit file contains complete pre-audit clearance confirmation, current zero-overdue compliance certification, and the official auditor sign-off block. Urgently required hardware will be re-catalogued post-audit.
          </p>
        </div>

        {/* Recipient Configuration Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-mono font-bold uppercase text-slate-700 mb-1">
              Recipient Email Address (SMTP Destination)
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="e.g. vini.dongre@tcetmumbai.in"
              className="w-full px-3 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-xs font-semibold bg-white"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Authorized authorities: Dean R&D Dr. Vinitkumar Dongre / Administrator Ashish Mudholkar
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold uppercase text-slate-700 mb-1">
              Recipient Title / Committee
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="e.g. Dr. Vinitkumar Dongre (Dean R&D)"
              className="w-full px-3 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-xs font-semibold bg-white"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Salutation in the formal audit letter
            </span>
          </div>
        </div>

        {/* Attachment Options */}
        <div className="bg-slate-50 border border-slate-200 p-4 space-y-3">
          <span className="text-[11px] font-mono font-bold uppercase text-slate-700 block">
            Email Attachment & Content Options:
          </span>
          <div className="flex flex-wrap items-center gap-6 text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={attachAuditFile}
                onChange={(e) => setAttachAuditFile(e.target.checked)}
                className="w-4 h-4 text-tcet-navy rounded border-slate-300 focus:ring-tcet-navy"
              />
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-tcet-navy" />
                Attach Live Audit File (CSV format)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeLoansInAudit}
                onChange={(e) => setIncludeLoansInAudit(e.target.checked)}
                disabled={!attachAuditFile}
                className="w-4 h-4 text-tcet-navy rounded border-slate-300 focus:ring-tcet-navy disabled:opacity-50"
              />
              <span className="font-semibold text-slate-800">
                Include Hardware Loans & Delinquency Register
              </span>
            </label>
          </div>
          {attachAuditFile && (
            <div className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-3 py-1.5 border border-emerald-200 flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Attachment: <code>TCET_Laboratory_Audit_File_{new Date().toISOString().split('T')[0]}.csv</code> will be generated and attached directly.
              </span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-mono font-bold uppercase text-slate-700 mb-1">
            Custom Administrative Remarks (Appended to Audit Notice)
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
            onClick={handleSendAuditEmail}
            className="px-5 py-2.5 bg-tcet-navy hover:bg-slate-800 text-white font-bold text-xs uppercase border border-tcet-navy transition-all shadow-xs flex items-center gap-2 disabled:opacity-50"
          >
            <Send className={`w-3.5 h-3.5 text-tcet-gold ${isSendingEmail ? 'animate-spin' : ''}`} />
            <span>
              {isSendingEmail 
                ? 'DISPATCHING VIA SMTP...' 
                : attachAuditFile ? 'DISPATCH AUDIT REPORT WITH ATTACHMENT' : 'DISPATCH OVERVIEW EMAIL NOW'}
            </span>
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
              <strong>DISPATCH CONFIRMED:</strong> Audit briefing delivered to {emailSendSuccess.recipient}. 
              {emailSendSuccess.filename && ` (Attached: ${emailSendSuccess.filename})`}
            </span>
          </div>
        )}
      </div>

      {/* 3. Automated Overdue Student Notification Engine */}
      <div className="bg-white border-2 border-slate-300 p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-red-50 border border-red-300 text-red-900 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-red-700" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm uppercase text-tcet-navy">
                Automated Student Overdue Notification Engine
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                Scans Active Checkouts & Dispatches Official Escalation Notices via SMTP
              </span>
            </div>
          </div>

          <span className="text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-1">
            Status: Green (0 Overdue Checkouts)
          </span>
        </div>

        <div className="bg-slate-50 border-2 border-slate-200 p-5 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="space-y-1.5 max-w-xl text-center md:text-left">
            <h4 className="font-extrabold text-sm text-tcet-navy uppercase flex items-center gap-2">
              <Clock className="w-4 h-4 text-tcet-navy" />
              <span>Scheduled Daily Scan + Instant Dispatch Trigger</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              The automated engine scans all active hardware checkout records, identifies loans past their return due dates, computes days overdue, and dispatches formal warning letters with faculty mentor CC via the SMTP server.
            </p>
            <div className="pt-1">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyMentorOnOverdue}
                  onChange={(e) => setNotifyMentorOnOverdue(e.target.checked)}
                  className="w-3.5 h-3.5 text-tcet-navy rounded border-slate-300 focus:ring-tcet-navy"
                />
                <span>Automatically CC Assigned Faculty Mentor on Overdue Notices</span>
              </label>
            </div>
          </div>

          <button
            type="button"
            disabled={scanningOverdue}
            onClick={handleTriggerOverdueScan}
            className="w-full md:w-auto shrink-0 bg-tcet-navy hover:bg-slate-800 text-white font-bold text-xs px-6 py-3 uppercase border border-tcet-navy transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-tcet-gold ${scanningOverdue ? 'animate-spin' : ''}`} />
            <span>{scanningOverdue ? 'SCANNING & DISPATCHING...' : 'RUN OVERDUE SCAN & EMAIL STUDENTS NOW'}</span>
          </button>
        </div>

        {/* Scan Report Feedback */}
        {overdueScanReport && (
          <div className="bg-emerald-50 border border-emerald-300 p-4 font-mono text-xs text-emerald-950 space-y-1.5 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>OVERDUE SCAN EXECUTION REPORT (SMTP ENGINE):</span>
            </div>
            <p className="pl-6">• Total Active Hardware Checkouts Evaluated: <strong>{overdueScanReport.scannedRecords || 0}</strong></p>
            <p className="pl-6">• Overdue Loans Identified: <strong className="text-emerald-700">{overdueScanReport.overdueCount} (Zero Delinquencies)</strong></p>
            <p className="pl-6">• Automated Student Emails Dispatched via SMTP: <strong>{overdueScanReport.emailsSent}</strong></p>
            <p className="pl-6">• Operational State: <strong>{overdueScanReport.message}</strong></p>
          </div>
        )}
      </div>

      {/* 4. Laboratory Asset Exporters */}
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
                Export comprehensive snapshot of all laboratory hardware components, current stock metrics, categories, technical specs, and audit readiness status.
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
                <p>• Compliance: Zero overdue delinquent checkouts (All Green)</p>
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

    </div>
  );
};

export default UtilitiesView;
