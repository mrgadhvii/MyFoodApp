import { google } from 'googleapis';

const GMAIL_CLIENT_ID = '72670719707-ulefq8l0gofqedt9a20kus6e47bv0pk6.apps.googleusercontent.com';
const GMAIL_CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost:1234';
const REFRESH_TOKEN = ''; // You'll need to get this from OAuth2 flow

const oauth2Client = new google.auth.OAuth2(
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: REFRESH_TOKEN
});

const gmail = google.gmail({
  version: 'v1',
  auth: oauth2Client
});

export const sendPasswordResetEmail = async (to, resetLink) => {
  try {
    const emailContent = `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #6a0dad;">Reset Your Password</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password for your Food Delivery account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetLink}" 
             style="display: inline-block; 
                    background: linear-gradient(45deg, #6a0dad, #9d4edd); 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    margin: 20px 0;">
            Reset Password
          </a>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <p>This link will expire in 1 hour for security reasons.</p>
          <p>Best regards,<br>Food Delivery Team</p>
        </body>
      </html>
    `;

    const encodedEmail = Buffer.from(
      `To: ${to}\r\n` +
      'Subject: Reset Your Food Delivery Password\r\n' +
      'Content-Type: text/html; charset=utf-8\r\n\r\n' +
      emailContent
    ).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    });

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
