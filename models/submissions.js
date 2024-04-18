import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  test_id: {
    type: String,
    required: true,
  },
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  candidate_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  answers: [{
    answer: {
      type: String,
    },
    time_taken: {
      type: Number,
    },
  }],
  test_score: {
    type: Number,
  },
  time_taken: {
    type: Number,
  },
  looking_away_time: {
      type: Number,
      default: 0
  },
  outoftab_time: {   
      type: Number,
      default: 0
  },
});

const Submission = mongoose.model("Submission", submissionSchema);

export default Submission;
