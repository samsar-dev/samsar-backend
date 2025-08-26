import { randomBytes } from "crypto";
import prisma from "../src/lib/prismaClient.js";
import nodemailer from "nodemailer";
import { boolean } from "zod";

// Primary Gmail SMTP transporter with Railway optimizations
const gmailTransporter = nodemailer.createTransport({
  service: 'gmail', // Use service instead of manual host/port
  auth: {
    user: "daryannabo16@gmail.com",
    pass: "pgqzjkpisuyzrnzd",
  },
  connectionTimeout: 20000, // Shorter timeout for faster failover
  greetingTimeout: 10000,
  socketTimeout: 20000,
  pool: true, // Use connection pooling
  maxConnections: 5,
  maxMessages: 100,
});

// Fallback Gmail SMTP with explicit TLS settings for Railway
const gmailTlsTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "daryannabo16@gmail.com",
    pass: "pgqzjkpisuyzrnzd",
  },
  connectionTimeout: 20000,
  greetingTimeout: 10000,
  socketTimeout: 20000,
  requireTLS: true,
  tls: {
    rejectUnauthorized: false,
    ciphers: 'SSLv3',
    minVersion: 'TLSv1'
  },
  pool: true,
  maxConnections: 3,
});

// Alternative SMTP provider as last resort (you can add SendGrid SMTP here)
const alternativeTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 25, // Try port 25 as last resort
  secure: false,
  auth: {
    user: "daryannabo16@gmail.com",
    pass: "pgqzjkpisuyzrnzd",
  },
  connectionTimeout: 15000,
  greetingTimeout: 8000,
  socketTimeout: 15000,
  ignoreTLS: false,
  requireTLS: false,
  tls: {
    rejectUnauthorized: false
  }
});

// Array of transporters to try in order (including alternative as last resort)
const transporters = [gmailTransporter, gmailTlsTransporter, alternativeTransporter];

// Test transporter connectivity
const testTransporter = async (transporter: any, name: string): Promise<boolean> => {
  try {
    await transporter.verify();
    console.log(`✅ ${name} transporter verified successfully`);
    return true;
  } catch (error: any) {
    console.error(`❌ ${name} transporter verification failed:`, error.message);
    return false;
  }
};

// Initialize and test all transporters
const initializeTransporters = async () => {
  console.log('🔧 Testing email transporters...');
  const transporterNames = ['Gmail Service', 'Gmail TLS', 'Gmail Port 25'];
  for (let i = 0; i < transporters.length; i++) {
    await testTransporter(transporters[i], transporterNames[i]);
  }
};

// Initialize transporters on module load
initializeTransporters().catch(console.error);

export const generateVerificationToken = (): string => {
  return randomBytes(32).toString("hex");
};

export const generateVerificationCode = (): string => {
  // Generate a 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const createVerificationToken = async (
  userId: string,
): Promise<{ token: string; code: string }> => {
  const token = generateVerificationToken();
  const code = generateVerificationCode();
  const expires = new Date();
  expires.setHours(expires.getHours() + 24); // Token expires in 24 hours

  // Update user with verification token and code using Prisma
  await prisma.user.update({
    where: { id: userId },
    data: {
      verificationToken: token,
      // @ts-ignore - verificationCode exists in the Prisma schema
      verificationCode: code,
      verificationTokenExpires: expires,
      emailVerified: false,
    },
  });

  console.log("Created verification token and code:", {
    userId,
    token,
    code,
    expires,
  });

  return { token, code };
};

// Robust email sending with multiple nodemailer transporters and retry logic
const sendEmailWithFallback = async (mailOptions: any): Promise<any> => {
  const transporterNames = ['Gmail Service', 'Gmail TLS', 'Gmail Port 25'];
  let lastError: any;
  
  for (let i = 0; i < transporters.length; i++) {
    const transporter = transporters[i];
    const transporterName = transporterNames[i];
    
    // Retry each transporter up to 2 times
    for (let retry = 0; retry < 2; retry++) {
      try {
        const retryText = retry > 0 ? ` (retry ${retry})` : '';
        console.log(`🔄 Attempting to send email via ${transporterName}${retryText}...`);
        
        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully via ${transporterName}${retryText}`);
        console.log(`📨 Message ID: ${result.messageId}`);
        return result;
        
      } catch (error: any) {
        console.error(`❌ ${transporterName}${retry > 0 ? ` (retry ${retry})` : ''} failed:`, error.message);
        lastError = error;
        
        // If it's a connection timeout, wait a bit before retry
        if (error.code === 'ETIMEDOUT' && retry < 1) {
          console.log(`⏳ Waiting 2 seconds before retry...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        
        // Break out of retry loop for this transporter
        break;
      }
    }
    
    // If this isn't the last transporter, try the next one
    if (i < transporters.length - 1) {
      console.log(`🔄 Trying next transporter...`);
      continue;
    }
  }
  
  // If all transporters failed, throw the last error
  throw lastError;
};

