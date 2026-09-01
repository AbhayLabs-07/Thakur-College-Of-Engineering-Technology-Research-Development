import express from 'express';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';
import BorrowRecord from '../models/BorrowRecord.js';
import Component from '../models/Component.js';
import { protect, studentOnly } from '../middleware/authMiddleware.js';
import crypto from 'crypto';

const router = express.Router();

// @desc    Get faculty mentors (Name and Department only for students)
// @route   GET /api/students/mentors
// @access  Private/Student
router.get('/mentors', protect, studentOnly, async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search && search.trim() !== '') {
      query.name = { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    }
    const mentors = await Faculty.find(query).select('name department').sort({ name: 1 });
    res.json(mentors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create new borrow request
// @route   POST /api/students/checkout
// @access  Private/Student
router.post('/checkout', protect, studentOnly, async (req, res) => {
  const {
    teamMembers,
    facultyMentorId,
    projectTitle,
    projectDomain,
    projectDescription,
    cartItems
  } = req.body;

  if (!facultyMentorId || !projectTitle || !projectDomain || !projectDescription || !cartItems || cartItems.length === 0) {
    return res.status(400).json({ message: 'Missing required checkout information' });
  }

  try {
    // Prevent rapid duplicate submissions (within 30 seconds for same student + project)
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    const existingRecent = await BorrowRecord.findOne({
      student: req.user._id,
      facultyMentor: facultyMentorId,
      projectTitle: projectTitle.trim(),
      status: 'pending_faculty',
      createdAt: { $gte: thirtySecondsAgo }
    })
    .populate('facultyMentor', 'name email')
    .populate('cartItems.component', 'name category imageUrl');

    if (existingRecent) {
      return res.status(200).json(existingRecent);
    }

    // Verify items in inventory are available in the requested quantities
    for (const item of cartItems) {
      const component = await Component.findById(item.component);
      if (!component) {
        return res.status(404).json({ message: `Component not found: ${item.component}` });
      }
      if (component.quantityAvailable < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${component.name}. Available: ${component.quantityAvailable}, Requested: ${item.quantity}` 
        });
      }
    }

    // Generate secure QR Token
    const randomHex = crypto.randomBytes(8).toString('hex').toUpperCase();
    const qrToken = `TCET-RND-${req.user.erpId}-${randomHex}`;

    // Calculate due date (standard: 14 days)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const newRecord = new BorrowRecord({
      student: req.user._id,
      teamMembers: teamMembers || [],
      facultyMentor: facultyMentorId,
      projectTitle,
      projectDomain,
      projectDescription,
      cartItems,
      status: 'pending_faculty',
      qrToken,
      dueDate
    });

    const savedRecord = await newRecord.save();
    
    // Return record populated
    const populated = await BorrowRecord.findById(savedRecord._id)
      .populate('facultyMentor', 'name email')
      .populate('cartItems.component', 'name category imageUrl');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get student borrow request history
// @route   GET /api/students/history
// @access  Private/Student
router.get('/history', protect, studentOnly, async (req, res) => {
  try {
    const history = await BorrowRecord.find({ student: req.user._id })
      .populate('facultyMentor', 'name email department designation')
      .populate('cartItems.component', 'name category specs imageUrl')
      .sort({ createdAt: -1 });

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
