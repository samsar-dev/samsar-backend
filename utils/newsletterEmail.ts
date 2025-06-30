import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

// Create a reusable transporter object using Gmail SMTP
const transporter = nodemailer.createTransport({
  secure: true,
  host: "smtp.gmail.com",
  port: 465,
  auth: {
    user: "daryannabo16@gmail.com",
    pass: "pgqzjkpisuyzrnzd",
  },
});

export const sendEmail = async (options: EmailOptions) => {
  const from = '"Tijara App" <noreply@tijara.app>';

  const mailOptions = {
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);

    if (process.env.NODE_ENV === "development") {
      console.log("Message sent: %s", info.messageId);
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }

    return info;
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
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info),
    });
    return info;
  } catch (error) {
    console.error("Failed to send newsletter email:", error);
    throw error;
  }
};
