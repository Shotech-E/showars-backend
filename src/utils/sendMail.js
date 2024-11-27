const axios = require("axios");
const jwt = require("jsonwebtoken");
const User = require("../users/userModel");
const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    // Configure the Gmail SMTP transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER, // Your Gmail address
        pass: process.env.GMAIL_PASSWORD, // Your Gmail password or App Password
      },
    });

    // Email options
    const mailOptions = {
      from: `"Shotech" <${process.env.GMAIL_USER}>`, // Sender address
      to, // Recipient address
      subject, // Email subject
      text, // Plain text body
      html, // HTML body
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

module.exports = sendEmail;

// SENDPULSE MAIL
// const getSendPulseToken = async () => {
//   try {
//     const response = await axios.post(
//       "https://api.sendpulse.com/oauth/access_token",
//       {
//         grant_type: "client_credentials",
//         client_id: process.env.SENDPULSE_CLIENT_ID,
//         client_secret: process.env.SENDPULSE_CLIENT_SECRET,
//       }
//     );
//     return response.data.access_token;
//   } catch (error) {
//     console.error(
//       "Error fetching SendPulse token:",
//       error.response?.data || error.message
//     );
//     throw new Error("Failed to fetch SendPulse token");
//   }
// };

// const sendEmail = async ({ to, subject, text, html }) => {
//   try {
//     const SENDPULSE_API_URL = process.env.SENDPULSE_API_URL;

//     if (!SENDPULSE_API_URL) {
//       throw new Error(
//         "SENDPULSE_API_URL is not defined in the environment variables"
//       );
//     }

//     const accessToken = await getSendPulseToken();

//     const fromEmail = process.env.SENDPULSE_FROM_EMAIL; // Ensure this is set in your .env file
//     if (!fromEmail) {
//       throw new Error(
//         "SENDPULSE_FROM_EMAIL is not defined in the environment variables"
//       );
//     }

//     console.log("Sending email via SendPulse to:", to);
//     console.log("SendPulse API URL:", SENDPULSE_API_URL);

//     await axios.post(
//       SENDPULSE_API_URL,
//       {
//         email: {
//           from: {
//             email: fromEmail, // Use the "from" email
//             name: "Showars Ecommerce", // Optional: Display name
//           },
//           to: [{ email: to }], // Recipients
//           subject, // Subject of the email
//           text, // Plain text version
//           html, // HTML version
//         },
//       },
//       { headers: { Authorization: `Bearer ${accessToken}` } }
//     );

//     console.log("Email sent successfully");
//   } catch (error) {
//     console.error(
//       "Error sending email:",
//       error.response?.data || error.message
//     );
//     throw new Error("Failed to send email");
//   }
// };

// POSTMARK MAIL
// const postmark = require("postmark");
// npm install postmark

// const client = new postmark.ServerClient(process.env.POSTMARK_SERVER_TOKEN);

// const sendEmail = async ({ to, subject, text, html }) => {
//   try {
//     await client.sendEmail({
//       From: "your_verified_email@example.com",
//       To: to,
//       Subject: subject,
//       TextBody: text,
//       HtmlBody: html,
//     });
//     console.log("Email sent");
//   } catch (error) {
//     console.error("Error sending email:", error);
//     throw new Error("Failed to send email");
//   }
// };

// module.exports = sendEmail;


// MAILGUN MAIL  npm install mailgun-js

// const mailgun = require("mailgun-js");

// const mg = mailgun({
//   apiKey: process.env.MAILGUN_API_KEY,
//   domain: process.env.MAILGUN_DOMAIN,
// });

// const sendEmail = async ({ to, subject, text, html }) => {
//   const data = {
//     from: "Your App <your_verified_email@example.com>",
//     to,
//     subject,
//     text,
//     html,
//   };

//   try {
//     await mg.messages().send(data);
//     console.log("Email sent");
//   } catch (error) {
//     console.error("Error sending email:", error);
//     throw new Error("Failed to send email");
//   }
// };

// module.exports = sendEmail;


// SENDGRID MAIL
// npm install @sendgrid/mail
// const sgMail = require('@sendgrid/mail');

// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// const sendEmail = async ({ to, subject, text, html }) => {
//   const msg = {
//     to,
//     from: 'your_verified_email@example.com', // Use a verified sender email
//     subject,
//     text,
//     html,
//   };

//   try {
//     await sgMail.send(msg);
//     console.log('Email sent');
//   } catch (error) {
//     console.error('Error sending email:', error);
//     throw new Error('Failed to send email');
//   }
// };

// module.exports = sendEmail;



