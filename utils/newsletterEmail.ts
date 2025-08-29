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
    return false;
  }
};

export const sendEmail = async (options: EmailOptions) => {
  if (!isBrevoReady()) {
    throw new Error('Brevo is not properly configured. Please check BREVO_API_KEY environment variable.');
  }

  try {

    const sendSmtpEmail = new SendSmtpEmail();
    sendSmtpEmail.subject = options.subject;
    sendSmtpEmail.htmlContent = options.html || '';
    sendSmtpEmail.textContent = options.text || options.html?.replace(/<[^>]*>/g, '') || '';
    sendSmtpEmail.sender = { name: "Samsar App", email: process.env.EMAIL_FROM || "noreply@samsardeals.com" };
    sendSmtpEmail.to = [{ email: options.to, name: "User" }];

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    if (process.env.NODE_ENV === "development") {
    }

    return result;
  } catch (error) {
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
    return info;
  } catch (error) {
    throw error;
  }
};
