import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_inventory');
const Faculty = (await import('./models/Faculty.js')).default;
const BorrowRecord = (await import('./models/BorrowRecord.js')).default;

const withEmail = await Faculty.find({ email: { $exists: true, $ne: null } }).lean();
console.log('Faculties with email/password:');
for (const f of withEmail) {
  console.log(`- ${f._id}: ${f.name} | ${f.email} | ${f.department} | ${f.designation}`);
}

const borrow = await BorrowRecord.find({}).populate('facultyMentor').lean();
console.log('\nBorrow records:');
for (const b of borrow) {
  console.log(`- Record ${b._id}: student=${b.student}, mentor=${b.facultyMentor?.name} (${b.facultyMentor?._id}), status=${b.status}`);
}

await mongoose.connection.close();
