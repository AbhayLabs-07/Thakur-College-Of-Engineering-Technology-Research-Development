import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import xlsx from 'xlsx';
import connectDB from './config/db.js';
import Faculty from './models/Faculty.js';
import BorrowRecord from './models/BorrowRecord.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: Normalize name for matching
function normalizeName(name) {
  if (!name) return '';
  let n = name.toLowerCase();
  n = n.replace(/^(dr|mr|ms|mrs|prof)\.?\s*/i, '');
  n = n.replace(/[^a-z0-9]/g, '');
  return n;
}

// Helper: Clean faculty name from Excel raw text
function cleanFacultyName(raw) {
  let text = String(raw || '').trim();
  // Remove parenthetical/bracketed notes like (DOJ: 12.06.06) or (DOR:11.11.03)
  text = text.replace(/[\(\[]?\s*(DO[JR][\s:\-\.;]*[\d\s\.\-\/]+)\s*[\)\]]?/gi, '');
  text = text.replace(/[\(\)\[\]]/g, '');
  text = text.replace(/\s+/g, ' ').replace(/^[\s\-:;,]+|[\s\-:;,]+$/g, '');
  // Fix "Dr.Name" -> "Dr. Name"
  text = text.replace(/^(Dr|Mr|Ms|Mrs|Prof)\.([A-Za-z])/i, '$1. $2');
  return text.trim();
}

// Helper: Parse Date of Joining
function parseDOJ(raw) {
  const text = String(raw || '').trim();
  const m = text.match(/[\(\[]?\s*(DO[JR][\s:\-\.;]*[\d\s\.\-\/]+)\s*[\)\]]?/i);
  if (!m) return { dojStr: '', dojDate: null };

  const rawDateSection = m[1];
  const dateMatch = rawDateSection.match(/(\d{1,2})[\s\.\-\/]+(\d{1,2})[\s\.\-\/]+(\d{2,4})/);
  if (!dateMatch) return { dojStr: '', dojDate: null };

  const day = parseInt(dateMatch[1], 10);
  const month = parseInt(dateMatch[2], 10);
  let year = parseInt(dateMatch[3], 10);

  if (year < 100) {
    year = year < 50 ? 2000 + year : 1900 + year;
  }

  // Check valid date
  const dt = new Date(year, month - 1, day);
  if (isNaN(dt.getTime())) {
    const formatted = `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`;
    return { dojStr: formatted, dojDate: null };
  }

  const formatted = `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`;
  return { dojStr: formatted, dojDate: dt };
}

// Helper: Determine Hierarchy Tier and Label
function getHierarchy(designation) {
  const d = String(designation || '').toLowerCase().trim();

  // Tier 1: Principal
  if (d.includes('principal') && !d.includes('vice')) {
    return { tier: 1, label: 'Principal' };
  }
  // Tier 2: Vice Principal
  if (d.includes('vice principal')) {
    return { tier: 2, label: 'Vice Principal' };
  }
  // Tier 3: Deans
  if (d.includes('dean') && !d.includes('associate dean') && !d.includes('dy')) {
    return { tier: 3, label: 'Dean' };
  }
  // Tier 4: Associate Deans
  if (d.includes('associate dean')) {
    return { tier: 4, label: 'Associate Dean' };
  }
  // Tier 5: Head of Department (HOD)
  if ((d.includes('hod') || d.includes('head of department') || d.includes('i/c. hod') || d.includes('officiating hod')) &&
      !d.includes('deputy') && !d.includes('dy')) {
    return { tier: 5, label: 'Head of Department' };
  }
  // Tier 6: Deputy HOD / Leads / CoE / Activity Head
  if (d.includes('deputy hod') || d.includes('dy. hod') || d.includes('dy.hod') || d.includes('dy hod') ||
      d.includes('activity head') || d.includes('controller of examination') || d.includes('tpo')) {
    return { tier: 6, label: 'Deputy HOD / Lead' };
  }
  // Tier 7: Full Professor
  if (d.includes('professor') && !d.includes('associate') && !d.includes('assistant')) {
    return { tier: 7, label: 'Professor' };
  }
  // Tier 8: Associate Professor
  if (d.includes('associate professor') || d.includes('associate prof') || (d.includes('associate') && !d.includes('dean'))) {
    return { tier: 8, label: 'Associate Professor' };
  }
  // Tier 9: Assistant Professor & Coordinators
  if (d.includes('assistant professor') || d.includes('assistant prof') || d.includes('coordinator') || d.includes('assistant')) {
    return { tier: 9, label: 'Assistant Professor' };
  }
  // Tier 10: Lecturer / Industry Trainer / Instructor
  if (d.includes('lecturer') || d.includes('lecture') || d.includes('leturer') || d.includes('trainer')) {
    return { tier: 10, label: 'Lecturer' };
  }
  // Tier 11: Academic / Support Staff
  return { tier: 11, label: 'Academic Staff' };
}

