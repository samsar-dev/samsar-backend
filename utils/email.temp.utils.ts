import { randomBytes } from "crypto";
import prisma from "../src/lib/prismaClient.js";
import nodemailer from "nodemailer";
import { boolean } from "zod";

const transporter = nodemailer.createTransport({
  secure: true,
  host: "smtp.gmail.com",
  port: 465,
  auth: {
    user: "daryannabo16@gmail.com",
    pass: "pgqzjkpisuyzrnzd", //yet to be provided
  },
});

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

export const sendVerificationEmail = async (
  email: string,
  tokenInfo: { token: string; code: string },
): Promise<boolean> => {
  try {
    const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
                <h2 style="color: #333; text-align: center;">Verify Your Email Address</h2>
                <p>Thank you for signing up! Please use the verification code below to complete your registration:</p>
                <div style="text-align: center; margin: 30px 0;">
                <div style="font-size: 32px; letter-spacing: 8px; font-weight: bold; background-color: #f5f5f5; padding: 15px; border-radius: 4px; display: inline-block;">${tokenInfo.code}</div>
                </div>
            </div>
            `;

    transporter.sendMail({
      from: "no-reply@tijara.com",
      to: email,
      subject: "Tijara verification email",
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.log(
      `Error in sending email verification code with nodemailer and error is: ${error}`,
    );
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
        <p>We noticed a login to your Tijara account with the following details:</p>
        <ul>
          <li><strong>Username:</strong> ${userDetails.username}</li>
          <li><strong>Email:</strong> ${userDetails.email}</li>
        </ul>
        <p>If this was you, no action is needed.</p>
        <p>If you did not perform this login, please reset your password immediately.</p>
        <p style="margin-top: 20px;">– The Tijara Team</p>
      </div>
    `;

    await transporter.sendMail({
      from: "no-reply@tijara.com",
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
          <p><strong>${senderName}</strong> just sent you a new message on <strong>Tijara</strong>.</p>
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

          <p style="color: #888;">If you’re not expecting this, you can ignore this email.</p>
          <p style="margin-top: 40px;">– The Tijara Team</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: "no-reply@tijara.com",
      to: recipientEmail,
      subject: "You've got a new message on Tijara!",
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.log(`Error sending new message email: ${error}`);
    return false;
  }
};
