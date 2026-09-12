import nodemailer from 'nodemailer';

/**
 * Parses and returns active SMTP and email configuration from environment
 */
export const getSmtpConfig = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const rawUser = process.env.SMTP_USER || process.env.EMAIL_USER || '';
  const rawPass = process.env.SMTP_PASS || process.env.EMAIL_PASS || '';

  // Clean any accidental surrounding quotes or stray whitespace from environment variables
  const user = rawUser.trim().replace(/^["']|["']$/g, '');
  const pass = rawPass.trim().replace(/^["']|["']$/g, '');

  const isGmail = Boolean(
    (host && host.includes('gmail')) ||
    (process.env.EMAIL_SERVICE && process.env.EMAIL_SERVICE.toLowerCase() === 'gmail') ||
    user.toLowerCase().endsWith('@gmail.com')
  );

  const service = isGmail ? 'gmail' : (process.env.EMAIL_SERVICE || (!host ? 'gmail' : undefined));
  const from = process.env.SMTP_FROM || `"TCET R&D Cell" <${user || 'noreply@tcetmumbai.in'}>`;

  const isConfigured = Boolean(user && pass && pass !== 'mockpassword123');

  return {
    host: host || (service ? `${service} (service)` : 'smtp.gmail.com'),
    port,
    secure,
    user,
    pass,
    service,
    isGmail,
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

  // If live credentials are provided, construct the live transport
  if (config.isConfigured) {
    // For Gmail accounts, nodemailer's built-in 'gmail' service utilizes direct TLS on port 465,
    // which bypasses AWS Lambda / Vercel serverless STARTTLS port 587 throttling.
    if (config.isGmail) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.user,
          pass: config.pass.replace(/\s+/g, '') // Strip spaces in 16-char App Password
        }
      });
    }

    if (process.env.SMTP_HOST) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.user,
          pass: config.pass
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    }

    // Default fallback to service
    return nodemailer.createTransport({
      service: config.service || 'gmail',
      auth: {
        user: config.user,
        pass: config.pass.replace(/\s+/g, '')
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
      message: `Successfully connected to SMTP mail server (${config.host || config.service})`,
      config: {
        host: config.host,
        port: config.port,
        user: config.user,
        secure: config.secure
      }
    };
  } catch (error) {
    console.error('[SMTP Verification Error]:', error);
    let friendlyMessage = error.message || 'Failed to authenticate with SMTP mail server';
    
    if (error.code === 'EAUTH' || (error.message && error.message.includes('535'))) {
      friendlyMessage = 'Google Authentication Failed (535): Invalid username or App Password. Check that your Vercel Environment Variable `SMTP_PASS` is set to the valid 16-character App Password (e.g. knod ubrf osah iqil) without quotes.';
    } else if (error.code === 'ESOCKET' || error.code === 'ETIMEDOUT' || error.code === 'ECONNECTION') {
      friendlyMessage = `Network connection timed out (${error.code || 'TIMEOUT'}) reaching mail server.`;
    }

    return {
      connected: false,
      mode: 'error',
      message: friendlyMessage,
      code: error.code || 'ECONNECTION',
      rawError: error.message,
      config: {
        host: config.host,
        port: config.port,
        user: config.user ? `${config.user.slice(0, 3)}***` : 'Not Configured'
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