// Helper: Standardize Department Name
function standardizeDepartment(dept) {
  const d = String(dept || '').trim();
  const upper = d.toUpperCase();

  if (upper.includes('ELECTRONICS & TELECOMMUNICATION')) {
    return 'Electronics & Telecommunication Engineering';
  }
  if (upper.includes('ELECTRONICS AND COMPUTER SCIENCE') || upper.includes('E&CS')) {
    return 'Electronics and Computer Science';
  }
  if (upper.includes('COMPUTER ENGINEERING')) {
    return 'Computer Engineering';
  }
  if (upper.includes('INFORMATION TECHNOLOGY')) {
    return 'Information Technology';
  }
  if (upper.includes('MECHANICAL & MECHATRONICS') || upper.includes('ADDITIVE')) {
    return 'Mechanical & Mechatronics Engineering (Additive Manufacturing)';
  }
  if (upper.includes('MECHANICAL ENGINEERING')) {
    return 'Mechanical Engineering';
  }
  if (upper.includes('CIVIL ENGINEERING')) {
    return 'Civil Engineering';
  }
  if (upper.includes('HUMANITIES') || upper.includes('SCIENCE & HUMANITIES') || upper.includes('ES&H')) {
    return 'Engineering Sciences and Humanities';
  }
  if (upper.includes('ARTIFICIAL INTELLIGENCE & DATA SCIENCE') || upper.includes('AI&DS')) {
    return 'Artificial Intelligence & Data Science';
  }
  if (upper.includes('ARTIFICIAL INTELLIGENCE & MACHINE LEARNING') || upper.includes('AI&ML')) {
    return 'Artificial Intelligence & Machine Learning';
  }
  if (upper.includes('CYBER SECURITY')) {
    return 'Computer Science & Engineering (Cyber Security)';
  }
  if (upper.includes('IOT')) {
    return 'Computer Science & Engineering (IoT)';
  }
  if (upper === 'BCA / MCA') return 'BCA / MCA';
  if (upper === 'BCA') return 'BCA';
  if (upper === 'MBA / BBA') return 'MBA / BBA';
  if (upper === 'MBA') return 'MBA';
  if (upper === 'BBA') return 'BBA';
  if (upper.includes('B.VOC')) return 'B.Voc';

  return d;
}

// Clean designation string (fix typos like 'Leturer', duplicate commas, etc.)
function cleanDesignation(desig) {
  let d = String(desig || 'Assistant Professor').trim();
  d = d.replace(/\bLeturer\b/gi, 'Lecturer');
  d = d.replace(/\bLecture\b/gi, 'Lecturer');
  d = d.replace(/,\s*,+/g, ',');
  d = d.replace(/\s*,\s*/g, ', ');
  d = d.replace(/\s*;\s*/g, '; ');
  d = d.replace(/\s+/g, ' ');
  return d.replace(/^[\s,;]+|[\s,;]+$/g, '');
}

