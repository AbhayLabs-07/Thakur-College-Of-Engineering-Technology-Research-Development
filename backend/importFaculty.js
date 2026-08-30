import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import Faculty from './models/Faculty.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CSV parser helper that respects quotes
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

const importFaculty = async () => {
  try {
    await connectDB();

    // Drop the old non-sparse unique email index if it exists
    await Faculty.collection.dropIndex('email_1').catch(err => {
      console.log('Index email_1 drop info (safe to ignore):', err.message);
    });

    // The CSV file is located at the workspace root (two folders up from backend)
    const csvPath = path.join(__dirname, '../../tcet_faculty.csv');
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found at: ${csvPath}`);
    }

    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');
    
    if (lines.length <= 1) {
      console.log('No faculty data found in CSV.');
      process.exit(0);
    }

    // Skip the header line
    const dataLines = lines.slice(1);
    let importedCount = 0;
    let updatedCount = 0;

    console.log(`Processing ${dataLines.length} faculty rows...`);

    for (const line of dataLines) {
      const columns = parseCSVLine(line);
      if (columns.length < 3) continue;

      const name = columns[0];
      const designation = columns[1];
      const department = columns[2];
      const specialization = columns[3] || '';
      const emailVal = columns[4] || '';
      
      if (!name || !department) continue;

      // Construct update payload
      const updateData = {
        name,
        designation: designation || 'Assistant Professor',
        department,
        specialization,
      };

      // Handle email carefully: use undefined if empty to avoid duplicate key errors on sparse index
      if (emailVal.trim() !== '') {
        updateData.email = emailVal.toLowerCase().trim();
      } else {
        // Find existing to see if we should leave existing email intact, or delete it
        const existing = await Faculty.findOne({ name, department });
        if (!existing || !existing.email) {
          // If no existing email, don't set it to avoid collision
          // Mongoose will omit undefined fields from $set
          updateData.email = undefined; 
        }
      }

      // Upsert based on name and department to prevent duplicates on re-import
      const result = await Faculty.findOneAndUpdate(
        { name, department },
        { $set: updateData },
        { upsert: true, new: true, includeResultMetadata: true }
      );

      if (result.lastErrorObject?.updatedExisting) {
        updatedCount++;
      } else {
        importedCount++;
      }
    }

    console.log(`Faculty import completed successfully.`);
    console.log(`- Created new: ${importedCount}`);
    console.log(`- Updated existing: ${updatedCount}`);
    
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`Import failed: ${error.message}`);
    process.exit(1);
  }
};

importFaculty();