export const sendVerificationEmail = async (
  email: string,
  tokenInfo: { token: string; code: string },
): Promise<boolean> => {
  try {
    console.log(`📧 Sending verification email to: ${email}`);
    console.log(`🔑 Verification code: ${tokenInfo.code}`);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4C14CC; margin: 0; font-size: 28px;">Samsar</h1>
          <h2 style="color: #333; margin: 10px 0 0 0; font-size: 24px;">Verify Your Email Address</h2>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; font-size: 16px; color: #333;">Thank you for signing up! Please use the verification code below to complete your registration:</p>
        </div>
        
        <div style="text-align: center; margin: 40px 0;">
          <div style="font-size: 36px; letter-spacing: 6px; font-weight: bold; background-color: #4C14CC; color: white; padding: 20px; border-radius: 8px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            ${tokenInfo.code}
          </div>
        </div>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            ⏰ <strong>Important:</strong> This verification code will expire in 24 hours.
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea;">
          <p style="color: #666; font-size: 14px; margin: 0;">
            If you didn't create an account with Samsar, you can safely ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Samsar App. All rights reserved.
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: '"Samsar Team" <daryannabo16@gmail.com>',
      to: email,
      subject: "🔐 Verify Your Samsar Account",
      html: htmlContent,
      text: `Welcome to Samsar!\n\nYour verification code is: ${tokenInfo.code}\n\nEnter this code to verify your email address and complete your registration.\n\nThis code will expire in 24 hours.\n\nIf you didn't create an account, you can safely ignore this email.\n\n-- The Samsar Team`,
    };

    const result = await sendEmailWithFallback(mailOptions);
    
    console.log(`✅ Verification email sent successfully to: ${email}`);
    console.log(`📨 Message ID: ${result.messageId}`);
    return true;
    
  } catch (error: any) {
    console.error(`❌ All email transporters failed for ${email}:`, error.message);
    console.error(`🔍 Error details:`, error);
    return false;
  }
};

export const sendUserLoginEmail = async (userDetails: {
  name: string | null;
  email: string;
  username: string;
}): Promise<boolean> => {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <h2 style="color: #333; text-align: center;">Login Notification</h2>
        <p>Hello${userDetails.name ? ` ${userDetails.name}` : ""},</p>
        <p>We noticed a login to your Samsar account with the following details:</p>
        <ul>
          <li><strong>Username:</strong> ${userDetails.username}</li>
          <li><strong>Email:</strong> ${userDetails.email}</li>
        </ul>
        <p>If this was you, no action is needed.</p>
        <p>If you did not perform this login, please reset your password immediately.</p>
        <p style="margin-top: 20px;">– The Samsar Team</p>
      </div>
    `;

    const mailOptions = {
      from: '"Samsar Team" <daryannabo16@gmail.com>',
      to: userDetails.email,
      subject: "New Login Detected",
      html: htmlContent,
    };

    await sendEmailWithFallback(mailOptions);

    return true;
  } catch (error) {
    console.log(`Error in sending login email: ${error}`);
    return false;
  }
};

export const verifyEmail = async (
  token: string,
  code?: string,
): Promise<boolean> => {
  try {
    // Find user with verification token or code
    let user: any = null;

    if (code) {
      // Try to verify with code
      const users = await prisma.user.findMany({
        where: {
          // @ts-ignore - verificationCode exists in the Prisma schema
          verificationCode: code,
          verificationTokenExpires: {
            gt: new Date(),
          },
        },
        take: 1,
      });
      user = users.length > 0 ? users[0] : null;
    } else {
      // Verify with token
      const users = await prisma.user.findMany({
        where: {
          verificationToken: token,
          verificationTokenExpires: {
            gt: new Date(),
          },
        },
        take: 1,
      });
      user = users.length > 0 ? users[0] : null;
    }

    if (!user) {
      return false;
    }

    // Update user as verified and change account status from PENDING to ACTIVE
    const now = new Date();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        lastVerifiedAt: now,
        verificationToken: null,
        // @ts-ignore - verificationCode exists in the Prisma schema
        verificationCode: null,
        verificationTokenExpires: null,
        // @ts-ignore - accountStatus exists in the Prisma schema
        accountStatus: "ACTIVE",
      },
    });

    return true;
  } catch (error) {
    console.error("Error verifying email:", error);
    return false;
  }
};

export const sendNewMessageNotificationEmail = async (
  recipientEmail: string,
  params: {
    senderName: string;
    recipientName: string;
    conversationId: string;
  },
): Promise<boolean> => {
  const { senderName, recipientName, conversationId } = params;

  try {
    const FrontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const messageUrl = `${FrontendBaseUrl}/messages/${conversationId}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #ffffff; padding: 30px; border: 1px solid #ddd; max-width: 600px; margin: auto; border-radius: 8px;">
        <div style="background-color: #4C14CC; color: white; padding: 20px; border-radius: 6px 6px 0 0; text-align: center;">
          <h2 style="margin: 0;">New Message Alert</h2>
        </div>

        <div style="padding: 20px;">
          <p>Hi ${recipientName},</p>
          <p><strong>${senderName}</strong> just sent you a new message on <strong>Samsar</strong>.</p>
          <p>Click the button below to read it:</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${messageUrl}" style="
              background-color: #4C14CC;
              color: #ffffff;
              padding: 12px 24px;
              border-radius: 30px;
              text-decoration: none;
              font-weight: bold;
              font-size: 16px;
              display: inline-block;
            ">Check Message</a>
          </div>

          <p style="color: #888;">If you're not expecting this, you can ignore this email.</p>
          <p style="margin-top: 40px;">– The Samsar Team</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: '"Samsar Team" <daryannabo16@gmail.com>',
      to: recipientEmail,
      subject: "You've got a new message on Samsar!",
      html: htmlContent,
    };

    await sendEmailWithFallback(mailOptions);

    return true;
  } catch (error) {
    console.log(`Error sending new message email: ${error}`);
    return false;
  }
};
