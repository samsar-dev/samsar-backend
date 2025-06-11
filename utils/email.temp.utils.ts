import { randomBytes } from "crypto";
import prisma from "../src/lib/prismaClient.js";  
import nodemailer from "nodemailer";
import { boolean } from "zod";

const transporter = nodemailer.createTransport(
    {
        secure: true,
        host: "smtp.gmail.com",
        port: 465,
        auth: {
            user: "daryannabo16@gmail.com",
            pass: "pgqzjkpisuyzrnzd" //yet to be provided
        }
    }
);


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


export const sendVerificationEmail = async (email: string, tokenInfo: { token: string; code: string }): Promise<boolean> => {
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

        transporter.sendMail(
            {
                from: "no-reply@tijara.com",
                to: email,
                subject: "Tijara verification email",
                html: htmlContent
            }
        );

        return true;
        
    } catch (error) {
        console.log(`Error in sending email verification code with nodemailer and error is: ${error}`);
        return false;
    }
}
