import Candidate from "../models/candidateModel.js";
import { errorHandler } from "../utils/error.js";
import Submissions from "../models/submissions.js";
import Interviews from "../models/interviewModel.js";
import user from "../models/userModel.js";

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

export const createCandidate = async (req, res, next) => {
  const { name, email, contact, skills, role, current_status, company_id } =
    req.body;

  if (!name) return next(errorHandler(401, "Name is required"));
  if (!email) return next(errorHandler(401, "Email is required"));
  if (!contact) return next(errorHandler(401, "Contact is required"));
  if (!skills || !Array.isArray(skills) || skills.length === 0)
    return next(errorHandler(401, "Skills are required"));
  if (!role) return next(errorHandler(401, "Role is required"));
  if (!current_status)
    return next(errorHandler(401, "Current status is required"));
  if (!company_id) return next(errorHandler(401, "Company ID is required"));

  try {
    const candidate = new Candidate({
      name,
      email,
      contact,
      skills,
      role,
      current_status,
      company_id,
    });

    await candidate.save();
    res.status(201).json(candidate);
  } catch (error) {
    console.log(error);
    next(errorHandler(500, "Internal Server Error"));
  }
};

export const getAllCandidates = async (req, res, next) => {
  try {
    const candidates = await Candidate.find({ company_id: req.params.id });
    res.json(candidates);
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};
export const savePDFURL = async (req, res, next) => {
  try {
    // Destructure the request body to get candidateId and pdf_url
    const { candidateId, pdf_url } = req.body;

    // Find the candidate by ID and update the pdf_url field
    const updatedCandidate = await Candidate.findByIdAndUpdate(
      candidateId,
      { $set: { pdf_url } },
      { new: true }
    );

    // If candidate not found, return an error
    if (!updatedCandidate) {
      return next(errorHandler(404, "Candidate not found"));
    }

    // Return the updated candidate document
    res
      .status(200)
      .json({
        message: "PDF URL saved successfully",
        candidate: updatedCandidate,
      });
  } catch (error) {
    // Handle any errors and return an error response
    console.error("Error saving PDF URL:", error.message);
    next(errorHandler(500, "Internal Server Error"));
  }
};

export const getCandidateById = async (req, res, next) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return next(errorHandler(404, "Candidate not found"));
    }
    res.json(candidate);
  } catch (error) {
    next(errorHandler(500, "Internal Server Error"));
  }
};

export const updateCandidateById = async (req, res, next) => {
  try {
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!candidate) {
      return next(errorHandler(404, "Candidate not found"));
    }
    res.json(candidate);
  } catch (error) {
    next(errorHandler(500, "Internal Server Error"));
  }
};

// Delete a candidate by ID
export const deleteCandidateById = async (req, res, next) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!candidate) {
      return next(errorHandler(404, "Candidate not found"));
    }
    // Delete all submissions for the candidate
    await Submissions.deleteMany({ candidate_id: req.params.id });
    // Delete all interviews for the candidate
    await Interviews.deleteMany({ candidate_id: req.params.id });
    res.json({ message: "Candidate deleted successfully" });
  } catch (error) {
    next(errorHandler(500, "Internal Server Error"));
  }
};
export const updateCandidateStatusById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newStatus } = req.body;

    // Check if the new status is valid
    const validStatuses = ["Waiting", "Screening In Progress", "Test Submitted", "Interview Scheduled", "Hired", "Not Selected"];
    if (!validStatuses.includes(newStatus)) {
      return next(errorHandler(400, "Invalid status"));
    }
    const candidate = await Candidate.findByIdAndUpdate(id, { current_status: newStatus }, { new: true });
    if (!candidate) {
      return next(errorHandler(404, "Candidate not found"));
    }
    const email = candidate.email;
    if (newStatus === "Hired"){
      const company = await user.findById(candidate.company_id);
      const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: email,
        subject: `Hired as ${candidate.role}!`,
        html: `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Test Invitation</title>
          <style>
            /* Global styles */
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              background-color: #1c1c1c;
              color: #fff;
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
              <h1>Congratulations!</h1>
            </div>
            <div class="content">
              <p>Dear ${candidate.name},</p>
              <p>We are pleased to inform you that you have been selected for the position of ${candidate.role} at ${company.username}.</p>
              <p>The HR team will contact you with details and offer letter soon.</p>
              <p>Best regards,<br>${company.username}</p>
            </div>
          </div>
          <div class="footer">
            <p>Email: <a href="mailto:ezinterview01@gmail.com">ezinterview01@gmail.com</a></p>
            <p>Phone:  <a href="tel:+91 9871812115">+91 9871812115</a></p>
          </div>
          </div>
        </body>
        </html>
        `,
      };
      await transporter.sendMail(mailOptions);
    }
    if (newStatus === "Not Selected"){
      const company = await user.findById(candidate.company_id);
      const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: email,
        subject: `Not Selected for role of ${candidate.role}`,
        html: `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Test Invitation</title>
          <style>
            /* Global styles */
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              background-color: #1c1c1c;
              color: #fff;
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
              <h1>Job Application Status</h1>
            </div>
            <div class="content">
              <p>Dear ${candidate.name},</p>
              <p>Thank you for your interest in the position of ${candidate.role} at ${company.username}.</p>
              <p>After careful consideration, we regret to inform you that you have not been selected for this position.</p>
              <p>We appreciate the time you invested in the application process and wish you the best of luck in your future endeavors.</p>
              <p>Best regards,<br>${company.username}</p>
            </div>
          </div>
          <div class="footer">
            <p>Email: <a href="mailto:ezinterview01@gmail.com">ezinterview01@gmail.com</a></p>
            <p>Phone:  <a href="tel:+91 9871812115">+91 9871812115</a></p>
          </div>
          </div>
        </body>
        </html>
        `
      };
      await transporter.sendMail(mailOptions);
    }
    res.json({ message: "Candidate status updated successfully", candidate });
  } catch (error) {
    console.error("Error updating candidate status:", error.message);
    next(errorHandler(500, "Internal Server Error"));
  }
};