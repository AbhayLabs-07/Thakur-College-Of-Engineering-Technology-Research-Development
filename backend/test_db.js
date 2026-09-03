import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

try {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 3000 });
  console.log('MongoDB Connected successfully!\n');
  const Faculty = (await import('./models/Faculty.js')).default;
  const BorrowRecord = (await import('./models/BorrowRecord.js')).default;

  const count = await Faculty.countDocuments();
  console.log(`Total Faculty in DB: ${count}`);

  console.log('\nTop 10 Faculty by Seniority Hierarchy:');
  const top10 = await Faculty.find({}).sort({ seniorityOrder: 1 }).limit(10).lean();
  top10.forEach(f => {
    console.log(`- #${String(f.seniorityOrder).padStart(2, ' ')} [Tier ${f.hierarchyTier}: ${f.hierarchyLabel}] ${f.name} | DOJ: ${f.doj} | Dept: ${f.department}`);
  });

  console.log('\nActive Logins:');
  const active = await Faculty.find({ email: { $exists: true, $ne: null } }).sort({ seniorityOrder: 1 }).lean();
  active.forEach(a => {
    console.log(`- #${String(a.seniorityOrder).padStart(3, ' ')} ${a.name} (${a.email}) | Pass: ${!!a.password}`);
  });

  console.log('\nActive Borrow Records:');
  const borrows = await BorrowRecord.find({}).populate('facultyMentor').lean();
  borrows.forEach(b => {
    console.log(`- Record ${b._id}: mentor=${b.facultyMentor?.name} (${b.facultyMentor?._id}), status=${b.status}`);
  });
} catch (err) {
  console.error('Connection failed:', err.message);
} finally {
  await mongoose.connection.close();
  process.exit(0);
}
