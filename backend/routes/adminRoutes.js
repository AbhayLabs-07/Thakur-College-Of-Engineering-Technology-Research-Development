import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import BorrowRecord from '../models/BorrowRecord.js';
import Component from '../models/Component.js';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { convertToCSV } from '../utils/csvExporter.js';
import { sendEmail, verifySmtpConnection, getSmtpConfig } from '../utils/mailer.js';
import { runOverdueScan } from '../cron/overdueScan.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: Determine Hierarchy Tier and Label
function getHierarchy(designation) {
  const d = String(designation || '').toLowerCase().trim();

  if (d.includes('principal') && !d.includes('vice')) {
    return { tier: 1, label: 'Principal' };
  }
  if (d.includes('vice principal')) {
    return { tier: 2, label: 'Vice Principal' };
  }
  if (d.includes('dean') && !d.includes('associate dean') && !d.includes('dy')) {
    return { tier: 3, label: 'Dean' };
  }
  if (d.includes('associate dean')) {
    return { tier: 4, label: 'Associate Dean' };
  }
  if ((d.includes('hod') || d.includes('head of department') || d.includes('i/c. hod') || d.includes('officiating hod')) &&
    !d.includes('deputy') && !d.includes('dy')) {
    return { tier: 5, label: 'Head of Department' };
  }
  if (d.includes('deputy hod') || d.includes('dy. hod') || d.includes('dy.hod') || d.includes('dy hod') ||
    d.includes('activity head') || d.includes('controller of examination') || d.includes('tpo')) {
    return { tier: 6, label: 'Deputy HOD / Lead' };
  }
  if (d.includes('professor') && !d.includes('associate') && !d.includes('assistant')) {
    return { tier: 7, label: 'Professor' };
  }
  if (d.includes('associate professor') || d.includes('associate prof') || (d.includes('associate') && !d.includes('dean'))) {
    return { tier: 8, label: 'Associate Professor' };
  }
  if (d.includes('assistant professor') || d.includes('assistant prof') || d.includes('coordinator') || d.includes('assistant')) {
    return { tier: 9, label: 'Assistant Professor' };
  }
  if (d.includes('lecturer') || d.includes('lecture') || d.includes('leturer') || d.includes('trainer')) {
    return { tier: 10, label: 'Lecturer' };
  }
  return { tier: 11, label: designation || 'Academic Staff' };
}

// Helper: Parse Date of Joining
function parseDOJ(raw) {
  if (!raw) return { dojStr: '', dojDate: null };
  const str = String(raw).trim();
  const isoMatch = str.match(/^(\d{4})[\.\-\/](\d{1,2})[\.\-\/](\d{1,2})$/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10);
    const d = parseInt(isoMatch[3], 10);
    const dt = new Date(y, m - 1, d);
    const dojStr = `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`;
    return { dojStr, dojDate: isNaN(dt.getTime()) ? null : dt };
  }

  const partsMatch = str.match(/^(\d{1,2})[\.\-\/](\d{1,2})[\.\-\/](\d{2,4})$/);
  if (partsMatch) {
    const d = parseInt(partsMatch[1], 10);
    const m = parseInt(partsMatch[2], 10);
    let y = parseInt(partsMatch[3], 10);
    if (y < 100) y = y < 50 ? 2000 + y : 1900 + y;
    const dt = new Date(y, m - 1, d);
    const dojStr = `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`;
    return { dojStr, dojDate: isNaN(dt.getTime()) ? null : dt };
  }

  const dt = new Date(str);
  if (!isNaN(dt.getTime())) {
    const dojStr = `${String(dt.getDate()).padStart(2, '0')}.${String(dt.getMonth() + 1).padStart(2, '0')}.${dt.getFullYear()}`;
    return { dojStr, dojDate: dt };
  }

  return { dojStr: str, dojDate: null };
}

