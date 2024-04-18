import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    options: [String],
    correct_option: {
        type: String,
        required: true
    }
});

const promptSchema = new mongoose.Schema({
    interviewerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        // required: true
    },
    prompt : {
        type: String,
        required: true,
    },
    questions: [questionSchema],
    testId : {
        type : String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Prompt = mongoose.model('Prompt', promptSchema);

export default Prompt;
