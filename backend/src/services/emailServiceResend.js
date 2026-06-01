// backend/src/services/emailServiceResend.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Send OTP for email verification (matching your beautiful template)
export const sendVerificationEmail = async (email, name, otp) => {
  try {
    const { data, error } = await resend.emails.send({
      from: `Lavender Notes <${process.env.RESEND_FROM || 'onboarding@resend.dev'}>`,
      to: [email],
      subject: '✨ Verify Your Email - Lavender Notes ✨',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Lavender Notes</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              margin: 0;
              padding: 0;
              background-color: #f9f5ff;
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
              box-shadow: 0 20px 40px rgba(103, 75, 181, 0.08);
              text-align: center;
            }
            .logo {
              font-size: 48px;
              margin-bottom: 16px;
            }
            h1 {
              color: #2d2a35;
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
              color: #674bb5;
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
              color: #a0a0b0;
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
              <p style="color: #494552;">Thanks for joining! Please verify your email address:</p>
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
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error };
    }

    console.log(`✅ Email sent via Resend to ${email}`);
    return { success: true, data };
  } catch (error) {
    console.error('Resend exception:', error);
    return { success: false, error };
  }
};

// Send welcome email after verification (matching your beautiful template)
export const sendWelcomeEmail = async (email, name) => {
  try {
    const { data, error } = await resend.emails.send({
      from: `Lavender Notes <${process.env.RESEND_FROM || 'onboarding@resend.dev'}>`,
      to: [email],
      subject: '🎉 Welcome to Lavender Notes! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Welcome to Lavender Notes!</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #f9f5ff 0%, #f0e6ff 100%);
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
            }
            h1 {
              color: #674bb5;
              font-size: 28px;
            }
            .button {
              background: #674bb5;
              color: white;
              padding: 12px 28px;
              border-radius: 40px;
              text-decoration: none;
              display: inline-block;
              margin: 24px 0;
            }
            .feature-list {
              text-align: left;
              background: #f8f3ff;
              padding: 20px 24px;
              border-radius: 16px;
              margin: 24px 0;
            }
            .feature-list li {
              margin-bottom: 12px;
              color: #2d2a35;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>✨ Welcome to Lavender Notes! ✨</h1>
            <p>Hi <strong>${name}</strong>,</p>
            <p>Your email has been successfully verified! 🎉</p>
            <div class="feature-list">
              <strong>Here's what you can do:</strong><br/><br/>
              📝 Create and organize beautiful notes<br/>
              🔖 Tag and categorize your thoughts<br/>
              ⭐ Favorite important notes<br/>
              📌 Pin notes to the top<br/>
              🌓 Light/Dark mode<br/>
              🤝 Collaborate with team members
            </div>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="button">
              🚀 Go to Dashboard →
            </a>
            <p style="color: #666; font-size: 12px; margin-top: 32px;">Lavender Notes - Your digital zen workspace</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend welcome email error:', error);
      return { success: false, error };
    }

    console.log(`✅ Welcome email sent via Resend to ${email}`);
    return { success: true, data };
  } catch (error) {
    console.error('Resend welcome exception:', error);
    return { success: false, error };
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email, name, otp) => {
  try {
    const { data, error } = await resend.emails.send({
      from: `Lavender Notes <${process.env.RESEND_FROM || 'onboarding@resend.dev'}>`,
      to: [email],
      subject: '🔐 Reset Your Password - Lavender Notes',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Reset Your Password</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background-color: #f9f5ff;
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
            }
            .otp-code {
              font-size: 42px;
              font-weight: bold;
              letter-spacing: 10px;
              color: #674bb5;
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
      `,
    });

    if (error) {
      console.error('Resend password reset error:', error);
      return { success: false, error };
    }

    console.log(`✅ Password reset email sent via Resend to ${email}`);
    return { success: true, data };
  } catch (error) {
    console.error('Resend password reset exception:', error);
    return { success: false, error };
  }
};

export default {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
};