import { TransactionalEmailsApi, TransactionalEmailsApiApiKeys, SendSmtpEmail } from '@getbrevo/brevo';
import { config } from "../config/config.js";

// Initialize Brevo client
const apiInstance = new TransactionalEmailsApi();
apiInstance.setApiKey(TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY || '');

// Check if Brevo is ready
const isBrevoReady = () => {
  if (process.env.BREVO_API_KEY) {
    return true;
  } else {
    console.error('❌ BREVO_API_KEY not found in environment variables');
    return false;
  }
};

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
  if (!isBrevoReady()) {
    throw new Error('Brevo is not properly configured. Please check BREVO_API_KEY environment variable.');
  }

  try {
    console.log("Password change verification code:", code);

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
        <p style="color: #777; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Samsar App. All rights reserved.</p>
      </div>
    `;

    // Validate email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.error("Invalid email address format:", email);
      return false;
    }

    console.log(`📧 Sending password change email to ${email} using Brevo`);

    const sendSmtpEmail = new SendSmtpEmail();
    sendSmtpEmail.subject = "Password Change Verification";
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.textContent = `Your password change verification code is: ${code}\n\nEnter this code on the password change page to verify your identity.\n\nThis code will expire in 24 hours.`;
    sendSmtpEmail.sender = { name: "Samsar Team", email: process.env.EMAIL_FROM || "noreply@samsardeals.com" };
    sendSmtpEmail.to = [{ email: email, name: "User" }];

    await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log("✅ Password change email sent successfully to:", email);
    return true;
  } catch (error) {
    console.error("❌ Error sending password change email:", error);
    return false;
  }
};
