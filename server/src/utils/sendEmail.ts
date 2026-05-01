import { ISendEmail } from "../config/interface";
import nodemailer from "nodemailer";

export const sendEmail = async (data: ISendEmail) => {
  try {
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.MAIL_ID, 
        pass: process.env.MAIL_PASSWORD, // YAHAN NORMAL GMAIL PASSWORD NAHI, APP PASSWORD LAGEGA!
      },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: `"Intwit Support" <${process.env.MAIL_ID}>`, // Purane developer ka naam hata diya
      to: data.to, 
      subject: data.subject, 
      html: data.html, 
    });

    console.log("✅ Message sent successfully: %s", info.messageId);

  } catch (error: any) {
    console.error("❌ Email bhejne mein error aaya:", error.message);
    if (error.responseCode === 535) {
      console.log("🚨 GOOGLE SECURITY ERROR: Tera Gmail password accept nahi ho raha hai. Tujhe .env mein 'App Password' daalna padega!");
    }
  }
};