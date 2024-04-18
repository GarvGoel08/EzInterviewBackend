import nodemailer from 'nodemailer';

import dotenv from "dotenv";
dotenv.config();
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
    },
});

export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export const sendOTPEmail = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: email,
        subject: 'OTP Verification',
        text: `Your OTP for verification is: ${otp}. It will expire in 5 minutes.`,
    };

    await transporter.sendMail(mailOptions);
}