// Helper: Parse CSV Line
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) {
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
    console.log('=== TCET Faculty Database Hierarchy & Seniority Import ===\n');
    await connectDB();

    // Clean up any bogus header document if previously imported
    await Faculty.deleteMany({
      $or: [
        { department: 'Department' },
        { designation: 'Designation' },
        { name: /Name of Faculty Members/i }
      ]
    });

    // 1. Drop old non-sparse index on email if exists
    await Faculty.collection.dropIndex('email_1').catch(() => {});

    // 2. Locate Staff List Excel file
    const potentialExcelPaths = [
      path.join(__dirname, '../../Staff List - 02.09.2026.xls'),
      path.join(__dirname, '../Staff List - 02.09.2026.xls'),
      path.join(__dirname, './Staff List - 02.09.2026.xls')
    ];
    let excelPath = potentialExcelPaths.find(p => fs.existsSync(p));
    if (!excelPath) {
      throw new Error(`Excel file 'Staff List - 02.09.2026.xls' not found.`);
    }
    console.log(`Loading Excel from: ${excelPath}`);

    // 3. Load previously known specializations from tcet_faculty.csv if present
    const potentialCsvPaths = [
      path.join(__dirname, '../../tcet_faculty.csv'),
      path.join(__dirname, '../tcet_faculty.csv'),
      path.join(__dirname, './tcet_faculty.csv')
    ];
    const csvPath = potentialCsvPaths.find(p => fs.existsSync(p));
    const specializationMap = new Map(); // normName -> specialization
    if (csvPath) {
      console.log(`Found previous CSV at: ${csvPath} (reading specializations...)`);
      const csvContent = fs.readFileSync(csvPath, 'utf8');
      const lines = csvContent.split(/\r?\n/).filter(l => l.trim() !== '');
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length >= 4 && cols[3]) {
          const rawName = cols[0];
          const spec = cols[3].trim();
          if (spec) {
            specializationMap.set(normalizeName(rawName), spec);
          }
        }
      }
      console.log(`Loaded ${specializationMap.size} specializations from CSV.`);
    }

    // 4. Read Excel Workbook
    const workbook = xlsx.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    if (!rawData || rawData.length <= 3) {
      throw new Error('No data rows found in Excel sheet.');
    }

    // Row 0: TCET, Row 1: List of Faculty Members, Row 2: Header (Sr. No., Name..., Designation, Department)
    // Row 3 onwards is actual faculty data
    const dataRows = rawData.slice(3);
    console.log(`Found ${dataRows.length} faculty rows in Excel sheet '${sheetName}'.`);

    // Parse each faculty entry
    const parsedFaculty = [];
    for (const row of dataRows) {
      const srNo = parseInt(row[0], 10);
      const rawNameDoj = row[1];
      const rawDesignation = row[2];
      const rawDepartment = row[3];

      if (!rawNameDoj || !rawDepartment) continue;

      // Skip accidental header line
      if (String(rawNameDoj).includes('Name of Faculty Members') || String(rawDepartment).trim() === 'Department') {
        continue;
      }

      const name = cleanFacultyName(rawNameDoj);
      const { dojStr, dojDate } = parseDOJ(rawNameDoj);
      const designation = cleanDesignation(rawDesignation);
      const department = standardizeDepartment(rawDepartment);
      const { tier, label } = getHierarchy(designation);

      // Check specialization from CSV
      const normN = normalizeName(name);
      let specialization = specializationMap.get(normN) || '';

      parsedFaculty.push({
        srNo: isNaN(srNo) ? 999 : srNo,
        name,
        rawNameDoj,
        designation,
        department,
        doj: dojStr,
        dojDate,
        hierarchyTier: tier,
        hierarchyLabel: label,
        specialization
      });
    }

    console.log(`Successfully parsed ${parsedFaculty.length} valid faculty members.`);

    // 5. Calculate College-Wide Seniority Order:
    // Sorted by:
    //   1. hierarchyTier ASC (1: Principal -> 11: Academic Staff)
    //   2. dojDate ASC (Earliest date = higher seniority). If no dojDate, put at end of tier.
    //   3. srNo ASC (Original order as tie-breaker)
    parsedFaculty.sort((a, b) => {
      if (a.hierarchyTier !== b.hierarchyTier) {
        return a.hierarchyTier - b.hierarchyTier;
      }
      const timeA = a.dojDate ? a.dojDate.getTime() : 9999999999999;
      const timeB = b.dojDate ? b.dojDate.getTime() : 9999999999999;
      if (timeA !== timeB) {
        return timeA - timeB;
      }
      return a.srNo - b.srNo;
    });

    // Assign overall seniorityOrder (1 to N)
    parsedFaculty.forEach((f, idx) => {
      f.seniorityOrder = idx + 1;
    });

    // 6. Calculate Department-Wise Seniority Order:
    const departmentGroups = new Map();
    for (const f of parsedFaculty) {
      if (!departmentGroups.has(f.department)) {
        departmentGroups.set(f.department, []);
      }
      departmentGroups.get(f.department).push(f);
    }

    for (const [dept, list] of departmentGroups.entries()) {
      list.sort((a, b) => {
        if (a.hierarchyTier !== b.hierarchyTier) {
          return a.hierarchyTier - b.hierarchyTier;
        }
        const timeA = a.dojDate ? a.dojDate.getTime() : 9999999999999;
        const timeB = b.dojDate ? b.dojDate.getTime() : 9999999999999;
        if (timeA !== timeB) {
          return timeA - timeB;
        }
        return a.srNo - b.srNo;
      });
      list.forEach((f, idx) => {
        f.deptSeniorityOrder = idx + 1;
      });
    }

    // 7. Load all existing faculty from MongoDB to merge and preserve credentials
    const existingFacultyList = await Faculty.find({}).lean();
    console.log(`\nCurrently in MongoDB: ${existingFacultyList.length} faculty records.`);

    // Group existing records by normalized name
    // Priority given to documents with email/password or referenced in BorrowRecord!
    const activeBorrowRecords = await BorrowRecord.find({ facultyMentor: { $exists: true } }).select('facultyMentor').lean();
    const borrowedFacultyIds = new Set(activeBorrowRecords.map(b => String(b.facultyMentor)));

    // Categorize existing documents:
    // Sort so records with credentials or borrow records come first!
    existingFacultyList.sort((a, b) => {
      const aScore = (a.email ? 4 : 0) + (a.password ? 2 : 0) + (borrowedFacultyIds.has(String(a._id)) ? 8 : 0);
      const bScore = (b.email ? 4 : 0) + (b.password ? 2 : 0) + (borrowedFacultyIds.has(String(b._id)) ? 8 : 0);
      return bScore - aScore; // highest score first
    });

    const credentialedList = existingFacultyList.filter(ef => ef.email || ef.password || borrowedFacultyIds.has(String(ef._id)));

    // Build lookup maps
    const existingByNorm = new Map();
    const allExistingNormMap = new Map(); // norm -> array of all matching existing docs
    for (const ef of existingFacultyList) {
      const norm = normalizeName(ef.name);
      if (!existingByNorm.has(norm)) {
        existingByNorm.set(norm, ef); // stores the highest-scored document!
      }
      if (!allExistingNormMap.has(norm)) {
        allExistingNormMap.set(norm, []);
      }
      allExistingNormMap.get(norm).push(ef);
    }

    // Special fuzzy helper to match names, always prioritizing credentialed accounts
    function findExistingMatch(name) {
      const norm = normalizeName(name);

      // 1. Check credentialed accounts first (critical for logins and borrow records)
      for (const ef of credentialedList) {
        const eNorm = normalizeName(ef.name);
        if (norm === eNorm) return ef;
        if (norm.includes('vinit') && norm.includes('dong') && eNorm.includes('vinit') && eNorm.includes('dong')) {
          return ef;
        }
        if (norm.includes('lochan') && norm.includes('jolly') && eNorm.includes('lochan') && eNorm.includes('jolly')) {
          return ef;
        }
        if (norm.includes('payel') && norm.includes('saha') && eNorm.includes('payel') && eNorm.includes('saha')) {
          return ef;
        }
        if (norm.includes('prachi') && norm.includes('janrao') && eNorm.includes('prachi') && eNorm.includes('janrao')) {
          return ef;
        }
        if (norm.includes('birje') && eNorm.includes('birje')) {
          return ef;
        }
      }

      // 2. Check general existing map
      if (existingByNorm.has(norm)) return existingByNorm.get(norm);

      // 3. Check general fuzzy match
      for (const [eNorm, ef] of existingByNorm.entries()) {
        if (eNorm.length > 5 && (norm.includes(eNorm) || eNorm.includes(norm))) {
          return ef;
        }
      }
      return null;
    }

    let updatedCount = 0;
    let createdCount = 0;
    let preservedCredentialsCount = 0;
    const handledExistingIds = new Set();
    const duplicateIdsToDelete = new Set();

    console.log('\nUpserting faculty records into MongoDB...');

    for (const f of parsedFaculty) {
      const existing = findExistingMatch(f.name);

      const updateDoc = {
        name: f.name,
        designation: f.designation,
        department: f.department,
        srNo: f.srNo,
        doj: f.doj,
        dojDate: f.dojDate,
        hierarchyTier: f.hierarchyTier,
        hierarchyLabel: f.hierarchyLabel,
        seniorityOrder: f.seniorityOrder,
        deptSeniorityOrder: f.deptSeniorityOrder,
        role: 'faculty'
      };

      // Preserve existing specialization if not present in CSV
      if (!f.specialization && existing && existing.specialization) {
        updateDoc.specialization = existing.specialization;
      } else if (f.specialization) {
        updateDoc.specialization = f.specialization;
      }

      if (existing) {
        handledExistingIds.add(String(existing._id));
        updatedCount++;

        // Preserve credentials and contact details
        if (existing.email) {
          updateDoc.email = existing.email;
          preservedCredentialsCount++;
        }
        if (existing.password) updateDoc.password = existing.password;
        if (existing.contactNumber) updateDoc.contactNumber = existing.contactNumber;
        if (existing.assignedDivisions && existing.assignedDivisions.length > 0) {
          updateDoc.assignedDivisions = existing.assignedDivisions;
        }

        await Faculty.findByIdAndUpdate(existing._id, { $set: updateDoc }, { new: true });

        // If there were other duplicate documents for this name that have NO credentials and NO borrow records, mark for removal
        const allDuplicates = allExistingNormMap.get(normalizeName(existing.name)) || [];
        for (const dup of allDuplicates) {
          if (String(dup._id) !== String(existing._id)) {
            if (!dup.email && !dup.password && !borrowedFacultyIds.has(String(dup._id))) {
              duplicateIdsToDelete.add(String(dup._id));
            }
          }
        }
      } else {
        createdCount++;
        // Do not set email to empty string, leave undefined for sparse index
        await Faculty.create(updateDoc);
      }
    }

    // Clean up unneeded duplicates that were replaced by the primary credentialed account
    if (duplicateIdsToDelete.size > 0) {
      console.log(`Removing ${duplicateIdsToDelete.size} uncredentialed duplicate records...`);
      for (const dupId of duplicateIdsToDelete) {
        await Faculty.findByIdAndDelete(dupId);
        handledExistingIds.add(dupId);
      }
    }

    // 8. Handle existing accounts that weren't in the Excel sheet (e.g. Dr. Harsh Gagrani)
    // We do NOT delete them! We retain their credentials and put them at the end of their tier.
    let retainedUnmatched = 0;
    let currentMaxSeniority = parsedFaculty.length;

    for (const ef of existingFacultyList) {
      if (!handledExistingIds.has(String(ef._id))) {
        // Keep faculty who have logins, passwords, or are referenced in borrow records
        const hasCredentials = !!(ef.email || ef.password);
        const hasBorrow = borrowedFacultyIds.has(String(ef._id));

        if (hasCredentials || hasBorrow) {
          currentMaxSeniority++;
          const { tier, label } = getHierarchy(ef.designation || 'Assistant Professor');
          await Faculty.findByIdAndUpdate(ef._id, {
            $set: {
              hierarchyTier: ef.hierarchyTier || tier,
              hierarchyLabel: ef.hierarchyLabel || label,
              seniorityOrder: currentMaxSeniority,
              deptSeniorityOrder: 999
            }
          });
          retainedUnmatched++;
          console.log(`- Retained active account not in Excel: ${ef.name} (${ef.email || 'no-email'}) as Seniority #${currentMaxSeniority}`);
        } else {
          // Remove outdated partial scrape duplicate that has no credentials or borrow records
          await Faculty.findByIdAndDelete(ef._id);
        }
      }
    }

    const totalFinal = await Faculty.countDocuments();

    console.log('\n=============================================');
    console.log('🎉 FACULTY IMPORT & SENIORITY RANKING COMPLETE');
    console.log('=============================================');
    console.log(`Total Faculty in Database: ${totalFinal}`);
    console.log(`- Updated Existing: ${updatedCount}`);
    console.log(`- Created New: ${createdCount}`);
    console.log(`- Removed Duplicate Uncredentialed: ${duplicateIdsToDelete.size}`);
    console.log(`- Retained Extra Accounts (with credentials/borrows): ${retainedUnmatched}`);
    console.log(`- Total Active Logins Preserved: ${preservedCredentialsCount + retainedUnmatched}`);

    // Verification check on top 15 college hierarchy
    console.log('\n--- Top 15 Faculty by Seniority Hierarchy ---');
    const topFaculty = await Faculty.find({})
      .sort({ seniorityOrder: 1 })
      .limit(15)
      .lean();

    topFaculty.forEach(f => {
      console.log(`Rank #${String(f.seniorityOrder).padStart(2, ' ')} | [Tier ${f.hierarchyTier}: ${f.hierarchyLabel.padEnd(20, ' ')}] ${f.name.padEnd(28, ' ')} | DOJ: ${f.doj ? f.doj.padEnd(10, ' ') : 'N/A       '} | Email: ${f.email || '-'} | Dept: ${f.department}`);
    });

    console.log('\n--- Department Counts Breakdown ---');
    const deptsSummary = await Faculty.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    console.table(deptsSummary.map(d => ({ Department: d._id, FacultyCount: d.count })));

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Import failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
};

importFaculty();
