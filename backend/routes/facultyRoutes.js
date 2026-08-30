import express from 'express';
import BorrowRecord from '../models/BorrowRecord.js';
import Faculty from '../models/Faculty.js';
import { protect, facultyOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get all faculty members for the roster
// @route   GET /api/faculty/roster
// @access  Private/Faculty
router.get('/roster', protect, facultyOnly, async (req, res) => {
  try {
    const roster = await Faculty.find({}).select('name designation department specialization email');
    res.json(roster);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get pending borrow requests assigned to logged-in faculty
// @route   GET /api/faculty/pending
// @access  Private/Faculty
router.get('/pending', protect, facultyOnly, async (req, res) => {
  try {
    const pending = await BorrowRecord.find({
      facultyMentor: req.user._id,
      status: 'pending_faculty'
    })
    .populate('student', 'name erpId branch division year email contactNumber')
    .populate('cartItems.component', 'name category specs quantityAvailable imageUrl')
    .sort({ createdAt: -1 });

    res.json(pending);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Approve or Reject a borrow request
// @route   PUT /api/faculty/decide/:id
// @access  Private/Faculty
router.put('/decide/:id', protect, facultyOnly, async (req, res) => {
  const { approved, remarks } = req.body;

  if (approved === undefined) {
    return res.status(400).json({ message: 'Decision approval boolean is required' });
  }

  try {
    const record = await BorrowRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: 'Borrow record not found' });
    }

    // Ensure it is assigned to this faculty
    if (record.facultyMentor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: This request is not assigned to you' });
    }

    // Ensure request is in pending_faculty status
    if (record.status !== 'pending_faculty') {
      return res.status(400).json({ message: `Cannot decide on request. Current status: ${record.status}` });
    }

    record.facultyDecision = {
      approved,
      timestamp: new Date(),
      remarks: remarks || ''
    };

    // Sequential workflow: moving statuses
    record.status = approved ? 'pending_admin' : 'rejected';
    
    const updatedRecord = await record.save();
    
    res.json({
      message: approved ? 'Request approved and forwarded to Admin' : 'Request rejected and closed',
      record: updatedRecord
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
