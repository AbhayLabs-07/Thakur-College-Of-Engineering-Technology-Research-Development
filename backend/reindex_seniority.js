import dns from 'node:dns';
dns.setServers(['1.1.1.1', '8.8.8.8']);
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Faculty from './models/Faculty.js';

const reindexSeniority = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected.');

    const faculties = await Faculty.find({}).lean();
    console.log(`Total faculties to re-index: ${faculties.length}`);

    // Helper to get timestamp from dojDate or parse doj string
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
      // Missing or invalid DOJ placed at the end of their respective tier
      return 9999999999999;
    };

    // Sort comparator strictly by Position (Hierarchy Tier) -> Date of Joining (DOJ) -> Original sequence
    const comparator = (a, b) => {
      // 1. Position / Hierarchy Tier ASC (Tier 1: Principal -> Tier 11: Academic Staff)
      const tierA = a.hierarchyTier ?? 99;
      const tierB = b.hierarchyTier ?? 99;
      if (tierA !== tierB) {
        return tierA - tierB;
      }

      // 2. Date of Joining (earliest date first, missing dates at end of tier)
      const timeA = getDojTime(a);
      const timeB = getDojTime(b);
      if (timeA !== timeB) {
        return timeA - timeB;
      }

      // 3. Deterministic sequence tie-breaker (srNo or current seniorityOrder - NOT alphabetical)
      const orderA = a.srNo || a.seniorityOrder || 99999;
      const orderB = b.srNo || b.seniorityOrder || 99999;
      return orderA - orderB;
    };

    // 1. College-wide Seniority Ranking
    faculties.sort(comparator);

    faculties.forEach((f, idx) => {
      f.newSeniorityOrder = idx + 1;
    });

    // 2. Department-wise Seniority Ranking
    const deptGroups = new Map();
    for (const f of faculties) {
      const dept = f.department || 'Unassigned';
      if (!deptGroups.has(dept)) {
        deptGroups.set(dept, []);
      }
      deptGroups.get(dept).push(f);
    }

    for (const [dept, list] of deptGroups.entries()) {
      list.sort(comparator);
      list.forEach((f, idx) => {
        f.newDeptSeniorityOrder = idx + 1;
      });
    }

    // 3. Bulk write updates to MongoDB
    console.log('Updating MongoDB records...');
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

    const bulkResult = await Faculty.bulkWrite(bulkOps);
    console.log(`Bulk update complete: ${bulkResult.modifiedCount} documents updated.`);

    // 4. Verification Check
    console.log('\n--- VERIFICATION: TOP 20 COLLEGE SENIORITY ---');
    const updatedTop20 = await Faculty.find({}).sort({ seniorityOrder: 1 }).limit(20).lean();
    updatedTop20.forEach(f => {
      console.log(`#${String(f.seniorityOrder).padStart(3, ' ')} | [Tier ${f.hierarchyTier}: ${f.hierarchyLabel.padEnd(20, ' ')}] ${f.name.padEnd(28, ' ')} | DOJ: ${f.doj ? f.doj.padEnd(10, ' ') : 'N/A       '} | Dept: ${f.department}`);
    });

    // Check where Dr. Harsh Gagrani is positioned
    const gagrani = await Faculty.findOne({ name: /Gagrani/i }).lean();
    if (gagrani) {
      console.log(`\nDr. Harsh Gagrani Position: Seniority #${gagrani.seniorityOrder} | Tier ${gagrani.hierarchyTier}: ${gagrani.hierarchyLabel} | DOJ: ${gagrani.doj || 'N/A'}`);
    }

    // Check for any tier inversions across the entire database
    const allCheck = await Faculty.find({}).sort({ seniorityOrder: 1 }).lean();
    let inversions = 0;
    for (let i = 1; i < allCheck.length; i++) {
      if (allCheck[i].hierarchyTier < allCheck[i - 1].hierarchyTier) {
        console.error(`INVERSION DETECTED: #${allCheck[i - 1].seniorityOrder} ${allCheck[i - 1].name} (Tier ${allCheck[i - 1].hierarchyTier}) before #${allCheck[i].seniorityOrder} ${allCheck[i].name} (Tier ${allCheck[i].hierarchyTier})`);
        inversions++;
      }
    }

    if (inversions === 0) {
      console.log('\nSUCCESS: 0 tier inversions across all ' + allCheck.length + ' faculty members!');
    } else {
      console.error(`\nFAILED: Found ${inversions} tier inversions.`);
    }

  } catch (err) {
    console.error('Error during reindexing:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
};

reindexSeniority();
