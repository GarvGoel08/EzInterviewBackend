import express from 'express';

import { verifyToken } from '../utils/verifyUser.js';
import { chatReq, getAllQuestionsByInterviewerId, getTestQuestion, sendEmails } from '../controllers/gptController.js';


const router = express.Router();



router.post('/auto-generate', chatReq);
router.get('/get-question/:testId', getTestQuestion);
router.get('/get-all-question', getAllQuestionsByInterviewerId);
router.post('/send-email', sendEmails);


export default router;