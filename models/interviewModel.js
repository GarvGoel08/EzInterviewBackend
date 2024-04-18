import mongoose from "mongoose";
const { Schema } = mongoose;
 
const interviewSchema = new Schema({
    candidate_id: {
        type: Schema.Types.ObjectId,
        ref: 'Candidate',
        required: true
    },
    candidate_name: {
        type: String,
        required: true
    },
    candidate_role: {
        type: String,
        required: true
    },
    company_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    scheduled_time: {
        type: Date,
        required: true
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    looking_away_time: {
        type: Number,
        default: 0
    },
    outoftab_time: {   
        type: Number,
        default: 0
    },
    remark: {
        type: String
    },
    rating: {
        type: Number,
        
    },
    total_interview_time: {
        type: Number
    }
});

export default mongoose.model("interview", interviewSchema);
