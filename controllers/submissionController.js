import Submission from '../models/submissions.js';
import Candidate from "../models/candidateModel.js";
import Prompt from './../models/gptModel.js'; 

// Add submission
export const addSubmission = async (req, res) => {
  try {
    const { test_id, candidate_id, answers, test_score, time_taken } = req.body;
    const answersArray = Object.values(answers);
    const test = await Prompt.find({ testId: test_id });
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    const company_id = test[0].interviewerId;
    
    // Check if submission already exists
    const existingSubmission = await Submission.findOne({
      test_id,
      candidate_id,
      company_id,
    });
    if (existingSubmission) {
      return res.status(409).json({ message: 'Submission already exists' });
    }
    
    const submission = new Submission({
      test_id,
      company_id,
      candidate_id,
      test_score,
      time_taken,
      answers: answersArray,
    });
    await submission.save();
    await Candidate.findByIdAndUpdate(candidate_id, { current_status: "Test Submitted" });
    res.status(201).json({ message: 'Submission added successfully', submission });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get submission by ID
export const getSubmissionById = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.submissionId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    res.status(200).json(submission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Submission by test_ID
export const getSubmissionByTestId = async (req, res) => {
  try {
    const submissions = await Submission.find({ test_id: req.params.testId });
    res.status(200).json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get submission by company_ID
export const getSubmissionByCompanyId = async (req, res) => {
  try {
    const submissions = await Submission.find({ company_id: req.params.companyId });
    res.status(200).json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSubmissionByCandidateId = async (req, res) => {
  try {
    const submissions = await Submission.find({ candidate_id: req.params.candidateId });
    res.status(200).json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
