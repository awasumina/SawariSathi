import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Create email transporter with Gmail
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD, // Use App Password, not regular password
    },
  });
};

// Generate 6-digit OTP
export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Send OTP email (for verification or password reset)
export const sendOTPEmail = async (email, otp, fullName, isPasswordReset = false) => {
  try {
    const transporter = createTransporter();

    const subject = isPasswordReset
      ? '🔑 Password Reset Code - Sawari Sathi'
      : '🔐 Verify Your Email - Sawari Sathi';

    const headerTitle = isPasswordReset ? 'Password Reset' : 'Email Verification';
    const headerMessage = isPasswordReset
      ? 'You requested to reset your password. Use the code below to proceed.'
      : 'Thank you for registering with Sawari Sathi. Please use the OTP code below to verify your email address.';

    const mailOptions = {
      from: `Sawari Sathi <${process.env.GMAIL_USER}>`,
      to: email,
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              padding: 40px 30px;
              text-align: center;
            }
            .otp-box {
              background: #f8f9fa;
              border: 2px dashed #667eea;
              border-radius: 8px;
              padding: 20px;
              margin: 30px 0;
              display: inline-block;
            }
            .otp-code {
              font-size: 36px;
              font-weight: bold;
              color: #667eea;
              letter-spacing: 8px;
              margin: 0;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              text-align: left;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚍 Sawari Sathi</h1>
              <p>${headerTitle}</p>
            </div>
            <div class="content">
              <h2>Hello ${fullName}! 👋</h2>
              <p>${headerMessage}</p>
              
              <div class="otp-box">
                <p class="otp-code">${otp}</p>
              </div>
              
              <p><strong>This code will expire in 10 minutes.</strong></p>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong><br>
                • Never share this code with anyone<br>
                • Sawari Sathi will never ask for this code via phone or email<br>
                • If you didn't request this code, please ignore this email
              </div>
              
              <p style="color: #666; margin-top: 30px;">
                If you have any questions, please contact our support team.
              </p>
            </div>
            <div class="footer">
              <p>© 2025 Sawari Sathi. All rights reserved.</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ OTP Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    throw error;
  }
};

// Send welcome email after verification
export const sendWelcomeEmail = async (email, fullName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `Sawari Sathi <${process.env.GMAIL_USER}>`,
      to: email,
      subject: '🎉 Welcome to Sawari Sathi!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px;
              text-align: center;
            }
            .content {
              padding: 40px 30px;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚍 Welcome to Sawari Sathi!</h1>
            </div>
            <div class="content">
              <h2>Hello ${fullName}! 🎉</h2>
              <p>Your email has been successfully verified! Welcome to the Sawari Sathi community.</p>
              
              <h3>What's next?</h3>
              <ul>
                <li>✅ Complete your profile</li>
                <li>🗺️ Explore routes and stops</li>
                <li>🚍 Track your favorite vehicles</li>
                <li>📱 Report traffic violations</li>
              </ul>
              
              <p style="margin-top: 30px;">
                Thank you for choosing Sawari Sathi. We're excited to have you on board!
              </p>
            </div>
            <div class="footer">
              <p>© 2025 Sawari Sathi. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    // Don't throw error for welcome email - it's not critical
    return { success: false, error: error.message };
  }
};
