import cron from 'node-cron';
import BorrowRecord from '../models/BorrowRecord.js';
import { sendEmail } from '../utils/mailer.js';

/**
 * Scans for overdue borrow records and sends email reminders to students
 */
export const runOverdueScan = async () => {
  console.log('[Cron Job] Starting daily scan for overdue components...');
  try {
    const today = new Date();
    
    // Find records that are handed out and overdue
    const overdueRecords = await BorrowRecord.find({
      status: 'handed_out',
      dueDate: { $lt: today }
    }).populate('student', 'name email erpId').populate('cartItems.component', 'name');

    if (overdueRecords.length === 0) {
      console.log('[Cron Job] No overdue borrow records found.');
      return;
    }

    console.log(`[Cron Job] Found ${overdueRecords.length} overdue records.`);

    for (const record of overdueRecords) {
      const student = record.student;
      if (!student || !student.email) continue;

      const itemsList = record.cartItems.map(item => `- ${item.component.name} (Qty: ${item.quantity})`).join('\n');
      
      const subject = `[URGENT] Overdue Laboratory Components — TCET R&D Cell`;
      const text = `Dear ${student.name},\n\nThis is an automated alert from the TCET Research and Development Cell. The following components borrowed by you under the project "${record.projectTitle}" were due on ${new Date(record.dueDate).toDateString()} and are now overdue:\n\n${itemsList}\n\nPlease return these components to the R&D lab immediately to avoid penalties and account suspension.\n\nRegards,\nResearch and Development Cell\nThakur College of Engineering and Technology`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; border: 2px solid #0b2545; padding: 20px; max-width: 600px;">
          <h2 style="color: #0b2545; border-bottom: 2px solid #e0a96d; padding-bottom: 10px; margin-top: 0;">TCET R&D Cell — Overdue Alert</h2>
          <p>Dear <strong>${student.name}</strong> (ERP ID: ${student.erpId}),</p>
          <p>This is an automated alert regarding your borrowed laboratory hardware. The following components for your project <strong>"${record.projectTitle}"</strong> are past their return due date:</p>
          
          <div style="background-color: #f8f9fa; border-left: 4px solid #dc3545; padding: 15px; margin: 15px 0;">
            <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
              ${record.cartItems.map(item => `<li><strong>${item.component.name}</strong> - Quantity: ${item.quantity}</li>`).join('')}
            </ul>
          </div>

          <p><strong>Original Due Date:</strong> <span style="color: #dc3545; font-weight: bold;">${new Date(record.dueDate).toDateString()}</span></p>
          <p>Please return these components to the R&D Laboratory immediately to allow other students to check them out and to prevent suspension of checkout privileges.</p>
          
          <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #777; margin-bottom: 0;">This is an automated institutional message. Please do not reply directly to this email.</p>
        </div>
      `;

      await sendEmail(student.email, subject, text, html);
      console.log(`[Cron Job] Sent overdue email warning to ${student.name} (${student.email})`);
    }
  } catch (error) {
    console.error('[Cron Job Error] Failed to complete scan:', error.message);
  }
};

// Schedule the job: Runs once a day at midnight (0 0 * * *)
export const scheduleCronJob = () => {
  cron.schedule('0 0 * * *', () => {
    runOverdueScan();
  });
  console.log('[Cron Job] Scheduled daily overdue checkouts scan at midnight.');
};
