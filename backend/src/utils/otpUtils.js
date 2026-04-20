import nodemailer from 'nodemailer';
import OTP from '../models/OTP.js';

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendOTPEmail = async (email, otp, purpose) => {
  const subjects = {
    email_verification: 'Verify Your Email - TodoApp',
    login_mfa: 'Your Login OTP - TodoApp',
    password_reset: 'Reset Your Password - TodoApp',
  };

  const titles = {
    email_verification: 'Email Verification',
    login_mfa: 'Two-Factor Authentication',
    password_reset: 'Password Reset',
  };

  const descriptions = {
    email_verification: 'Please use the OTP below to verify your email address.',
    login_mfa: 'Use this OTP to complete your login. Do not share this with anyone.',
    password_reset: 'Use this OTP to reset your password.',
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: #fff; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 25px; }
        .header h1 { color: #2563eb; font-size: 24px; margin: 0; }
        .otp-box { background: #f0f4ff; border: 2px dashed #2563eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .otp-code { font-size: 36px; font-weight: bold; color: #1d4ed8; letter-spacing: 8px; }
        .expiry { color: #6b7280; font-size: 14px; margin-top: 10px; }
        .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>TodoApp</h1>
          <p style="color:#374151;margin:5px 0 0;">${titles[purpose]}</p>
        </div>
        <p style="color:#374151;">${descriptions[purpose]}</p>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
          <div class="expiry">This OTP expires in 10 minutes</div>
        </div>
        <p style="color:#6b7280;font-size:13px;">If you did not request this, please ignore this email and ensure your account is secure.</p>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} TodoApp. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"TodoApp" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subjects[purpose],
    html,
  });
};

export const createAndSendOTP = async (email, purpose) => {
  await OTP.deleteMany({ email, purpose });

  const otpCode = generateOTP();

  await OTP.create({
    email,
    purpose,
    otp: otpCode,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  await sendOTPEmail(email, otpCode, purpose);

  return otpCode;
};

export const verifyOTPCode = async (email, code, purpose) => {
  const otpRecord = await OTP.findOne({
    email,
    purpose,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  });

  if (!otpRecord) {
    return { valid: false, message: 'OTP not found or expired. Please request a new one.' };
  }

  if (otpRecord.attempts >= 3) {
    await OTP.deleteOne({ _id: otpRecord._id });
    return { valid: false, message: 'Too many failed attempts. Please request a new OTP.' };
  }

  const isMatch = await otpRecord.verifyOTP(code);

  if (!isMatch) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    return { valid: false, message: `Invalid OTP. ${3 - otpRecord.attempts} attempts remaining.` };
  }

  otpRecord.isUsed = true;
  await otpRecord.save();

  return { valid: true };
};
