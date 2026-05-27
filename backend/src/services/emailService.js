// backend/src/services/emailService.js
import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

// Email transporter configuration
const createTransporter = () => {
  // For development/testing with ethereal.email (fake SMTP)
  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
    return nodemailer.createTestAccount().then(testAccount => {
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    });
  }

  // For production with real SMTP
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send email function
const sendEmail = async (to, subject, html, text = null) => {
  try {
    let transporter;
    
    if (process.env.EMAIL_USER) {
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    } else {
      // Use ethereal for testing
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const mailOptions = {
      from: `"Lavender Notes" <${process.env.EMAIL_FROM || 'noreply@lavendernotes.com'}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Log preview URL for ethereal emails
    if (info.messageId && info.previewUrl) {
      logger.info(`Email sent: ${info.previewUrl}`);
      console.log(`📧 Email preview: ${info.previewUrl}`);
    }
    
    logger.info(`Email sent to ${to}: ${subject}`);
    return { success: true, messageId: info.messageId, previewUrl: info.previewUrl };
  } catch (error) {
    logger.error(`Email sending failed to ${to}:`, error.message);
    console.error('❌ Email error:', error);
    return { success: false, error: error.message };
  }
};

// Send OTP for email verification
export const sendVerificationEmail = async (email, name, otp) => {
  const subject = 'Verify Your Email - Lavender Notes';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background: linear-gradient(135deg, #fdf7ff 0%, #f3e8ff 100%);
        }
        .card {
          background: white;
          border-radius: 16px;
          padding: 40px 30px;
          box-shadow: 0 4px 20px rgba(167, 139, 250, 0.1);
          text-align: center;
        }
        .logo {
          font-size: 48px;
          margin-bottom: 20px;
        }
        h1 {
          color: #674bb5;
          font-size: 28px;
          margin-bottom: 10px;
        }
        .greeting {
          font-size: 18px;
          color: #494552;
          margin-bottom: 20px;
        }
        .otp-code {
          font-size: 48px;
          font-weight: bold;
          letter-spacing: 8px;
          color: #a78bfa;
          background: #f8f1fb;
          padding: 20px;
          border-radius: 12px;
          margin: 30px 0;
          font-family: monospace;
        }
        .message {
          color: #494552;
          margin-bottom: 30px;
        }
        .expiry {
          font-size: 12px;
          color: #7a7583;
          margin-top: 20px;
        }
        .footer {
          margin-top: 30px;
          font-size: 12px;
          color: #7a7583;
          text-align: center;
        }
        button {
          background: #a78bfa;
          color: #3c1989;
          border: none;
          padding: 12px 30px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="logo">📝</div>
          <h1>Lavender Notes</h1>
          <div class="greeting">Hello ${name || 'there'}!</div>
          <div class="message">
            Thank you for signing up! Please use the verification code below to complete your registration.
          </div>
          <div class="otp-code">${otp}</div>
          <div class="message">
            This code will expire in <strong>10 minutes</strong>.
          </div>
          <div class="expiry">
            If you didn't create an account with Lavender Notes, please ignore this email.
          </div>
        </div>
        <div class="footer">
          &copy; 2024 Lavender Notes. All rights reserved.<br>
          Your digital zen workspace.
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(email, subject, html);
};

// Send OTP for password reset
export const sendPasswordResetEmail = async (email, name, otp) => {
  const subject = 'Reset Your Password - Lavender Notes';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background: linear-gradient(135deg, #fdf7ff 0%, #f3e8ff 100%);
        }
        .card {
          background: white;
          border-radius: 16px;
          padding: 40px 30px;
          box-shadow: 0 4px 20px rgba(167, 139, 250, 0.1);
          text-align: center;
        }
        .logo {
          font-size: 48px;
          margin-bottom: 20px;
        }
        h1 {
          color: #674bb5;
          font-size: 28px;
          margin-bottom: 10px;
        }
        .greeting {
          font-size: 18px;
          color: #494552;
          margin-bottom: 20px;
        }
        .warning {
          background: #fff3e0;
          color: #e67e22;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
        }
        .otp-code {
          font-size: 48px;
          font-weight: bold;
          letter-spacing: 8px;
          color: #a78bfa;
          background: #f8f1fb;
          padding: 20px;
          border-radius: 12px;
          margin: 30px 0;
          font-family: monospace;
        }
        .message {
          color: #494552;
          margin-bottom: 30px;
        }
        .expiry {
          font-size: 12px;
          color: #7a7583;
          margin-top: 20px;
        }
        .footer {
          margin-top: 30px;
          font-size: 12px;
          color: #7a7583;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="logo">🔐</div>
          <h1>Reset Your Password</h1>
          <div class="greeting">Hello ${name || 'there'}!</div>
          <div class="warning">
            ⚠️ You requested to reset your password. If you didn't make this request, please ignore this email.
          </div>
          <div class="message">
            Use the verification code below to reset your password:
          </div>
          <div class="otp-code">${otp}</div>
          <div class="message">
            This code will expire in <strong>10 minutes</strong>.
          </div>
          <div class="expiry">
            For security reasons, never share this code with anyone.
          </div>
        </div>
        <div class="footer">
          &copy; 2024 Lavender Notes. All rights reserved.<br>
          Your digital zen workspace.
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(email, subject, html);
};

// Send welcome email after verification
export const sendWelcomeEmail = async (email, name) => {
  const subject = 'Welcome to Lavender Notes! 🎉';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Lavender Notes</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background: linear-gradient(135deg, #fdf7ff 0%, #f3e8ff 100%);
        }
        .card {
          background: white;
          border-radius: 16px;
          padding: 40px 30px;
          box-shadow: 0 4px 20px rgba(167, 139, 250, 0.1);
          text-align: center;
        }
        .logo {
          font-size: 48px;
          margin-bottom: 20px;
        }
        h1 {
          color: #674bb5;
          font-size: 28px;
          margin-bottom: 10px;
        }
        .greeting {
          font-size: 18px;
          color: #494552;
          margin-bottom: 20px;
        }
        .message {
          color: #494552;
          margin-bottom: 20px;
        }
        .feature-list {
          text-align: left;
          margin: 30px 0;
          padding-left: 20px;
        }
        .feature-list li {
          margin-bottom: 10px;
          color: #494552;
        }
        .button {
          background: #a78bfa;
          color: #3c1989;
          text-decoration: none;
          padding: 12px 30px;
          border-radius: 8px;
          font-weight: 600;
          display: inline-block;
          margin-top: 20px;
        }
        .footer {
          margin-top: 30px;
          font-size: 12px;
          color: #7a7583;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="logo">🎉</div>
          <h1>Welcome to Lavender Notes!</h1>
          <div class="greeting">Hello ${name || 'there'}!</div>
          <div class="message">
            We're thrilled to have you on board! Your email has been successfully verified.
          </div>
          <div class="message">
            Here's what you can do with Lavender Notes:
          </div>
          <ul class="feature-list">
            <li>📝 Create and organize notes effortlessly</li>
            <li>🔖 Tag and categorize your thoughts</li>
            <li>⭐ Favorite important notes</li>
            <li>📎 Attach files and images</li>
            <li>🌓 Light/Dark mode for comfortable writing</li>
          </ul>
          <div class="message">
            Get started by creating your first note!
          </div>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="button">
            Go to Dashboard
          </a>
        </div>
        <div class="footer">
          &copy; 2024 Lavender Notes. All rights reserved.<br>
          Your digital zen workspace.
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(email, subject, html);
};

// Test email configuration
export const testEmailConfig = async () => {
  try {
    let transporter;
    
    if (process.env.EMAIL_USER) {
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    } else {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('📧 Using Ethereal email (test mode)');
      console.log(`📧 Test account: ${testAccount.user}`);
    }

    await transporter.verify();
    console.log('✅ Email service is ready!');
    return { success: true };
  } catch (error) {
    console.error('❌ Email service error:', error.message);
    return { success: false, error: error.message };
  }
};

export default {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  testEmailConfig,
};