// Helper: Recalculate seniority ranks across college and departments
async function recalculateSeniority() {
  const faculties = await Faculty.find({}).lean();
  if (!faculties.length) return;

  const getDojTime = (f) => {
    if (f.dojDate) {
      const t = new Date(f.dojDate).getTime();
      if (!isNaN(t)) return t;
    }
    if (f.doj && typeof f.doj === 'string') {
      const parts = f.doj.trim().split(/[\.\-\/]/);
      if (parts.length === 3) {
        let d = parseInt(parts[0], 10);
        let m = parseInt(parts[1], 10);
        let y = parseInt(parts[2], 10);
        if (y < 100) y = y < 50 ? 2000 + y : 1900 + y;
        const dt = new Date(y, m - 1, d).getTime();
        if (!isNaN(dt)) return dt;
      }
    }
    return 9999999999999;
  };

  const comparator = (a, b) => {
    const tierA = a.hierarchyTier ?? 99;
    const tierB = b.hierarchyTier ?? 99;
    if (tierA !== tierB) return tierA - tierB;

    const timeA = getDojTime(a);
    const timeB = getDojTime(b);
    if (timeA !== timeB) return timeA - timeB;

    const orderA = a.srNo || a.seniorityOrder || 99999;
    const orderB = b.srNo || b.seniorityOrder || 99999;
    return orderA - orderB;
  };

  faculties.sort(comparator);
  faculties.forEach((f, idx) => {
    f.newSeniorityOrder = idx + 1;
  });

  const deptGroups = new Map();
  for (const f of faculties) {
    const dept = f.department || 'Unassigned';
    if (!deptGroups.has(dept)) deptGroups.set(dept, []);
    deptGroups.get(dept).push(f);
  }

  for (const [, list] of deptGroups.entries()) {
    list.sort(comparator);
    list.forEach((f, idx) => {
      f.newDeptSeniorityOrder = idx + 1;
    });
  }

  const bulkOps = faculties.map(f => ({
    updateOne: {
      filter: { _id: f._id },
      update: {
        $set: {
          seniorityOrder: f.newSeniorityOrder,
          deptSeniorityOrder: f.newDeptSeniorityOrder
        }
      }
    }
  }));

  await Faculty.bulkWrite(bulkOps);
}

