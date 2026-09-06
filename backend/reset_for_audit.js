import dns from 'node:dns';
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {}

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import Component from './models/Component.js';
import BorrowRecord from './models/BorrowRecord.js';

dotenv.config();

const resetForAudit = async () => {
  try {
    await connectDB();

    // 1. Remove all inventory components ahead of the audit
    const compDeleteResult = await Component.deleteMany({});
    console.log(`[Audit Reset] Cleared all components: ${compDeleteResult.deletedCount} removed.`);

    // 2. Remove sample/mock borrow records (including INITSEED sample)
    const borrowDeleteResult = await BorrowRecord.deleteMany({
      $or: [
        { qrToken: { $regex: /INITSEED/i } },
        { projectTitle: 'Smart Surveillance Drone Gateway' }
      ]
    });
    console.log(`[Audit Reset] Purged mock/sample borrow records: ${borrowDeleteResult.deletedCount} removed.`);

    // Check remaining genuine borrow records
    const genuineBorrows = await BorrowRecord.countDocuments();
    console.log(`[Audit Reset] Remaining genuine student borrow records: ${genuineBorrows}`);

    console.log('[Audit Reset] Database reset for upcoming Mon/Tue/Wed audit complete.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`[Audit Reset Error]: ${error.message}`);
    process.exit(1);
  }
};

resetForAudit();
