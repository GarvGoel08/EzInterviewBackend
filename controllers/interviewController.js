import Interview from "../models/interviewModel.js";
import Candidate from "../models/candidateModel.js";
import { errorHandler } from "../utils/error.js";
import moment from "moment";
import user from "../models/userModel.js";

import nodemailer from "nodemailer";
import dotenv from "dotenv";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});
dotenv.config();

export const createInterview = async (req, res, next) => {
  const {
    candidate_id,
    candidate_name,
    candidate_role,
    company_id,
    scheduled_time,
    room_id,
  } = req.body;
  if (!candidate_id)
    return next(errorHandler(404, "Candidate ID is required!"));
  if (!company_id) return next(errorHandler(404, "Company ID is required!"));
  if (!scheduled_time)
    return next(errorHandler(404, "Scheduled Time is required!"));

  try {
    const newInterview = new Interview({
      candidate_id,
      candidate_name,
      candidate_role,
      company_id,
      scheduled_time,
    });

    await newInterview.save();
    const candidate = await Candidate.findByIdAndUpdate(candidate_id, {
      current_status: "Interview Scheduled",
    });
    const interviewTime = moment(newInterview.scheduled_time).utcOffset(
      "+05:30"
    );
    const company = await user.findById(company_id);

    const formattedTime = interviewTime.format("Do MMMM YYYY, h:mm A");
    const email = candidate.email;
    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: "Interview Scheduled!",
      html: `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Interview Invitation</title>
        <style>
          /* Global styles */
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background-color: #333!important;
          }
          .MainContainer{
            background-color: #1c1c1c!important;
            padding-top: 20px;
          }
      
          /* Container styles */
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #222;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
          }
      
          /* Header styles */
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
      
          .header h1 {
            color: #007bff;
            margin-top: 0;
          }
      
          /* Content styles */
          .content {
            margin-bottom: 20px;
          }
      
          .content p {
            color: #ddd;
            margin-bottom: 10px;
          }
      
          /* Button styles */
          .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #007bff;
            color: #fff!important;
            text-decoration: none;
            border-radius: 5px;
          }
      
          /* Footer styles */
          .footer {
            background-color: #333;
            color: #fff;
            padding: 20px;
            text-align: center;
            border-bottom-left-radius: 10px;
            border-bottom-right-radius: 10px;
            margin-top: 20px;
          }
      
          .footer p {
            margin: 5px 0;
          }
      
          .footer a {
            color: #fff;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="MainContainer">
        <div class="container">
          <div class="header">
            <h1>Interview Invitation</h1>
          </div>
          <div class="content">
            <p>Dear ${candidate.name},</p>
            <p>We are pleased to invite you to an interview for the position of ${candidate.role} at ${company.username}.</p>
            <p>The interview will be held on ${formattedTime}.</p>
            <p>Please join the meet on time.</p>
            <a href="https://ezinterview.vercel.app/meet/${newInterview._id}" class="button">Join Interview</a>
            <p>Best regards,<br>${company.username}</p>
          </div>
        </div>
        <div class="footer">
          <p>Email: <a href="mailto:ezinterview01@gmail.com">ezinterview01@gmail.com</a></p>
          <p>Phone: <a href="tel:+919871812115">+91 9871812115</a></p>
        </div>
        </div>
      </body>
      </html>
      `,
    };
    await transporter.sendMail(mailOptions);
    res.status(201).json("Interview created successfully!");
  } catch {
    next(error);
  }
};

export const getInterviews = async (req, res, next) => {
  try {
    const interviews = await Interview.find({ company_id: req.params.id });
    res.status(200).json(interviews);
  } catch {
    next(error);
  }
};
export const getInterviewsByCandidateId = async (req, res, next) => {
  try {
    const interviews = await Interview.find({ candidate_id: req.params.id });
    res.status(200).json(interviews);
  } catch {
    next(error);
  }
};

export const postInterviewFeedback = async (req, res, next) => {
  try {
    const { rating, remark } = req.body;

    const interview = await Interview.findOneAndUpdate(
      { candidate_id: req.params.candidate_id },
      { rating, remark },
      { new: true }
    );

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    res
      .status(200)
      .json({ message: "Feedback submitted successfully", interview });
  } catch (error) {
    next(error); // Pass error to the error handling middleware
  }
};
