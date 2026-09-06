import cron from 'node-cron';
import BorrowRecord from '../models/BorrowRecord.js';
import { sendEmail } from '../utils/mailer.js';

/**
 * Scans for overdue borrow records and dispatches official institutional reminders
 * @param {Object} options
 * @param {boolean} options.dryRun If true, computes metrics without dispatching real emails
 * @param {boolean} options.notifyMentor If true, CCs the faculty mentor
 * @returns {Promise<Object>} Scan report and metrics
 */
export const runOverdueScan = async ({ dryRun = false, notifyMentor = true } = {}) => {
  const scanTimestamp = new Date();
  console.log(`[SMTP Overdue Engine] Starting scan at ${scanTimestamp.toISOString()} (dryRun: ${dryRun})...`);

  try {
    const today = new Date();
    
    // Query active hardware checkouts past their return due date
    const overdueRecords = await BorrowRecord.find({
      status: 'handed_out',
      dueDate: { $lt: today }
    })
      .populate('student', 'name email erpId branch division year rollNo contactNumber')
      .populate('facultyMentor', 'name email department designation')
      .populate('cartItems.component', 'name category specs');

    const totalOverdue = overdueRecords.length;
    console.log(`[SMTP Overdue Engine] Identified ${totalOverdue} overdue hardware loan(s).`);

    if (totalOverdue === 0) {
      return {
        timestamp: scanTimestamp.toISOString(),
        scannedRecords: await BorrowRecord.countDocuments({ status: 'handed_out' }),
        overdueCount: 0,
        emailsSent: 0,
        status: 'Compliant (All Green)',
        message: 'No overdue checkouts found. System hardware loan register is 100% compliant.',
        details: []
      };
    }

    const results = [];
    let sentCount = 0;

    for (const record of overdueRecords) {
      const student = record.student;
      if (!student || !student.email) {
        results.push({
          recordId: record._id,
          projectTitle: record.projectTitle,
          status: 'skipped',
          reason: 'Missing student profile or valid institutional email'
        });
        continue;
      }

      // Calculate days overdue
      const dueDateTime = new Date(record.dueDate).getTime();
      const diffTime = Math.max(0, today.getTime() - dueDateTime);
      const daysOverdue = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      // Determine urgency level
      let urgencyBadge = 'Moderate Urgency';
      let urgencyColor = '#d97706'; // Amber
      if (daysOverdue >= 7) {
        urgencyBadge = 'Critical Non-Compliance (Action Required)';
        urgencyColor = '#dc2626'; // Red
      } else if (daysOverdue >= 3) {
        urgencyBadge = 'High Urgency (Return Immediately)';
        urgencyColor = '#ea580c'; // Orange
      }

      const mentorEmail = (notifyMentor && record.facultyMentor && record.facultyMentor.email) ? record.facultyMentor.email : null;
      const mentorName = record.facultyMentor?.name || 'Assigned Faculty Mentor';

      // Item listing for plaintext & HTML
      const itemsPlain = record.cartItems
        .map(item => `  • ${item.component?.name || 'Hardware Asset'} (Qty: ${item.quantity}) - Category: ${item.component?.category || 'General'}`)
        .join('\n');

      const itemsHtml = record.cartItems
        .map(item => `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 12px; font-weight: 600; color: #0f172a;">${item.component?.name || 'Hardware Asset'}</td>
            <td style="padding: 10px 12px; color: #475569;">${item.component?.category || 'General'}</td>
            <td style="padding: 10px 12px; text-align: center; font-weight: 700; color: #0b2545;">${item.quantity}</td>
          </tr>
        `).join('');

      const subject = `[URGENT: OVERDUE] Return Laboratory Hardware — TCET R&D Cell (${daysOverdue} day${daysOverdue > 1 ? 's' : ''} past due)`;

      const text = `TCET RESEARCH AND DEVELOPMENT CELL — OVERDUE HARDWARE NOTICE
Date: ${today.toLocaleDateString('en-GB')}
ERP ID: ${student.erpId || 'N/A'}
Student: ${student.name} (${student.branch || 'Engg'}, Div ${student.division || 'A'})
Project: "${record.projectTitle}"
Faculty Mentor: ${mentorName}

URGENT STATUS: Overdue by ${daysOverdue} Day${daysOverdue > 1 ? 's' : ''}
Scheduled Return Due Date: ${new Date(record.dueDate).toDateString()}

The following laboratory equipment issued to your team remains unreturned:
${itemsPlain}

INSTRUCTIONS FOR IMMEDIATE ACTION:
1. Return all listed equipment immediately to the R&D Laboratory (Room 412, TCET).
2. Operating Lab Hours: Monday – Friday (9:00 AM – 5:30 PM).
3. Ensure all components, sensors, cables, and packaging are intact for inspection.
4. Failure to return uncatalogued hardware prior to the institutional audit may result in semester grade holds and suspension of laboratory borrowing privileges.

Regards,
Ashish Mudholkar
Laboratory Administrator, TCET R&D Cell
Thakur College of Engineering and Technology, Kandivali (E), Mumbai`;

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 2px solid #0b2545; background-color: #ffffff;">
          <!-- Header -->
          <div style="background-color: #0b2545; color: #ffffff; padding: 22px 24px; border-bottom: 4px solid #e0a96d;">
            <div style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #e0a96d; font-weight: 800; margin-bottom: 4px;">
              Thakur College of Engineering & Technology
            </div>
            <h1 style="margin: 0; font-size: 19px; font-weight: 800; letter-spacing: -0.3px;">
              TCET R&D Cell — Hardware Overdue Escalation
            </h1>
            <p style="margin: 4px 0 0; font-size: 12px; color: #94a3b8;">
              Official Notice Generated on ${today.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div style="padding: 24px;">
            <!-- Urgency Alert Banner -->
            <div style="background-color: #fef2f2; border: 2px solid #fecaca; border-left: 6px solid ${urgencyColor}; padding: 14px 18px; border-radius: 4px; margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 11px; font-weight: 800; color: ${urgencyColor}; text-transform: uppercase; letter-spacing: 1px;">
                  ${urgencyBadge}
                </span>
                <span style="font-size: 13px; font-weight: 800; color: ${urgencyColor};">
                  ${daysOverdue} Day${daysOverdue > 1 ? 's' : ''} Overdue
                </span>
              </div>
              <p style="margin: 6px 0 0; font-size: 13px; color: #991b1b; line-height: 1.4;">
                Equipment checkout for project <strong>"${record.projectTitle}"</strong> was due on <strong>${new Date(record.dueDate).toLocaleDateString('en-GB', { dateStyle: 'full' })}</strong> and is now overdue.
              </p>
            </div>

            <!-- Student Metadata -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px;">
              <tr>
                <td style="padding: 8px 12px; color: #64748b; width: 35%;">Student Name:</td>
                <td style="padding: 8px 12px; font-weight: 700; color: #0f172a;">${student.name}</td>
              </tr>
              <tr style="border-top: 1px solid #e2e8f0;">
                <td style="padding: 8px 12px; color: #64748b;">ERP ID / Roll No:</td>
                <td style="padding: 8px 12px; font-weight: 600; color: #0f172a;">${student.erpId || 'N/A'} (Roll: ${student.rollNo || 'N/A'})</td>
              </tr>
              <tr style="border-top: 1px solid #e2e8f0;">
                <td style="padding: 8px 12px; color: #64748b;">Branch & Class:</td>
                <td style="padding: 8px 12px; color: #0f172a;">${student.branch || 'Engineering'}, ${student.year || 'Third Year'} (Div ${student.division || 'A'})</td>
              </tr>
              <tr style="border-top: 1px solid #e2e8f0;">
                <td style="padding: 8px 12px; color: #64748b;">Faculty Mentor:</td>
                <td style="padding: 8px 12px; color: #0f172a;">${mentorName}</td>
              </tr>
            </table>

            <!-- Itemized Table -->
            <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #0b2545; margin: 16px 0 8px;">
              Unreturned Laboratory Components
            </h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #cbd5e1; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #0b2545; color: #ffffff; text-align: left;">
                  <th style="padding: 8px 12px; font-size: 11px;">Component Name</th>
                  <th style="padding: 8px 12px; font-size: 11px;">Category</th>
                  <th style="padding: 8px 12px; font-size: 11px; text-align: center;">Qty Borrowed</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Instructions -->
            <div style="background-color: #f1f5f9; border-left: 4px solid #0b2545; padding: 12px 16px; margin: 18px 0; font-size: 12px; color: #334155; line-height: 1.5;">
              <strong style="color: #0b2545;">MANDATORY RETURN PROTOCOL:</strong>
              <ul style="margin: 6px 0 0; padding-left: 18px;">
                <li>Return all equipment to the R&D Cell Laboratory (TCET Main Campus) immediately.</li>
                <li>Lab Operating Hours: <strong>Monday to Friday, 9:00 AM – 5:30 PM</strong>.</li>
                <li>Upcoming institutional audit is active; all physical assets must be re-checked into the system.</li>
                <li>Failure to surrender equipment may lead to an administrative hold on your examination hall ticket and checkout privileges.</li>
              </ul>
            </div>

            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 22px 0;">
            <p style="font-size: 11px; color: #64748b; line-height: 1.4; margin-bottom: 0;">
              This is an automated institutional escalation dispatched via the TCET Smart Inventory SMTP Mail Engine.<br>
              <strong>Thakur College of Engineering & Technology</strong> | A-Block, Thakur Educational Campus, Shyamnarayan Thakur Marg, Thakur Village, Kandivali (E), Mumbai 400101.
            </p>
          </div>
        </div>
      `;

      let mailResponse = null;
      if (!dryRun) {
        mailResponse = await sendEmail({
          to: student.email,
          cc: mentorEmail,
          subject,
          text,
          html
        });

        // Record reminder log in borrow record notes
        const reminderNote = `[SMTP Overdue Alert Dispatched: Day ${daysOverdue} on ${today.toISOString().split('T')[0]}]`;
        record.adminNotes = record.adminNotes ? `${record.adminNotes} | ${reminderNote}` : reminderNote;
        await record.save();
        sentCount++;
      }

      results.push({
        recordId: record._id,
        studentName: student.name,
        studentEmail: student.email,
        studentErp: student.erpId,
        mentorEmail,
        projectTitle: record.projectTitle,
        daysOverdue,
        dueDate: record.dueDate,
        emailSent: !dryRun && Boolean(mailResponse?.success),
        messageId: mailResponse?.messageId || (dryRun ? 'simulated' : 'failed')
      });
    }

    return {
      timestamp: scanTimestamp.toISOString(),
      scannedRecords: overdueRecords.length,
      overdueCount: totalOverdue,
      emailsSent: sentCount,
      status: totalOverdue > 0 ? 'Overdue Loans Found' : 'Compliant',
      message: dryRun
        ? `Simulation complete: ${totalOverdue} overdue loan(s) identified.`
        : `Scan complete: Dispatched ${sentCount} overdue alert email(s) via SMTP.`,
      details: results
    };
  } catch (error) {
    console.error('[SMTP Overdue Engine Error]:', error);
    throw error;
  }
};

/**
 * Schedules daily midnight scan for overdue components
 */
export const scheduleCronJob = () => {
  // Runs once every day at 00:00 (Midnight)
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron Job] Executing scheduled daily midnight scan for overdue hardware checkouts...');
    try {
      await runOverdueScan({ dryRun: false, notifyMentor: true });
    } catch (err) {
      console.error('[Cron Job Error] Overdue scan failed:', err.message);
    }
  });

  console.log('[Cron Job] Automated daily midnight overdue scanner initialized.');
};

export default {
  runOverdueScan,
  scheduleCronJob
};
