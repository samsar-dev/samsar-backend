import { randomBytes } from "crypto";
import prisma from "../src/lib/prismaClient.js";
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";

// Initialize MailerSend client
const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY || "",
});

// Initialize MailerSend on module load
const initializeMailerSend = () => {
  if (process.env.MAILERSEND_API_KEY) {
    console.log('✅ MailerSend initialized successfully');
    return true;
  } else {
    console.error('❌ MAILERSEND_API_KEY not found in environment variables');
    console.log('📝 Please set MAILERSEND_API_KEY in your Railway environment variables');
    return false;
  }
};

// Initialize on startup
const isMailerSendReady = initializeMailerSend();

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

// Send email using MailerSend API
const sendEmailWithMailerSend = async (emailData: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<any> => {
  if (!isMailerSendReady) {
    throw new Error('MailerSend is not properly configured. Please check MAILERSEND_API_KEY environment variable.');
  }

  try {
    console.log(`📧 Sending email via MailerSend to: ${emailData.to}`);

    // Use verified sender email for trial account
    const sentFrom = new Sender("samsarhq0@gmail.com", "Samsar Team");
    const recipients = [new Recipient(emailData.to, "User")];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(emailData.subject)
      .setHtml(emailData.html)
      .setText(emailData.text || emailData.html.replace(/<[^>]*>/g, ''));

    const result = await mailerSend.email.send(emailParams);
    
    console.log(`✅ Email sent successfully via MailerSend`);
    console.log(`📨 Message ID: ${result.body?.message_id || 'N/A'}`);
    
    return result;
  } catch (error: any) {
    console.error(`❌ MailerSend failed:`, error.message);
    throw error;
  }
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

    const textContent = `Welcome to Samsar!\n\nYour verification code is: ${tokenInfo.code}\n\nEnter this code to verify your email address and complete your registration.\n\nThis code will expire in 24 hours.\n\nIf you didn't create an account, you can safely ignore this email.\n\n-- The Samsar Team`;

    await sendEmailWithMailerSend({
      to: email,
      subject: "🔐 Verify Your Samsar Account",
      html: htmlContent,
      text: textContent,
    });
    
    console.log(`✅ Verification email sent successfully to: ${email}`);
    return true;
    
  } catch (error: any) {
    console.error(`❌ MailerSend failed for ${email}:`, error.message);
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

    await sendEmailWithMailerSend({
      to: userDetails.email,
      subject: "New Login Detected",
      html: htmlContent,
    });

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

    await sendEmailWithMailerSend({
      to: recipientEmail,
      subject: "You've got a new message on Samsar!",
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.log(`Error sending new message email: ${error}`);
    return false;
  }
};
