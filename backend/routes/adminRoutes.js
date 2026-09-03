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

    const faculties = await Faculty.find(query).sort({ seniorityOrder: 1, hierarchyTier: 1, dojDate: 1 });
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
