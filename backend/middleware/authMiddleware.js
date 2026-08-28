import jwt from 'jsonwebtoken';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';
import Admin from '../models/Admin.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secure_tcet_rnd_secret_key_123');
    
    // Attach user to req based on role
    if (decoded.role === 'student') {
      req.user = await Student.findById(decoded.id).select('-password');
    } else if (decoded.role === 'faculty') {
      req.user = await Faculty.findById(decoded.id).select('-password');
    } else if (decoded.role === 'admin') {
      req.user = await Admin.findById(decoded.id).select('-password');
    }

    if (!req.user) {
      return res.status(401).json({ message: 'User not found or deleted' });
    }
    
    req.userRole = decoded.role;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error.message);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export const studentOnly = (req, res, next) => {
  if (req.userRole !== 'student') {
    return res.status(403).json({ message: 'Access denied: Students only' });
  }
  next();
};

export const facultyOnly = (req, res, next) => {
  if (req.userRole !== 'faculty') {
    return res.status(403).json({ message: 'Access denied: Faculty only' });
  }
  next();
};

export const adminOnly = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admin only' });
  }
  next();
};
