import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';
import Admin from '../models/Admin.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper to generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'super_secure_tcet_rnd_secret_key_123', {
    expiresIn: '30d'
  });
};

// @desc    Student Login
// @route   POST /api/auth/student/login
// @access  Public
router.post('/student/login', async (req, res) => {
  const { loginId, password } = req.body; // loginId can be erpId or userId

  if (!loginId || !password) {
    return res.status(400).json({ message: 'Please provide all credentials' });
  }

  try {
    // Find student by erpId OR userId
    const student = await Student.findOne({
      $or: [{ erpId: loginId }, { userId: loginId }]
    });

    if (student && (await bcrypt.compare(password, student.password))) {
      res.json({
        _id: student._id,
        name: student.name,
        email: student.email,
        contactNumber: student.contactNumber,
        erpId: student.erpId,
        userId: student.userId,
        rollNo: student.rollNo,
        branch: student.branch,
        division: student.division,
        role: 'student',
        token: generateToken(student._id, 'student')
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Faculty Login
// @route   POST /api/auth/faculty/login
// @access  Public
router.post('/faculty/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  try {
    const faculty = await Faculty.findOne({ email });

    if (faculty && (await bcrypt.compare(password, faculty.password))) {
      res.json({
        _id: faculty._id,
        name: faculty.name,
        email: faculty.email,
        contactNumber: faculty.contactNumber,
        department: faculty.department,
        designation: faculty.designation,
        role: 'faculty',
        token: generateToken(faculty._id, 'faculty')
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Admin Login
// @route   POST /api/auth/admin/login
// @access  Public
router.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Please provide username and password' });
  }

  try {
    const searchIdentifier = username.trim();
    // Allow login by Username or Email (case-insensitive)
    let admin = await Admin.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${searchIdentifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        { email: { $regex: new RegExp(`^${searchIdentifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
      ]
    });

    let passwordMatches = false;
    if (admin) {
      passwordMatches = await bcrypt.compare(password, admin.password);
    }

    // Auto-sync / upgrade Admin credentials in database when matching new credentials
    if (!passwordMatches && 
        (searchIdentifier.toLowerCase() === 'admin' || searchIdentifier.toLowerCase() === 'ashish.mudholkar75@gmail.com') && 
        password === 'RNDTCET@2026') {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('RNDTCET@2026', salt);

      if (!admin) {
        admin = await Admin.findOne({});
      }

      if (admin) {
        admin.name = 'Ashish Mudholkar';
        admin.email = 'ashish.mudholkar75@gmail.com';
        admin.username = 'Admin';
        admin.password = hashedPassword;
        admin.role = 'admin';
        if (!admin.contactNumber) admin.contactNumber = '9920123456';
        await admin.save();
      } else {
        admin = await Admin.create({
          name: 'Ashish Mudholkar',
          email: 'ashish.mudholkar75@gmail.com',
          username: 'Admin',
          password: hashedPassword,
          role: 'admin',
          contactNumber: '9920123456'
        });
      }
      passwordMatches = true;
    }

    if (admin && passwordMatches) {
      res.json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        contactNumber: admin.contactNumber,
        username: admin.username,
        role: 'admin',
        token: generateToken(admin._id, 'admin')
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Sync Admin Credentials in Database
// @route   ALL /api/auth/sync-admin
// @access  Public
router.all('/sync-admin', async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('RNDTCET@2026', salt);

    let admin = await Admin.findOne({
      $or: [
        { username: { $regex: /^admin$/i } },
        { email: 'ashish.mudholkar75@gmail.com' }
      ]
    });

    if (!admin) admin = await Admin.findOne({});

    if (admin) {
      admin.name = 'Ashish Mudholkar';
      admin.email = 'ashish.mudholkar75@gmail.com';
      admin.username = 'Admin';
      admin.password = hashedPassword;
      admin.role = 'admin';
      if (!admin.contactNumber) admin.contactNumber = '9920123456';
      await admin.save();
    } else {
      admin = await Admin.create({
        name: 'Ashish Mudholkar',
        email: 'ashish.mudholkar75@gmail.com',
        username: 'Admin',
        password: hashedPassword,
        role: 'admin',
        contactNumber: '9920123456'
      });
    }

    res.json({
      success: true,
      message: 'Admin credentials synced successfully in database',
      admin: {
        name: admin.name,
        email: admin.email,
        username: admin.username,
        role: admin.role
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Get Current User Profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  if (req.user) {
    res.json({
      _id: req.user._id,
      name: req.user.name || req.user.username,
      email: req.user.email,
      username: req.user.username,
      contactNumber: req.user.contactNumber,
      role: req.userRole,
      user: req.user
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

export default router;