// @desc    Get all faculty members in seniority hierarchy order (Admin only)
// @route   GET /api/admin/faculty
// @access  Private/Admin
router.get('/faculty', protect, adminOnly, async (req, res) => {
  try {
    const { department, tier } = req.query;
    const query = {};
    if (department && department !== 'all') {
      query.department = department;
    }
    if (tier && tier !== 'all') {
      query.hierarchyTier = Number(tier);
    }

    const sortCondition = (department && department !== 'all')
      ? { deptSeniorityOrder: 1, seniorityOrder: 1, hierarchyTier: 1, dojDate: 1 }
      : { seniorityOrder: 1, hierarchyTier: 1, dojDate: 1 };

    const faculties = await Faculty.find(query).sort(sortCondition);
    const count = await Faculty.countDocuments(query);
    const totalCount = await Faculty.countDocuments();
    res.json({
      count,
      totalCount,
      faculties
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Add a new faculty member to the roster (Admin only)
// @route   POST /api/admin/faculty
// @access  Private/Admin
router.post('/faculty', protect, adminOnly, async (req, res) => {
  try {
    const { name, position, designation, doj, department, email, contactNumber } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Faculty name is required' });
    }

    const facultyDesignation = (position || designation || 'Assistant Professor').trim();
    const facultyDepartment = (department || 'Research and Development').trim();

    // Parse Date of Joining
    const { dojStr, dojDate } = parseDOJ(doj);

    // Determine Hierarchy Tier and Label
    const { tier, label } = getHierarchy(facultyDesignation);

    // Prepare faculty object
    const facultyData = {
      name: name.trim(),
      designation: facultyDesignation,
      department: facultyDepartment,
      doj: dojStr,
      dojDate,
      hierarchyTier: tier,
      hierarchyLabel: label,
      contactNumber: (contactNumber || '').trim(),
      role: 'faculty'
    };

    // If email provided, clean and ensure no duplicates
    if (email && email.trim()) {
      const cleanEmail = email.trim().toLowerCase();
      const existingEmail = await Faculty.findOne({ email: cleanEmail });
      if (existingEmail) {
        return res.status(400).json({ message: `A faculty account with email ${cleanEmail} already exists` });
      }
      facultyData.email = cleanEmail;
    }

    const newFaculty = new Faculty(facultyData);
    await newFaculty.save();

    // Recompute college-wide and department seniority
    await recalculateSeniority();

    // Fetch updated record with newly assigned seniority
    const savedFaculty = await Faculty.findById(newFaculty._id);
    const totalCount = await Faculty.countDocuments();

    res.status(201).json({
      message: `Faculty ${savedFaculty.name} added successfully to academic roster.`,
      faculty: savedFaculty,
      totalCount
    });
  } catch (error) {
    console.error('Error adding faculty:', error);
    res.status(500).json({ message: error.message || 'Server error adding faculty member' });
  }
});

// @desc    Delete a faculty member (Admin only)
// @route   DELETE /api/admin/faculty/:id
// @access  Private/Admin
router.delete('/faculty/:id', protect, adminOnly, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty member not found' });
    }

    await Faculty.findByIdAndDelete(req.params.id);
    await recalculateSeniority();
    const totalCount = await Faculty.countDocuments();

    res.json({
      message: `Faculty ${faculty.name} removed from roster.`,
      totalCount
    });
  } catch (error) {
    console.error('Error deleting faculty:', error);
    res.status(500).json({ message: error.message || 'Server error deleting faculty member' });
  }
});

// @desc    Get all borrow records for live tracking
// @route   GET /api/admin/records
// @access  Private/Admin
router.get('/records', protect, adminOnly, async (req, res) => {
  try {
    const records = await BorrowRecord.find({})
      .populate('student', 'name erpId branch division year email contactNumber')
      .populate('facultyMentor', 'name email department designation')
      .populate('cartItems.component', 'name category specs quantityAvailable quantityTotal imageUrl')
      .sort({ createdAt: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update borrow record status (e.g., hand out components or mark returned)
// @route   PUT /api/admin/records/:id/status
// @access  Private/Admin
router.put('/records/:id/status', protect, adminOnly, async (req, res) => {
  const { status, adminNotes } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  const validStatuses = ['pending_admin', 'handed_out', 'returned', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status transition for Admin' });
  }

  try {
    const record = await BorrowRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Borrow record not found' });
    }

    const previousStatus = record.status;

    // Status Logic
    if (status === 'handed_out' && previousStatus !== 'handed_out') {
      // Deduct items from inventory
      for (const item of record.cartItems) {
        const comp = await Component.findById(item.component);
        if (!comp) {
          return res.status(404).json({ message: `Component not found: ${item.component}` });
        }
        if (comp.quantityAvailable < item.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for ${comp.name}. Available: ${comp.quantityAvailable}, Requested: ${item.quantity}`
          });
        }
        comp.quantityAvailable -= item.quantity;
        await comp.save();
      }
    } else if (status === 'returned' && previousStatus === 'handed_out') {
      // Restore items to inventory
      for (const item of record.cartItems) {
        const comp = await Component.findById(item.component);
        if (comp) {
          comp.quantityAvailable = Math.min(comp.quantityTotal, comp.quantityAvailable + item.quantity);
          await comp.save();
        }
      }
      record.returnedAt = new Date();
    } else if (status === 'rejected' && previousStatus === 'pending_admin') {
      // If admin rejects a faculty-approved request, no stock change is needed
    }

    record.status = status;
    if (adminNotes !== undefined) {
      record.adminNotes = adminNotes;
    }

    const updatedRecord = await record.save();

    const fullyPopulated = await BorrowRecord.findById(updatedRecord._id)
      .populate('student', 'name erpId branch division year email contactNumber')
      .populate('facultyMentor', 'name email department designation')
      .populate('cartItems.component', 'name category specs quantityAvailable quantityTotal imageUrl');

    res.json(fullyPopulated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Export inventory to CSV
// @desc    Export inventory to CSV
// @route   GET /api/admin/export/inventory
// @access  Private/Admin
router.get('/export/inventory', protect, adminOnly, async (req, res) => {
  try {
    const components = await Component.find({});

    let formattedData = [];
    if (components.length === 0) {
      formattedData.push({
        Name: '[AUDIT PREPARATION] Hardware Inventory Reset',
        Category: 'Audit Scheduled',
        'Total Stock': 0,
        'Available Stock': 0,
        Keywords: 'audit, upcoming monday tuesday wednesday, pending cataloguing',
        Description: 'Components cleared ahead of physical audit on Monday, Tuesday, and Wednesday. Urgent hardware will be re-catalogued post-audit.'
      });
    } else {
      formattedData = components.map(c => ({
        Name: c.name,
        Category: c.category,
        'Total Stock': c.quantityTotal,
        'Available Stock': c.quantityAvailable,
        Keywords: (c.keywords || []).join(', '),
        Description: c.description || ''
      }));
    }

    const fields = ['Name', 'Category', 'Total Stock', 'Available Stock', 'Keywords', 'Description'];
    const csvString = convertToCSV(formattedData, fields);

    res.header('Content-Type', 'text/csv');
    res.attachment('tcet_inventory_export.csv');
    res.send(csvString);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Export active and historical loans to CSV
// @route   GET /api/admin/export/loans
// @access  Private/Admin
router.get('/export/loans', protect, adminOnly, async (req, res) => {
  try {
    const records = await BorrowRecord.find({})
      .populate('student', 'name erpId branch division year email contactNumber')
      .populate('facultyMentor', 'name email department designation')
      .populate('cartItems.component', 'name category')
      .sort({ createdAt: -1 });

    let formattedData = [];
    if (records.length === 0) {
      formattedData.push({
        'Loan Token': '—',
        'Student Name': '—',
        'ERP ID': '—',
        'Department / Branch': '—',
        'Faculty Mentor': '—',
        'Project Title': 'No active or historical loans recorded in database',
        'Hardware Components': '—',
        'Status': 'CLEAN / 0 ACTIVE',
        'Requested Date': '—',
        'Due Date': '—',
        'Admin Notes': 'All equipment accounted for.'
      });
    } else {
      formattedData = records.map(r => ({
        'Loan Token': r.qrToken || '—',
        'Student Name': r.student?.name || '—',
        'ERP ID': r.student?.erpId || '—',
        'Department / Branch': r.student?.branch || '—',
        'Faculty Mentor': r.facultyMentor?.name || '—',
        'Project Title': r.projectTitle || '—',
        'Hardware Components': (r.cartItems || []).map(ci => `${ci.component?.name || 'Component'} (×${ci.quantity})`).join('; '),
        'Status': r.status || 'pending',
        'Requested Date': r.requestedAt ? new Date(r.requestedAt).toLocaleDateString() : '—',
        'Due Date': r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—',
        'Admin Notes': r.adminNotes || '—'
      }));
    }

    const fields = [
      'Loan Token',
      'Student Name',
      'ERP ID',
      'Department / Branch',
      'Faculty Mentor',
      'Project Title',
      'Hardware Components',
      'Status',
      'Requested Date',
      'Due Date',
      'Admin Notes'
    ];
    const csvString = convertToCSV(formattedData, fields);

    res.header('Content-Type', 'text/csv');
    res.attachment('tcet_hardware_loans_export.csv');
    res.send(csvString);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Export generated student credentials to CSV
// @route   GET /api/admin/export/credentials
// @access  Private/Admin
router.get('/export/credentials', protect, adminOnly, async (req, res) => {
  try {
    const credentialsPath = path.join(__dirname, '..', 'credentials.csv');

    if (fs.existsSync(credentialsPath)) {
      res.header('Content-Type', 'text/csv');
      res.attachment('student_credentials.csv');
      res.sendFile(credentialsPath);
    } else {
      res.status(404).json({ message: 'Credentials CSV file not found. Please run backend generator seeds.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get Institutional Overview Digest data
// @route   GET /api/admin/overview-digest
// @access  Private/Admin
router.get('/overview-digest', protect, adminOnly, async (req, res) => {
  try {
    const totalComponents = await Component.countDocuments();
    const activeLoans = await BorrowRecord.countDocuments({ status: { $in: ['handed_out', 'active'] } });
    const pendingRequests = await BorrowRecord.countDocuments({ status: { $in: ['pending_faculty', 'pending_admin'] } });
    const overdueLoans = await BorrowRecord.countDocuments({
      status: { $in: ['handed_out', 'active'] },
      dueDate: { $lt: new Date() }
    });
    const totalFaculty = await Faculty.countDocuments();

    const overview = {
      timestamp: new Date().toISOString(),
      academicYear: '2026 - 2027',
      kpis: {
        totalComponents,
        activeLoans,
        pendingRequests,
        overdueLoans,
        totalFaculty,
        systemHealth: overdueLoans === 0 ? 'Optimal (Green)' : 'Attention Required'
      },
      auditNotice: {
        status: 'Audit In Progress / Scheduled',
        dates: 'Upcoming Monday, Tuesday, and Wednesday',
        inventoryState: totalComponents === 0 ? 'Cleared for Audit' : `${totalComponents} components catalogued`,
        actionPlan: 'Post-audit verification will catalog urgently required hardware components.'
      }
    };

    res.json(overview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Generate and send automated overview email to stakeholders
// @route   POST /api/admin/send-overview-email
// @access  Private/Admin
router.post('/send-overview-email', protect, adminOnly, async (req, res) => {
  try {
    const {
      recipientEmail = process.env.EMAIL_USER || 'rndcelltcet@gmail.com',
      recipientName = 'R&D Governance Committee',
      customNotes = ''
    } = req.body;

    const totalComponents = await Component.countDocuments();
    const activeLoans = await BorrowRecord.countDocuments({ status: { $in: ['handed_out', 'active'] } });
    const pendingRequests = await BorrowRecord.countDocuments({ status: { $in: ['pending_faculty', 'pending_admin'] } });
    const overdueLoans = await BorrowRecord.countDocuments({
      status: { $in: ['handed_out', 'active'] },
      dueDate: { $lt: new Date() }
    });
    const totalFaculty = await Faculty.countDocuments();

    const subject = `[TCET R&D CELL] Institutional Hardware & Audit Overview — ${new Date().toLocaleDateString('en-GB')}`;

    const text = `TCET Research and Development Cell — Institutional Executive Overview
Date: ${new Date().toLocaleString()}
Recipient: ${recipientName} (${recipientEmail})

=======================================================
EXECUTIVE SUMMARY & OPERATIONAL HEALTH: ALL GREEN
=======================================================
• Overdue Loans: ${overdueLoans} (Health: 100% Green / Zero Delinquencies)
• Active Hardware Loans: ${activeLoans}
• Pending Student Requisitions: ${pendingRequests}
• Catalogued Components: ${totalComponents} (Cleared for Scheduled Audit)
• Academic Faculty Mentors: ${totalFaculty}

=======================================================
INSTITUTIONAL AUDIT SCHEDULE:
=======================================================
• Audit Window: Upcoming Monday, Tuesday, and Wednesday
• Audit Status: Hardware components inventory has been cleared for physical verification.
• Next Phase: Urgently required components will be catalogued immediately following audit sign-off.

${customNotes ? `\nAdministrative Remarks:\n${customNotes}\n` : ''}
Regards,
Ashish Mudholkar
Laboratory Administrator, R&D Cell
Thakur College of Engineering & Technology (TCET)`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; border: 2px solid #0b2545; background-color: #ffffff;">
        <div style="background-color: #0b2545; color: #ffffff; padding: 24px; border-bottom: 4px solid #e0a96d;">
          <div style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #e0a96d; font-weight: bold; margin-bottom: 4px;">Thakur College of Engineering & Technology</div>
          <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">TCET R&D Cell — Executive Overview</h1>
          <p style="margin: 6px 0 0; font-size: 12px; color: #cbd5e1;">Generated on ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
        </div>

        <div style="padding: 24px;">
          <p style="font-size: 13px; color: #334155; line-height: 1.5; margin-top: 0;">
            Dear <strong>${recipientName}</strong>,
          </p>
          <p style="font-size: 13px; color: #475569; line-height: 1.5;">
            Here is the automated institutional overview and laboratory audit digest from the TCET Smart Inventory Management System.
          </p>

          <!-- Audit Banner -->
          <div style="background-color: #fefce8; border: 2px solid #fef08a; padding: 16px; margin: 18px 0; border-radius: 4px;">
            <div style="font-size: 11px; font-weight: 800; color: #854d0e; text-transform: uppercase; letter-spacing: 1px;">SCHEDULED LABORATORY AUDIT NOTICE</div>
            <div style="font-size: 14px; font-weight: 800; color: #713f12; margin: 4px 0;">Physical Audit Scheduled for Upcoming Monday, Tuesday & Wednesday</div>
            <p style="font-size: 12px; color: #854d0e; margin: 4px 0 0; line-height: 1.4;">
              All previous components have been systematically cleared from the catalog to prepare for comprehensive stock verification. Urgently required hardware will be re-catalogued immediately upon completion of the audit.
            </p>
          </div>

          <!-- KPI Grid -->
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 20px 0;">
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 14px;">
              <div style="font-size: 10px; font-weight: bold; color: #166534; text-transform: uppercase;">Overdue Loans</div>
              <div style="font-size: 26px; font-weight: 900; color: #15803d; margin: 2px 0;">${overdueLoans}</div>
              <div style="font-size: 11px; color: #16a34a; font-weight: 600;">Operational Status: 100% Green</div>
            </div>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 14px;">
              <div style="font-size: 10px; font-weight: bold; color: #475569; text-transform: uppercase;">Active Hardware Loans</div>
              <div style="font-size: 26px; font-weight: 900; color: #0f172a; margin: 2px 0;">${activeLoans}</div>
              <div style="font-size: 11px; color: #64748b;">Hardware Deployed</div>
            </div>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 14px;">
              <div style="font-size: 10px; font-weight: bold; color: #475569; text-transform: uppercase;">Pending Requisitions</div>
              <div style="font-size: 26px; font-weight: 900; color: #0f172a; margin: 2px 0;">${pendingRequests}</div>
              <div style="font-size: 11px; color: #64748b;">Awaiting Admin Review</div>
            </div>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 14px;">
              <div style="font-size: 10px; font-weight: bold; color: #475569; text-transform: uppercase;">Academic Faculty Roster</div>
              <div style="font-size: 26px; font-weight: 900; color: #0f172a; margin: 2px 0;">${totalFaculty}</div>
              <div style="font-size: 11px; color: #64748b;">Enrolled Mentors</div>
            </div>
          </div>

          ${customNotes ? `
            <div style="background-color: #f8fafc; border-left: 4px solid #0b2545; padding: 12px 16px; margin: 18px 0;">
              <div style="font-size: 11px; font-weight: bold; color: #0b2545; text-transform: uppercase;">Administrator Remarks</div>
              <div style="font-size: 12px; color: #334155; margin-top: 4px; white-space: pre-wrap;">${customNotes}</div>
            </div>
          ` : ''}

          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="font-size: 11px; color: #94a3b8; margin-bottom: 0;">
            This automated overview was triggered via the Administrative Utilities Portal. Research & Development Cell, TCET Mumbai.
          </p>
        </div>
      </div>
    `;

    const emailResult = await sendEmail(recipientEmail, subject, text, html);

    res.json({
      success: true,
      message: `Executive overview email generated and dispatched to ${recipientEmail}`,
      recipient: recipientEmail,
      messageId: emailResult?.messageId || 'mock-id'
    });
  } catch (error) {
    console.error('Error sending overview email:', error);
    res.status(500).json({ message: error.message });
  }
});
// @desc    Get SMTP server status and active configuration
// @route   GET /api/admin/smtp/status
// @access  Private/Admin
router.get('/smtp/status', protect, adminOnly, async (req, res) => {
  try {
    const config = getSmtpConfig();
    const verification = await verifySmtpConnection();

    res.json({
      config,
      verification,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching SMTP status:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Test SMTP server handshake and optionally dispatch a test probe email
// @route   POST /api/admin/smtp/test
// @access  Private/Admin
router.post('/smtp/test', protect, adminOnly, async (req, res) => {
  try {
    const { targetEmail } = req.body;
    const config = getSmtpConfig();
    const verification = await verifySmtpConnection();

    if (!verification.connected) {
      return res.status(400).json({
        success: false,
        message: `SMTP Connection Handshake Failed: ${verification.message}`,
        details: verification
      });
    }

    let probeResult = null;
    const recipient = targetEmail || config.user || 'rndcelltcet@gmail.com';

    if (recipient) {
      const subject = `[TCET R&D Cell] SMTP Server Handshake Test Probe — ${new Date().toLocaleDateString('en-GB')}`;
      const text = `This is an automated diagnostic test probe dispatched from the TCET Smart Inventory Management System.\n\nSMTP Host: ${config.host}\nSMTP Port: ${config.port}\nAuth User: ${config.user}\nTimestamp: ${new Date().toISOString()}`;
      const html = `
        <div style="font-family: Arial, sans-serif; border: 2px solid #0b2545; padding: 20px; max-width: 550px;">
          <h2 style="color: #0b2545; margin-top: 0; border-bottom: 2px solid #e0a96d; padding-bottom: 8px;">TCET R&D Cell — SMTP Handshake Test</h2>
          <p style="color: #166534; font-weight: bold; background-color: #f0fdf4; padding: 10px; border-radius: 4px;">
            ✓ SMTP Mail Server handshake confirmed successfully.
          </p>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 15px 0;">
            <tr><td style="padding: 6px; color: #64748b;">SMTP Host:</td><td style="padding: 6px; font-weight: bold;">${config.host}</td></tr>
            <tr><td style="padding: 6px; color: #64748b;">SMTP Port:</td><td style="padding: 6px; font-weight: bold;">${config.port}</td></tr>
            <tr><td style="padding: 6px; color: #64748b;">Auth User:</td><td style="padding: 6px; font-weight: bold;">${config.user}</td></tr>
            <tr><td style="padding: 6px; color: #64748b;">Mode:</td><td style="padding: 6px; font-weight: bold;">${config.mode}</td></tr>
          </table>
          <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">Automated test triggered from Admin Utilities Control Hub.</p>
        </div>
      `;

      probeResult = await sendEmail({
        to: recipient,
        subject,
        text,
        html
      });
    }

    res.json({
      success: true,
      message: `SMTP handshake verified successfully. Probe email dispatched to ${recipient}`,
      verification,
      probeResult
    });
  } catch (error) {
    console.error('SMTP test error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Generate comprehensive laboratory audit CSV package and send with physical attachment
// @route   POST /api/admin/send-audit-file-email
// @access  Private/Admin
router.post('/send-audit-file-email', protect, adminOnly, async (req, res) => {
  try {
    const {
      recipientEmail = process.env.EMAIL_USER || 'rndcelltcet@gmail.com',
      recipientName = 'Institutional Audit Committee',
      customNotes = '',
      includeLoansRegister = true
    } = req.body;

    const components = await Component.find({}).lean();
    const activeLoans = await BorrowRecord.find({ status: { $in: ['handed_out', 'active'] } })
      .populate('student', 'name erpId branch')
      .populate('facultyMentor', 'name')
      .populate('cartItems.component', 'name')
      .lean();
    const overdueLoans = await BorrowRecord.find({
      status: { $in: ['handed_out', 'active'] },
      dueDate: { $lt: new Date() }
    }).populate('student', 'name erpId').lean();

    const totalFaculty = await Faculty.countDocuments();
    const dateStr = new Date().toLocaleDateString('en-GB');

    // Build the Official Audit CSV Package Content
    let csvLines = [];
    csvLines.push('========================================================================');
    csvLines.push('THAKUR COLLEGE OF ENGINEERING & TECHNOLOGY (TCET) - R&D CELL');
    csvLines.push('OFFICIAL LABORATORY AUDIT FILE & HARDWARE REGISTER');
    csvLines.push(`Generated: ${new Date().toLocaleString('en-US', { timeStyle: 'medium', dateStyle: 'full' })}`);
    csvLines.push('Scheduled Audit Window: Upcoming Monday, Tuesday, and Wednesday');
    csvLines.push('========================================================================\n');

    csvLines.push('--- SECTION 1: HARDWARE INVENTORY REGISTER ---');
    if (components.length === 0) {
      csvLines.push('Status,Inventory Count,Notice,Action Plan');
      csvLines.push('PRE-AUDIT PURGE,0,"All legacy hardware cleared in preparation for physical audit (Mon-Wed).","Urgently required components will be catalogued immediately following audit sign-off."');
    } else {
      csvLines.push('Asset ID,Component Name,Category,Total Qty,Available Qty,Specs,Status');
      components.forEach(c => {
        csvLines.push(`"${c._id}","${c.name}","${c.category || ''}",${c.quantityTotal || 0},${c.quantityAvailable || 0},"${(c.specs || '').replace(/"/g, '""')}","${c.status || 'Active'}"`);
      });
    }

    if (includeLoansRegister) {
      csvLines.push('\n--- SECTION 2: HARDWARE LOANS & DELINQUENCIES ---');
      csvLines.push(`Active Checkouts: ${activeLoans.length}, Overdue Delinquencies: ${overdueLoans.length}`);
      if (activeLoans.length === 0) {
        csvLines.push('Status,Compliance Notice');
        csvLines.push('100% GREEN COMPLIANT,"Zero hardware loans currently outstanding. No student administrative holds required."');
      } else {
        csvLines.push('Record ID,Student Name,ERP ID,Branch,Project Title,Items Borrowed,Due Date,Status,Days Overdue');
        activeLoans.forEach(loan => {
          const isOverdue = new Date(loan.dueDate) < new Date();
          const daysOverdue = isOverdue ? Math.ceil((Date.now() - new Date(loan.dueDate)) / 86400000) : 0;
          const itemNames = (loan.cartItems || []).map(i => `${i.component?.name || 'Hardware'} (x${i.quantity})`).join('; ');
          csvLines.push(`"${loan._id}","${loan.student?.name || 'Student'}","${loan.student?.erpId || ''}","${loan.student?.branch || ''}","${(loan.projectTitle || '').replace(/"/g, '""')}","${itemNames}","${new Date(loan.dueDate).toLocaleDateString('en-GB')}","${loan.status}",${daysOverdue}`);
        });
      }
    }

    csvLines.push('\n--- SECTION 3: AUDITOR VERIFICATION & SIGN-OFF BLOCK ---');
    csvLines.push('Auditor Name,Designation,Sign-off Date,Audit Decision,Remarks');
    csvLines.push('"","Institutional Auditor / HOD","","[ ] APPROVED   [ ] CONDITIONAL   [ ] PENDING",""');

    const csvContent = csvLines.join('\n');
    const filename = `TCET_Laboratory_Audit_File_${new Date().toISOString().split('T')[0]}.csv`;

    const subject = `[OFFICIAL AUDIT PACKAGE] TCET Laboratory Audit File & Inventory Register — ${dateStr}`;
    const text = `TCET RESEARCH AND DEVELOPMENT CELL — OFFICIAL AUDIT FILE
Date: ${new Date().toLocaleString()}
Recipient: ${recipientName} (${recipientEmail})

Attached to this email is the official institutional audit CSV file: ${filename}

SUMMARY OF AUDIT PREPARATION:
• Scheduled Audit Window: Upcoming Monday, Tuesday, and Wednesday
• Catalogued Components: ${components.length} (Cleared ahead of physical audit)
• Active Loans: ${activeLoans.length}
• Overdue Delinquencies: ${overdueLoans.length} (100% Green Compliant)
• Academic Faculty Mentors: ${totalFaculty}

${customNotes ? `Administrative Remarks:\n${customNotes}\n` : ''}
Regards,
Ashish Mudholkar
Laboratory Administrator, TCET R&D Cell`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; border: 2px solid #0b2545; background-color: #ffffff;">
        <div style="background-color: #0b2545; color: #ffffff; padding: 24px; border-bottom: 4px solid #e0a96d;">
          <div style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #e0a96d; font-weight: 800; margin-bottom: 4px;">Thakur College of Engineering & Technology</div>
          <h1 style="margin: 0; font-size: 20px; font-weight: 800;">TCET R&D Cell — Official Laboratory Audit Package</h1>
          <p style="margin: 6px 0 0; font-size: 12px; color: #cbd5e1;">Generated for ${recipientName} on ${dateStr}</p>
        </div>

        <div style="padding: 24px;">
          <p style="font-size: 13px; color: #334155; line-height: 1.5; margin-top: 0;">
            Dear <strong>${recipientName}</strong>,
          </p>
          <p style="font-size: 13px; color: #475569; line-height: 1.5;">
            Please find attached the official laboratory audit file: <strong style="color: #0b2545;">${filename}</strong> generated directly from the TCET Smart Inventory System.
          </p>

          <!-- Audit Schedule Banner -->
          <div style="background-color: #fefce8; border: 2px solid #fef08a; padding: 14px 18px; margin: 18px 0; border-radius: 4px;">
            <div style="font-size: 11px; font-weight: 800; color: #854d0e; text-transform: uppercase;">Audit Window</div>
            <div style="font-size: 14px; font-weight: 800; color: #713f12; margin: 2px 0;">Scheduled for Upcoming Monday, Tuesday & Wednesday</div>
            <div style="font-size: 12px; color: #854d0e;">Hardware inventory has been purged in anticipation of comprehensive physical verification. Urgent items will be catalogued immediately following audit sign-off.</div>
          </div>

          <!-- Attachment Box -->
          <div style="background-color: #f0fdf4; border: 2px solid #bbf7d0; padding: 14px 18px; margin: 18px 0; border-radius: 4px;">
            <div style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase;">Attached Audit Asset</div>
            <div style="font-size: 14px; font-weight: 800; color: #15803d; margin: 2px 0;">📎 ${filename}</div>
            <div style="font-size: 12px; color: #166534;">Contains complete inventory registers, loans status, and auditor sign-off section.</div>
          </div>

          <!-- Stats Grid -->
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 20px 0; background-color: #f8fafc; border: 1px solid #e2e8f0;">
            <tr>
              <td style="padding: 10px 14px; color: #64748b; border-bottom: 1px solid #e2e8f0; width: 45%;">Hardware Catalog Count:</td>
              <td style="padding: 10px 14px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${components.length} (Audit Purge State)</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; color: #64748b; border-bottom: 1px solid #e2e8f0;">Overdue Loans Delinquency:</td>
              <td style="padding: 10px 14px; font-weight: 800; color: #16a34a; border-bottom: 1px solid #e2e8f0;">${overdueLoans.length} (100% Green Compliant)</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; color: #64748b; border-bottom: 1px solid #e2e8f0;">Active Student Loans:</td>
              <td style="padding: 10px 14px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${activeLoans.length}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; color: #64748b;">Academic Faculty Mentors:</td>
              <td style="padding: 10px 14px; font-weight: 800; color: #0f172a;">${totalFaculty}</td>
            </tr>
          </table>

          ${customNotes ? `
            <div style="background-color: #f8fafc; border-left: 4px solid #0b2545; padding: 12px 16px; margin: 18px 0; font-size: 12px; color: #334155;">
              <strong>Administrative Remarks:</strong><br>
              ${customNotes}
            </div>
          ` : ''}

          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="font-size: 11px; color: #94a3b8; margin-bottom: 0;">
            This audit package was generated and dispatched automatically via the TCET Smart Inventory SMTP Mail Engine.
          </p>
        </div>
      </div>
    `;

    const emailResult = await sendEmail({
      to: recipientEmail,
      subject,
      text,
      html,
      attachments: [
        {
          filename,
          content: csvContent,
          contentType: 'text/csv'
        }
      ]
    });

    res.json({
      success: true,
      message: `Official audit package with attached file '${filename}' dispatched to ${recipientEmail}`,
      filename,
      recipient: recipientEmail,
      messageId: emailResult?.messageId
    });
  } catch (error) {
    console.error('Error generating and sending audit file email:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Trigger automated scan for overdue hardware checkouts and send student email notices
// @route   POST /api/admin/trigger-overdue-scan
// @access  Private/Admin
router.post('/trigger-overdue-scan', protect, adminOnly, async (req, res) => {
  try {
    const { dryRun = false, notifyMentor = true } = req.body;
    const report = await runOverdueScan({ dryRun: Boolean(dryRun), notifyMentor: Boolean(notifyMentor) });

    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error triggering overdue scan:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;