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
// @route   GET /api/admin/export/inventory
// @access  Private/Admin
router.get('/export/inventory', protect, adminOnly, async (req, res) => {
  try {
    const components = await Component.find({});
    
    // Format JSON data for conversion
    const formattedData = components.map(c => ({
      Name: c.name,
      Category: c.category,
      'Total Stock': c.quantityTotal,
      'Available Stock': c.quantityAvailable,
      Keywords: c.keywords.join(', '),
      Description: c.description
    }));

    const fields = ['Name', 'Category', 'Total Stock', 'Available Stock', 'Keywords', 'Description'];
    const csvString = convertToCSV(formattedData, fields);

    res.header('Content-Type', 'text/csv');
    res.attachment('tcet_inventory_export.csv');
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
    // The CSV file is generated inside the backend directory during seeder/generate-data runs
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

export default router;
