import { Resend } from "resend";
import { config } from "../config/config.js";

/**
 * Sends a password change verification email to the user
 * @param email The email address of the user
 * @param code The verification code
 * @returns {Promise<boolean>} Whether the email was sent successfully
 */
export const sendPasswordChangeEmail = async (
  email: string,
  code: string,
): Promise<boolean> => {
  try {
    // Get the first URL from the comma-separated list or use localhost
    const frontendUrl = (
      process.env.FRONTEND_URL || "http://localhost:5173"
    ).split(",")[0];

    // Check if we're in development mode and should bypass email sending
    const isDevelopment =
      process.env.NODE_ENV === "development" ||
      process.env.NODE_ENV === undefined;

    console.log("Using frontend URL:", frontendUrl);
    console.log("Password change verification code:", code);

    // DEVELOPMENT MODE BYPASS
    // In development, log the verification details but don't try to send an email
    if (isDevelopment) {
      console.log("DEVELOPMENT MODE: Email sending bypassed");
      console.log("----------------------------------------");
      console.log("PASSWORD CHANGE VERIFICATION DETAILS:");
      console.log("Email:", email);
      console.log("Verification Code:", code);
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

    console.log("Attempting to send password change email to:", email);

    // Create HTML email content with verification code
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <h2 style="color: #333; text-align: center;">Password Change Request</h2>
        <p>You recently requested to change your password. Please use the verification code below to complete this process:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="font-size: 32px; letter-spacing: 8px; font-weight: bold; background-color: #f5f5f5; padding: 15px; border-radius: 4px; display: inline-block;">${code}</div>
        </div>
        <p>Enter this code on the password change page to verify your identity.</p>
        <p>This verification code will expire in 24 hours.</p>
        <p>If you did not request a password change, please secure your account by changing your password immediately.</p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;">
        <p style="color: #777; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Tijara App. All rights reserved.</p>
      </div>
    `;

    // Debug log the config
    console.log('Password email config:', {
      hasResendApiKey: !!config.email.resendApiKey,
      fromEmail: config.email.from,
      envEmailFrom: process.env.EMAIL_FROM,
      nodeEnv: process.env.NODE_ENV
    });

    // Send email using Resend
    console.log(
      "Sending password change email with Resend using API key:",
      config.email.resendApiKey ? '***' + config.email.resendApiKey.slice(-4) : 'not set'
    );
    
    // Use configured from email or default to a valid domain
    const fromEmail = config.email.from || 'noreply@samsar.app';
    
    // Validate email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.error('Invalid email address format:', email);
      return false;
    }
    
    console.log(`Sending password change email from ${fromEmail} to ${email}`);
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Password Change Verification",
      html: htmlContent,
      text: `Your password change verification code is: ${code}\n\nEnter this code on the password change page to verify your identity.\n\nThis code will expire in 24 hours.`,
    });

    if (error) {
      console.error("Error sending password change email with Resend:", error);
      return false;
    }

    console.log("Password change email sent successfully:", {
      id: data?.id,
      to: email,
    });

    return true;
  } catch (error) {
    console.error("Error sending password change email:", error);
    return false;
  }
};
