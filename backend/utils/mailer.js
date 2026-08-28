import nodemailer from 'nodemailer';

// Create a transporter
const getTransporter = () => {
  // If we have SMTP configuration in environment
  if (process.env.EMAIL_USER && process.env.EMAIL_USER !== 'rndcelltcet@gmail.com') {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  // Fallback: Console logging mock transport (useful for development)
  return {
    sendMail: async (options) => {
      console.log('--- MOCK EMAIL SENT ---');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Body: ${options.text || options.html}`);
      console.log('-----------------------');
      return { messageId: 'mock-id-12345' };
    }
  };
};

/**
 * Sends an email alert
 * @param {string} to 
 * @param {string} subject 
 * @param {string} text 
 * @param {string} html 
 */
export const sendEmail = async (to, subject, text, html) => {
  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: `"TCET R&D Cell" <${process.env.EMAIL_USER || 'noreply@tcetmumbai.in'}>`,
      to,
      subject,
      text,
      html
    });
    console.log(`Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error.message);
    // Do not throw error so backend doesn't crash on email failures
    return null;
  }
};
