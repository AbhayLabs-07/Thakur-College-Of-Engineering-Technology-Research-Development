import nodemailer from 'nodemailer';

/**
 * Parses and returns active SMTP and email configuration from environment
 */
export const getSmtpConfig = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER || '';
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || '';
  const service = process.env.EMAIL_SERVICE || (!host ? 'gmail' : undefined);
  const from = process.env.SMTP_FROM || `"TCET R&D Cell" <${user || 'noreply@tcetmumbai.in'}>`;

  const isConfigured = Boolean(user && pass && pass !== 'mockpassword123');

  return {
    host: host || (service ? `${service} (service)` : 'smtp.gmail.com'),
    port,
    secure,
    user,
    service,
    from,
    isConfigured,
    mode: isConfigured ? 'live_smtp' : 'development_mock'
  };
};

/**
 * Creates and returns the active Nodemailer transporter
 */
export const getTransporter = () => {
  const config = getSmtpConfig();

  // If live credentials are provided, construct the live SMTP transport
  if (config.isConfigured) {
    if (process.env.SMTP_HOST) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.user,
          pass: process.env.SMTP_PASS || process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        }
      });
    }

    // Default to nodemailer service (e.g. gmail)
    return nodemailer.createTransport({
      service: config.service || 'gmail',
      auth: {
        user: config.user,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS
      }
    });
  }

  // Development / Mock fallback when SMTP password is not yet configured
  return {
    isMock: true,
    verify: async () => {
      return true;
    },
    sendMail: async (options) => {
      console.log('\n--- [SMTP SERVER MOCK DISPATCH] ---');
      console.log(`From:    ${options.from || config.from}`);
      console.log(`To:      ${options.to}`);
      if (options.cc) console.log(`Cc:      ${options.cc}`);
      console.log(`Subject: ${options.subject}`);
      if (options.attachments && options.attachments.length > 0) {
        console.log(`Attached Files (${options.attachments.length}):`, options.attachments.map(a => a.filename).join(', '));
      }
      console.log(`Snippet: ${(options.text || options.html || '').substring(0, 180)}...`);
      console.log('------------------------------------\n');
      return {
        messageId: `mock-smtp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        response: '250 Mock email accepted for delivery (configure live SMTP_PASS in backend/.env for external dispatch)'
      };
    }
  };
};

/**
 * Verifies connection and handshake with the SMTP Mail Server
 */
export const verifySmtpConnection = async () => {
  const config = getSmtpConfig();
  const transporter = getTransporter();

  if (transporter.isMock) {
    return {
      connected: true,
      mode: 'development_mock',
      message: 'Running in simulated SMTP mode. Set valid SMTP_USER and SMTP_PASS in backend/.env for live internet delivery.',
      config: {
        host: config.host,
        port: config.port,
        user: config.user ? `${config.user.slice(0, 3)}***` : 'Not Configured',
        secure: config.secure
      }
    };
  }

  try {
    await transporter.verify();
    return {
      connected: true,
      mode: 'live_smtp',
      message: `Successfully connected to SMTP mail server (${config.host}:${config.port})`,
      config: {
        host: config.host,
        port: config.port,
        user: config.user,
        secure: config.secure
      }
    };
  } catch (error) {
    console.error('[SMTP Verification Error]:', error);
    return {
      connected: false,
      mode: 'error',
      message: error.message || 'Failed to authenticate with SMTP mail server',
      code: error.code || 'ECONNECTION',
      config: {
        host: config.host,
        port: config.port,
        user: config.user
      }
    };
  }
};

/**
 * Sends an email via the configured SMTP server with support for attachments and CC
 * 
 * Supports two signatures:
 * 1. sendEmail(to, subject, text, html, attachments)
 * 2. sendEmail({ to, cc, bcc, subject, text, html, attachments, from })
 */
export const sendEmail = async (param1, param2, param3, param4, param5) => {
  let mailOptions;

  if (typeof param1 === 'object' && param1 !== null && !Array.isArray(param1)) {
    mailOptions = { ...param1 };
  } else {
    mailOptions = {
      to: param1,
      subject: param2,
      text: param3,
      html: param4,
      attachments: param5 || []
    };
  }

  const config = getSmtpConfig();
  if (!mailOptions.from) {
    mailOptions.from = config.from;
  }

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP Mailer] Email dispatched successfully: ${info.messageId} to ${mailOptions.to}`);
    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
      recipient: mailOptions.to
    };
  } catch (error) {
    console.error(`[SMTP Mailer Error] Failed sending to ${mailOptions.to}:`, error.message);
    return {
      success: false,
      error: error.message,
      code: error.code,
      recipient: mailOptions.to
    };
  }
};

export default {
  getSmtpConfig,
  getTransporter,
  verifySmtpConnection,
  sendEmail
};
