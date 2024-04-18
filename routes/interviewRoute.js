import express from 'express';
import {createInterview,getInterviews, getInterviewsByCandidateId, postInterviewFeedback} from '../controllers/interviewController.js'

const router = express.Router();

router.post('/create', createInterview);
router.get('/get/:id', getInterviews);
router.get('/getByCandidate/:id', getInterviewsByCandidateId);
router.post('/feedback/:candidate_id', postInterviewFeedback);

export default router;