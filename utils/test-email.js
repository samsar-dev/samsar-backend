import nodemailer from "nodemailer";

const testEmailConnection = async () => {
  console.log('Testing Gmail SMTP connection...');
  
  const transporter = nodemailer.createTransport({
    secure: true,
    host: "smtp.gmail.com",
    port: 465,
    auth: {
      user: "daryannabo16@gmail.com",
      pass: "pgqzjkpisuyzrnzd",
    },
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
  });

  try {
    // Verify connection
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');

    // Send test email
    console.log('Sending test email...');
    const result = await transporter.sendMail({
      from: "daryannabo16@gmail.com",
      to: "daryannabo16@gmail.com",
      subject: "Test Email - Samsar Verification",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Test Email</h2>
          <p>This is a test email to verify SMTP configuration.</p>
          <p>Time: ${new Date().toISOString()}</p>
        </div>
      `,
      text: `Test email sent at ${new Date().toISOString()}`,
    });

    console.log('✅ Test email sent successfully');
    console.log('Email result:', result);
    
  } catch (error) {
    console.error('❌ Email test failed:', error);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔧 AUTHENTICATION ISSUE DETECTED:');
      console.log('1. Check if 2-Factor Authentication is enabled on Gmail');
      console.log('2. Generate a new App Password:');
      console.log('   - Go to Google Account settings');
      console.log('   - Security → 2-Step Verification → App passwords');
      console.log('   - Generate new password for "Mail"');
      console.log('3. Update the password in email.temp.utils.ts');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('\n🔧 CONNECTION TIMEOUT:');
      console.log('1. Check network connectivity');
      console.log('2. Verify Gmail SMTP is not blocked by firewall');
      console.log('3. Try using port 587 with TLS instead of 465 SSL');
    }
  }
};

testEmailConnection();
