import { TransactionalEmailsApi, TransactionalEmailsApiApiKeys, SendSmtpEmail } from '@getbrevo/brevo';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

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

export const sendEmail = async (options: EmailOptions) => {
  if (!isBrevoReady()) {
    throw new Error('Brevo is not properly configured. Please check BREVO_API_KEY environment variable.');
  }

  try {
    console.log(`📧 Sending email via Brevo to: ${options.to}`);

    const sendSmtpEmail = new SendSmtpEmail();
    sendSmtpEmail.subject = options.subject;
    sendSmtpEmail.htmlContent = options.html || '';
    sendSmtpEmail.textContent = options.text || options.html?.replace(/<[^>]*>/g, '') || '';
    sendSmtpEmail.sender = { name: "Samsar App", email: process.env.EMAIL_FROM || "noreply@samsardeals.com" };
    sendSmtpEmail.to = [{ email: options.to, name: "User" }];

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    if (process.env.NODE_ENV === "development") {
      console.log("Message sent: %s", result.body?.messageId || 'N/A');
    }

    return result;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

export const sendNewsletterEmail = async (
  to: string,
  subject: string,
  content: string,
  isHtml: boolean,
) => {
  const emailOptions: EmailOptions = {
    to,
    subject,
  };

  if (isHtml) {
    emailOptions.html = content;
  } else {
    emailOptions.text = content;
  }

  try {
    const info = await sendEmail(emailOptions);
    console.log("Newsletter email sent:", {
      to,
      subject,
      messageId: info.body?.messageId || 'N/A',
    });
    return info;
  } catch (error) {
    console.error("Failed to send newsletter email:", error);
    throw error;
  }
};
