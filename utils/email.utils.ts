import { randomBytes } from 'crypto';
import nodemailer from 'nodemailer';
import { config } from '../config/config';
import prisma from '../src/lib/prismaClient';

// Extended User type with verification fields
interface UserWithVerification {
  id: string;
  email: string;
  username: string;
  emailVerified?: boolean;
  lastVerifiedAt?: Date | null;
  verificationToken?: string | null;
  verificationTokenExpires?: Date | null;
  [key: string]: any; // Allow other properties
}

/**
 * Generates a random verification token
 * @returns {string} The generated token
 */
export const generateVerificationToken = (): string => {
  return randomBytes(32).toString('hex');
};

/**
 * Creates a verification token for a user and saves it to the database
 * @param userId The ID of the user
 * @returns {Promise<string>} The generated verification token
 */
export const createVerificationToken = async (userId: string): Promise<string> => {
  const token = generateVerificationToken();
  const expires = new Date();
  expires.setHours(expires.getHours() + 24); // Token expires in 24 hours

  // Use raw SQL to update the user with verification token
  // This is a workaround for the Prisma type issues until migration is applied
  await prisma.$executeRaw`
    UPDATE "User" 
    SET "verificationToken" = ${token}, 
        "verificationTokenExpires" = ${expires}
    WHERE id = ${userId}
  `;

  return token;
};

/**
 * Sends a verification email to the user
 * @param email The email address of the user
 * @param token The verification token
 * @returns {Promise<boolean>} Whether the email was sent successfully
 */
export const sendVerificationEmail = async (email: string, token: string): Promise<boolean> => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

    // Create a test account if no SMTP credentials are provided
    let transporter;
    
    if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
      // Use configured SMTP server
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
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

    // Send the email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Tijara App" <no-reply@tijara-app.com>',
      to: email,
      subject: 'Verify Your Email Address',
      text: `Please verify your email address by clicking on the following link: ${verificationUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">Verify Your Email Address</h2>
          <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
          </div>
          <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
          <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${verificationUrl}</p>
          <p>This verification link will expire in 24 hours.</p>
          <p>If you didn't sign up for an account, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;">
          <p style="color: #777; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Tijara App. All rights reserved.</p>
        </div>
      `,
    });

    console.log('Email sent: %s', info.messageId);
    
    // Log preview URL for testing environments
    if (!process.env.SMTP_HOST) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }

    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

/**
 * Verifies a user's email using the provided token
 * @param token The verification token
 * @returns {Promise<boolean>} Whether the verification was successful
 */
export const verifyEmail = async (token: string): Promise<boolean> => {
  try {
    // Use raw SQL to find user with verification token
    // This is a workaround for the Prisma type issues until migration is applied
    const users = await prisma.$queryRaw<UserWithVerification[]>`
      SELECT * FROM "User"
      WHERE "verificationToken" = ${token}
      AND "verificationTokenExpires" > ${new Date()}
      LIMIT 1
    `;
    
    const user = users && users.length > 0 ? users[0] : null;

    if (!user) {
      return false;
    }

    // Update user as verified using raw SQL
    const now = new Date();
    await prisma.$executeRaw`
      UPDATE "User" 
      SET "emailVerified" = true,
          "lastVerifiedAt" = ${now},
          "verificationToken" = NULL,
          "verificationTokenExpires" = NULL
      WHERE id = ${user.id}
    `;

    return true;
  } catch (error) {
    console.error('Error verifying email:', error);
    return false;
  }
};

/**
 * Checks if a user needs to re-verify their email
 * @param userId The ID of the user
 * @returns {Promise<boolean>} Whether the user needs to re-verify their email
 */
export const needsReVerification = async (userId: string): Promise<boolean> => {
  try {
    // Use raw SQL to check verification status
    // This is a workaround for the Prisma type issues until migration is applied
    const users = await prisma.$queryRaw<UserWithVerification[]>`
      SELECT "emailVerified", "lastVerifiedAt"
      FROM "User"
      WHERE id = ${userId}
      LIMIT 1
    `;
    
    const user = users && users.length > 0 ? users[0] : null;

    if (!user) {
      return true;
    }

    // If email is not verified, re-verification is needed
    if (!user.emailVerified) {
      return true;
    }

    // If lastVerifiedAt is not set, re-verification is needed
    if (!user.lastVerifiedAt) {
      return true;
    }

    // Check if last verification was more than 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return user.lastVerifiedAt < sevenDaysAgo;
  } catch (error) {
    console.error('Error checking verification status:', error);
    return true; // Default to requiring verification on error
  }
};
