import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import facultyRoutes from './routes/facultyRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import componentRoutes from './routes/componentRoutes.js';

// Cron import
import { scheduleCronJob, runOverdueScan } from './cron/overdueScan.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

// Connect to MongoDB
// Connect to MongoDB on startup
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serverless DB connection assurance middleware
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Base Health Routes
app.get(['/', '/api'], (req, res) => {
  res.json({ 
    message: 'Smart Inventory Management System API (TCET R&D Cell) is running...',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// Manual Cron Trigger for Testing/Fulfill validation
app.post(['/api/cron/trigger-overdue', '/cron/trigger-overdue'], async (req, res) => {
  try {
    await runOverdueScan();
    res.json({ message: 'Overdue scan executed manually successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/students', '/students'], studentRoutes);
app.use(['/api/faculty', '/faculty'], facultyRoutes);
app.use(['/api/admin', '/admin'], adminRoutes);
app.use(['/api/components', '/components'], componentRoutes);

// Error Middleware
app.use(notFound);
app.use(errorHandler);

// Schedule Cron Jobs
if (!process.env.VERCEL) {
  scheduleCronJob();
}

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running in development mode on port ${PORT}`);
  });
}

export default app;
