import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

// Initialize MailerSend client
const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY || "",
});

// Check if MailerSend is ready
const isMailerSendReady = () => {
  if (process.env.MAILERSEND_API_KEY) {
    return true;
  } else {
    console.error('❌ MAILERSEND_API_KEY not found in environment variables');
    return false;
  }
};

export const sendEmail = async (options: EmailOptions) => {
  if (!isMailerSendReady()) {
    throw new Error('MailerSend is not properly configured. Please check MAILERSEND_API_KEY environment variable.');
  }

  try {
    console.log(`📧 Sending email via MailerSend to: ${options.to}`);

    // Use MailerSend trial domain for sending
    const sentFrom = new Sender("noreply@test-51ndgwvnoxdlzqx8.mlsender.net", "Samsar App");
    const recipients = [new Recipient(options.to, "User")];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(options.subject)
      .setHtml(options.html || '')
      .setText(options.text || options.html?.replace(/<[^>]*>/g, '') || '');

    const result = await mailerSend.email.send(emailParams);
    
    if (process.env.NODE_ENV === "development") {
      console.log("Message sent: %s", result.body?.message_id || 'N/A');
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
      messageId: info.body?.message_id || 'N/A',
    });
    return info;
  } catch (error) {
    console.error("Failed to send newsletter email:", error);
    throw error;
  }
};
