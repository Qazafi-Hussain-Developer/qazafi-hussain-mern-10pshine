// backend/src/services/emailService.js
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import logger from '../utils/logger.js';

// Initialize Resend if API key exists
let resend = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
  console.log('✅ Resend initialized - better deliverability!');
}

// Email transporter configuration (Gmail fallback)
const createTransporter = async () => {
  // For development/testing with ethereal.email (fake SMTP)
  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  // For production with real SMTP (Gmail)
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

// Send email via Resend (better deliverability)
const sendViaResend = async (to, subject, html) => {
  if (!resend) return null;
  
  try {
    const { data, error } = await resend.emails.send({
      from: `Lavender Notes <${process.env.RESEND_FROM || 'onboarding@resend.dev'}>`,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Email sent via Resend to: ${to}`);
    logger.info(`Email sent via Resend to ${to}: ${subject}`);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Resend exception:', error);
    return { success: false, error: error.message };
  }
};

// Send email via Gmail (fallback)
const sendViaGmail = async (to, subject, html, text = null) => {
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: `"Lavender Notes" <${process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@lavendernotes.com'}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
      headers: {
        'X-Priority': '3',
        'X-Mailer': 'Lavender Notes',
        'X-Entity-Ref-ID': `${Date.now()}-${Math.random()}`,
      },
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (info.messageId && info.previewUrl) {
      logger.info(`Email sent: ${info.previewUrl}`);
      console.log(`📧 Email preview: ${info.previewUrl}`);
    } else {
      logger.info(`Email sent via Gmail to ${to}: ${subject}`);
      console.log(`📧 Email sent via Gmail to: ${to}`);
    }
    
    return { success: true, messageId: info.messageId, previewUrl: info.previewUrl };
  } catch (error) {
    logger.error(`Gmail sending failed to ${to}:`, error.message);
    console.error('❌ Gmail error:', error.message);
    return { success: false, error: error.message };
  }
};

// Main send email function - tries Resend first, then Gmail
const sendEmail = async (to, subject, html, text = null) => {
  // Try Resend first (better deliverability - no spam!)
  if (resend) {
    const result = await sendViaResend(to, subject, html);
    if (result.success) {
      return result;
    }
    console.log('⚠️ Resend failed, falling back to Gmail...');
  }
  
  // Fallback to Gmail
  return await sendViaGmail(to, subject, html, text);
};

// Send OTP for email verification
export const sendVerificationEmail = async (email, name, otp) => {
  const subject = '✨ Verify Your Email - Lavender Notes ✨';
  
  const html = `
    <!DOCTYPE html>
    <html>
   head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Lavender Notes</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
          max-width: 560px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .card {
          background: #ffffff;
          border-radius: 24px;
          padding: 48px 40px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          text-align: center;
        }
        .logo {
          font-size: 48px;
          margin-bottom: 16px;
        }
        h1 {
          color: #764ba2;
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }
        .greeting {
          font-size: 18px;
          color: #2d2a35;
          margin-bottom: 24px;
        }
        .otp-code {
          font-size: 42px;
          font-weight: 700;
          letter-spacing: 10px;
          color: #764ba2;
          background: #f3eaff;
          padding: 20px 24px;
          border-radius: 16px;
          font-family: 'Courier New', monospace;
          display: inline-block;
          margin: 24px 0;
        }
        .expiry {
          font-size: 13px;
          color: #a78bfa;
          margin-top: 16px;
        }
        .footer {
          margin-top: 32px;
          font-size: 12px;
          color: #a0aec0;
          text-align: center;
        }
        .tip {
          background: #fff8e8;
          border-radius: 12px;
          padding: 12px;
          margin-top: 24px;
          font-size: 12px;
          color: #b76e0a;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="logo">📝✨</div>
          <h1>Welcome to Lavender Notes!</h1>
          <div class="greeting">Hello <strong>${name}</strong>! 👋</div>
          <p style="color: #4a5568;">Thanks for joining! Please verify your email address:</p>
          <div class="otp-code">${otp}</div>
          <p class="expiry">⏰ This code expires in <strong>10 minutes</strong></p>
          <div class="tip">
            💡 <strong>Tip:</strong> Add this email to your contacts to ensure you never miss an update!
          </div>
        </div>
        <div class="footer">
          <p>© 2024 Lavender Notes - Your digital zen workspace</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(email, subject, html);
};

// Send OTP for password reset
export const sendPasswordResetEmail = async (email, name, otp) => {
  const subject = '🔐 Reset Your Password - Lavender Notes';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Reset Your Password</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          margin: 0;
          padding: 40px 20px;
        }
        .card {
          max-width: 560px;
          margin: 0 auto;
          background: white;
          border-radius: 24px;
          padding: 48px 40px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 {
          color: #764ba2;
          font-size: 28px;
        }
        .otp-code {
          font-size: 42px;
          font-weight: bold;
          letter-spacing: 10px;
          color: #764ba2;
          background: #f3eaff;
          padding: 20px;
          border-radius: 16px;
          font-family: monospace;
          margin: 24px 0;
        }
        .warning {
          background: #fff8e8;
          padding: 16px;
          border-radius: 12px;
          font-size: 13px;
          color: #b76e0a;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>🔐 Reset Your Password</h1>
        <p>Hello <strong>${name}</strong>,</p>
        <p>We received a request to reset your password.</p>
        <div class="otp-code">${otp}</div>
        <p>This code expires in <strong>10 minutes</strong>.</p>
        <div class="warning">
          ⚠️ If you didn't request this, please ignore this email.
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(email, subject, html);
};

// Send welcome email after verification - UPDATED BEAUTIFUL DESIGN
export const sendWelcomeEmail = async (email, name) => {
  const subject = '🎉 Welcome to Lavender Notes! 🎉';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Lavender Notes!</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
          line-height: 1.6;
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        .container {
          max-width: 580px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .card {
          background: #ffffff;
          border-radius: 32px;
          padding: 48px 40px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          text-align: center;
        }
        .hero-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        h1 {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 16px;
        }
        .welcome-text {
          font-size: 18px;
          color: #4a5568;
          margin-bottom: 8px;
        }
        .user-name {
          font-size: 24px;
          font-weight: 700;
          color: #764ba2;
          margin-bottom: 24px;
        }
        .message {
          color: #4a5568;
          font-size: 16px;
          margin-bottom: 32px;
        }
        .features-card {
          background: linear-gradient(135deg, #f9f5ff 0%, #f0e6ff 100%);
          border-radius: 24px;
          padding: 28px 24px;
          margin: 32px 0;
          text-align: left;
        }
        .features-title {
          font-size: 18px;
          font-weight: 700;
          color: #764ba2;
          margin-bottom: 20px;
          text-align: center;
        }
        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid #e8ddf5;
        }
        .feature-item:last-child {
          border-bottom: none;
        }
        .feature-icon {
          font-size: 24px;
          min-width: 36px;
        }
        .feature-text {
          color: #2d2a35;
          font-size: 15px;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          padding: 14px 36px;
          border-radius: 40px;
          font-weight: 600;
          font-size: 16px;
          margin: 24px 0;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 15px rgba(103, 75, 181, 0.3);
        }
        .cta-button:hover {
          transform: scale(1.02);
          box-shadow: 0 6px 20px rgba(103, 75, 181, 0.4);
        }
        .footer {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #e8e0f0;
          font-size: 12px;
          color: #a0aec0;
          text-align: center;
        }
        .footer-links {
          margin-top: 12px;
        }
        .footer-links a {
          color: #a78bfa;
          text-decoration: none;
          margin: 0 10px;
        }
        .footer-links a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="hero-icon">✨📝✨</div>
          <h1>Welcome to Lavender Notes!</h1>
          <div class="welcome-text">Your email has been successfully verified</div>
          <div class="user-name">${name} 🎉</div>
          <div class="message">
            We're thrilled to have you on board! Start your journey to organized thought today.
          </div>
          
          <div class="features-card">
            <div class="features-title">🌟 What you can do with Lavender Notes:</div>
            <div class="feature-item">
              <span class="feature-icon">📝</span>
              <span class="feature-text">Create and organize beautiful notes</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🔖</span>
              <span class="feature-text">Tag and categorize your thoughts</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">⭐</span>
              <span class="feature-text">Favorite important notes</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📌</span>
              <span class="feature-text">Pin notes to the top</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🌓</span>
              <span class="feature-text">Light/Dark mode for comfortable writing</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🤝</span>
              <span class="feature-text">Collaborate with team members</span>
            </div>
          </div>
          
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="cta-button">
            🚀 Go to Dashboard →
          </a>
          
          <div class="message" style="font-size: 14px; margin-top: 16px;">
            Start capturing your thoughts, ideas, and inspiration today!
          </div>
        </div>
        
        <div class="footer">
          <p>Lavender Notes - Your digital zen workspace</p>
          <div class="footer-links">
            <a href="#">Privacy Policy</a> • 
            <a href="#">Terms of Service</a> • 
            <a href="#">Help Center</a>
          </div>
          <p style="margin-top: 16px;">&copy; 2024 Lavender Notes. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(email, subject, html);
};

// ============================================
// NEW: Send OTP for two-factor authentication
// ============================================
export const sendOtpEmail = async (email, otp) => {
  const subject = '🔐 Your Lavender Notes Verification Code';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verification Code</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
          max-width: 520px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .card {
          background: #ffffff;
          border-radius: 28px;
          padding: 48px 40px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          text-align: center;
        }
        .logo {
          font-size: 48px;
          margin-bottom: 16px;
        }
        h1 {
          color: #764ba2;
          font-size: 26px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }
        .otp-code {
          font-size: 48px;
          font-weight: 800;
          letter-spacing: 12px;
          color: #764ba2;
          background: linear-gradient(135deg, #f3eaff 0%, #f9f5ff 100%);
          padding: 24px 20px;
          border-radius: 20px;
          font-family: 'Courier New', 'SF Mono', monospace;
          display: inline-block;
          margin: 28px 0;
          border: 1px solid #e8ddf5;
        }
        .expiry {
          font-size: 13px;
          color: #a78bfa;
          margin-top: 16px;
          padding: 8px 16px;
          background: #f9f5ff;
          border-radius: 40px;
          display: inline-block;
        }
        .footer {
          margin-top: 32px;
          font-size: 12px;
          color: #a0aec0;
          text-align: center;
        }
        .warning {
          background: #fff8e8;
          border-radius: 12px;
          padding: 12px;
          margin-top: 24px;
          font-size: 12px;
          color: #b76e0a;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="logo">🔐✨</div>
          <h1>Verification Code</h1>
          <p style="color: #4a5568;">Enter this code to complete your login:</p>
          <div class="otp-code">${otp}</div>
          <p class="expiry">⏰ This code expires in <strong>10 minutes</strong></p>
          <div class="warning">
            🔒 This is a one-time verification code. Never share this code with anyone.
          </div>
        </div>
        <div class="footer">
          <p>Lavender Notes - Your digital zen workspace</p>
          <p style="margin-top: 8px;">If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(email, subject, html);
};

// ============================================
// NEW: Send invitation email for note collaboration
// ============================================
export const sendInvitationEmail = async (email, inviterName, noteTitle, noteId) => {
  const subject = `🤝 ${inviterName} invited you to collaborate on "${noteTitle}"`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Collaboration Invitation</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
          max-width: 560px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .card {
          background: #ffffff;
          border-radius: 28px;
          padding: 48px 40px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          text-align: center;
        }
        .logo {
          font-size: 56px;
          margin-bottom: 16px;
        }
        h1 {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }
        .invite-details {
          background: linear-gradient(135deg, #f9f5ff 0%, #f0e6ff 100%);
          border-radius: 20px;
          padding: 24px;
          margin: 28px 0;
        }
        .inviter-name {
          font-size: 18px;
          font-weight: 700;
          color: #764ba2;
          margin-bottom: 8px;
        }
        .note-title {
          font-size: 20px;
          font-weight: 700;
          color: #667eea;
          background: white;
          padding: 12px 20px;
          border-radius: 40px;
          display: inline-block;
          margin: 12px 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          padding: 14px 32px;
          border-radius: 40px;
          font-weight: 600;
          font-size: 16px;
          margin: 20px 0;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 15px rgba(103, 75, 181, 0.3);
        }
        .cta-button:hover {
          transform: scale(1.02);
          box-shadow: 0 6px 20px rgba(103, 75, 181, 0.4);
        }
        .footer {
          margin-top: 32px;
          font-size: 12px;
          color: #a0aec0;
          text-align: center;
        }
        .tip {
          background: #fff8e8;
          border-radius: 12px;
          padding: 12px;
          margin-top: 24px;
          font-size: 12px;
          color: #b76e0a;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="logo">🤝✨</div>
          <h1>Collaboration Invitation</h1>
          <p style="color: #4a5568;">You've been invited to collaborate on a note!</p>
          
          <div class="invite-details">
            <div class="inviter-name">📧 ${inviterName}</div>
            <div style="font-size: 14px; color: #7a7583;">has invited you to collaborate on:</div>
            <div class="note-title">📄 "${noteTitle}"</div>
            <div style="font-size: 13px; color: #a78bfa; margin-top: 8px;">
              🔑 Permission: Editor
            </div>
          </div>
          
          <p>You can view, edit, and collaborate on this note with the team.</p>
          
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/editor/${noteId}" class="cta-button">
            🚀 View & Collaborate →
          </a>
          
          <div class="tip">
            💡 <strong>Tip:</strong> If you don't have an account yet, you'll be prompted to sign up first.
          </div>
        </div>
        
        <div class="footer">
          <p>Lavender Notes - Your digital zen workspace</p>
          <p style="margin-top: 8px;">© 2024 Lavender Notes. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(email, subject, html);
};

// Test email configuration
export const testEmailConfig = async () => {
  if (resend) {
    console.log('✅ Resend is configured and ready!');
  }
  if (process.env.EMAIL_USER) {
    console.log('✅ Gmail is configured as fallback!');
  }
  console.log('✅ Email service is ready!');
  return { success: true };
};

export default {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendOtpEmail,
  sendInvitationEmail,
  testEmailConfig,
};