import { randomBytes } from "crypto";
import { Resend } from "resend";
import { config } from "../config/config.js";
import prisma from "../src/lib/prismaClient.js";

// Extended User type with verification fields
export interface UserWithVerification {
  id: string;
  email: string;
  username: string;
  emailVerified?: boolean;
  lastVerifiedAt?: Date | null;
  verificationToken?: string | null;
  verificationCode?: string | null;
  verificationTokenExpires?: Date | null;
  accountStatus?: string;
  [key: string]: any; // Allow other properties
}

/**
 * Generates a random verification token
 * @returns {string} The generated token
 */
export const generateVerificationToken = (): string => {
  return randomBytes(32).toString("hex");
};

/**
 * Generates a 6-digit verification code
 * @returns {string} The generated 6-digit code
 */
export const generateVerificationCode = (): string => {
  // Generate a 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Creates a verification token for a user and saves it to the database
 * @param userId The ID of the user
 * @returns {Promise<string>} The generated verification token
 */
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

/**
 * Sends a verification email to the user
 * @param email The email address of the user
 * @param token The verification token
 * @returns {Promise<boolean>} Whether the email was sent successfully
 */
export const sendVerificationEmail = async (
  email: string,
  tokenInfo: { token: string; code: string },
): Promise<boolean> => {
  const { token, code } = tokenInfo;
  try {
    // Get the first URL from the comma-separated list or use localhost
    const frontendUrl = (
      process.env.FRONTEND_URL || "http://localhost:5173"
    ).split(",")[0];
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

    // Check if we're in development mode and should bypass email sending
    const isDevelopment =
      process.env.NODE_ENV === "development" ||
      process.env.NODE_ENV === undefined;

    // Validate the token exists
    const user = (await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        verificationToken: true,
        verificationTokenExpires: true,
        // @ts-ignore - verificationCode exists in the Prisma schema
        verificationCode: true as const, // Add type assertion for verificationCode
      },
    })) as UserWithVerification;

    if (!user?.verificationToken || user.verificationToken !== token) {
      console.error("Invalid verification token");
      return false;
    }

    console.log("Using frontend URL:", frontendUrl);
    console.log("Using verification token:", token);
    console.log("Verification code:", code);

    // DEVELOPMENT MODE BYPASS
    // In development, log the verification details but don't try to send an email
    if (isDevelopment) {
      console.log("DEVELOPMENT MODE: Email sending bypassed");
      console.log("----------------------------------------");
      console.log("VERIFICATION DETAILS (USE THESE TO VERIFY):");
      console.log("Email:", email);
      console.log("Verification Code:", code);
      console.log("Verification Token:", token);
      console.log("Verification URL:", verificationUrl);
      console.log("----------------------------------------");
      // Return true to indicate success without actually sending an email
      return true;
    }

    // PRODUCTION EMAIL SENDING
    // Initialize Resend API client
    if (!config.email.resendApiKey) {
      console.error("Resend API key is missing");
      return false;
    }

    const resend = new Resend(config.email.resendApiKey);

    console.log("Attempting to send email to:", email);

    // Create HTML email content with verification code
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <h2 style="color: #333; text-align: center;">Verify Your Email Address</h2>
        <p>Thank you for signing up! Please use the verification code below to complete your registration:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="font-size: 32px; letter-spacing: 8px; font-weight: bold; background-color: #f5f5f5; padding: 15px; border-radius: 4px; display: inline-block;">${code}</div>
        </div>
        <p>Or you can click the button below to verify directly:</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
        </div>
        <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${verificationUrl}</p>
        <p>This verification code and link will expire in 24 hours.</p>
        <p>If you didn't sign up for an account, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;">
        <p style="color: #777; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Tijara App. All rights reserved.</p>
      </div>
    `;

    // Send email using Resend
    console.log(
      "Sending email with Resend using API key:",
      config.email.resendApiKey ? '***' + config.email.resendApiKey.slice(-4) : 'not set'
    );
    
    // Debug log the config
    console.log('Current email config:', {
      hasResendApiKey: !!config.email.resendApiKey,
      fromEmail: config.email.from,
      envEmailFrom: process.env.EMAIL_FROM,
      nodeEnv: process.env.NODE_ENV
    });

    // Use configured from email or default to a valid domain
    const fromEmail = config.email.from || 'noreply@samsar.app';
    
    // Validate email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.error('Invalid email address format:', email);
      return false;
    }
    
    console.log(`Sending email from ${fromEmail} to ${email}`);
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Verify Your Email Address",
      html: htmlContent,
      text: `Your verification code is: ${code}\n\nOr verify your email address by clicking on the following link: ${verificationUrl}`,
    });

    if (error) {
      console.error("Error sending email with Resend:", error);
      return false;
    }

    console.log("Email sent successfully:", {
      id: data?.id,
      to: email,
    });

    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    return false;
  }
};

/**
 * Verifies a user's email using the provided token
 * @param token The verification token
 * @returns {Promise<boolean>} Whether the verification was successful
 */
export const verifyEmail = async (
  token: string,
  code?: string,
): Promise<boolean> => {
  try {
    // Find user with verification token or code
    let user: UserWithVerification | null = null;

    if (code) {
      // Try to verify with code
      const users = (await prisma.user.findMany({
        where: {
          // @ts-ignore - verificationCode exists in the Prisma schema
          verificationCode: code,
          verificationTokenExpires: {
            gt: new Date(),
          },
        },
        take: 1,
      })) as unknown as UserWithVerification[];
      user = users.length > 0 ? users[0] : null;
    } else {
      // Verify with token
      const users = (await prisma.user.findMany({
        where: {
          verificationToken: token,
          verificationTokenExpires: {
            gt: new Date(),
          },
        },
        take: 1,
      })) as unknown as UserWithVerification[];
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
    console.error("Error checking verification status:", error);
    return true; // Default to requiring verification on error
  }
};
