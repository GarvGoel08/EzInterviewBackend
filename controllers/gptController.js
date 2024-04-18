import Candidate from "../models/candidateModel.js";
import mongoose from 'mongoose';
import Prompt from './../models/gptModel.js'; 
import user from './../models/userModel.js';


import nodemailer from 'nodemailer';
import { OpenAI } from "openai";
import dotenv from "dotenv";

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
  },
});
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


export const chatReq = async (req, res) => {
  try {
    const question = req.body.question + "give 4 option to each question in forms of A. Option, B. Option, C. in an array and should contain A,B,C,D" + " also give correct option containing only corresponding alphabet " +"it should be in json format and also provide id to each question";
    const interviewerId = req.body.user;
    const testId = req.body.testId;
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: question }],
      temperature: 0,
      max_tokens: 1000,
    });

    const aiResponse = response.choices[0].message.content;
    const json = JSON.parse(aiResponse);

    // Save new response to the database
    const newPrompt = new Prompt({
      interviewerId: interviewerId,
      prompt: question,
      questions: json.questions,
      testId
    });
    await newPrompt.save();

    res.status(200).json(json);
  } catch (err) {
    console.log(err); 
    res.status(500).json(err.message);
  }
};
export const getTestQuestion = async (req, res) => {
  try {
    const testId = req.params.testId; 
    console.log(testId);
    const questions = await Prompt.find({ testId: testId });
    
    if (!questions) {
      return res.status(404).json({ message: 'Test questions not found' });
    }

    res.status(200).json(questions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const getAllQuestionsByInterviewerId = async (req, res) => {
  try {
    const interviewerId = req.body.interviewerId; 
    const questions = await Prompt.find({ interviewerId: interviewerId }); 
    
    if (!questions) {
      return res.status(404).json({ message: 'Questions not found for this interviewer' });
    }

    res.status(200).json(questions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const sendEmails = async (req, res) => {
  try {
    const candidateIds = req.body.candidateIds;
    const companyId = req.body.companyId;
    const testId = req.body.testId;
    const company = await user.findById(companyId);

    // Send email to each candidate
    candidateIds.forEach(async (candidateId) => {
      const candidate = await Candidate.findById(candidateId);
      await Candidate.findByIdAndUpdate(candidateId, { current_status: "Screening In Progress" });
      const email = candidate.email;
      const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: email,
        subject: 'Interview Test',
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
              <h1>Test Assigned</h1>
            </div>
            <div class="content">
              <p>Dear ${candidate.name},</p>
              <p>We would like to invite you to take a test for the position of ${candidate.role} at ${company.username}.</p>
              <p>Please click the button below to access the test.</p>
              <a href="https://ezinterview.vercel.app/candidates/${candidateId}/test/${testId}" class="button">Take Test</a>
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
    }); 
    res.status(200).json({ message: 'Emails sent successfully' });  
  } catch (err) {  
    res.status(500).json({ message: err.message });
  }
};




