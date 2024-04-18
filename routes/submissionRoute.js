import express from 'express';
const router = express.Router();
import {addSubmission,getSubmissionById,getSubmissionByTestId,getSubmissionByCompanyId, getSubmissionByCandidateId} from '../controllers/submissionController.js';

// Add submission
router.post('/', addSubmission);

// Get submission by ID
router.get('/:submissionId', getSubmissionById);

// Get Submission by test_ID
router.get('/test/:testId', getSubmissionByTestId);

// Get submission by company_ID
router.get('/company/:companyId', getSubmissionByCompanyId);
// Get submission by company_ID
router.get('/candidate/:candidateId', getSubmissionByCandidateId);

export default router;
