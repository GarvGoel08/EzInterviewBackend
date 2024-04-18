import express from "express";
import colors from "colors";
import dotenv from "dotenv";
import morgan from "morgan";
import connectDB from "./config/conn.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { Server } from "socket.io";

dotenv.config();

connectDB();

const app = express();

const corsOptions = {
  origin: ["http://localhost:3000", "https://ez-interview-frontend.vercel.app"],
  optionsSuccessStatus: 200, // Corrected property name
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());

import candidateRouter from "./routes/candidateRoute.js";
import userRouter from "./routes/userRoute.js";
import interviewRouter from "./routes/interviewRoute.js";
import gptRouter from "./routes/gptRoute.js";
import submissionRouter from "./routes/submissionRoute.js";

app.use("/api/candidate", candidateRouter);
app.use("/api/test", gptRouter);
app.use("/api/user", userRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/submission", submissionRouter);

const PORT = process.env.PORT || 8080;

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

const server = app.listen(PORT, () => {
  console.log(
    `Server Running on ${process.env.DEV_MODE} mode on port ${PORT}`.bgCyan
      .white
  );
});

// Socket.io Connection
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://ez-interview-frontend.vercel.app",
    ],
    methods: ["GET", "POST"],
  },
});

import interview from "./models/interviewModel.js";
import Candidate from "./models/candidateModel.js";
import Submission from "./models/submissions.js";
import Prompt from "./models/gptModel.js";

io.on("connection", (socket) => {
  socket.on("connect-room", async ({ roomID }) => {
    socket.join(roomID);
    let outOfTabTimestamp;
    let lookAwayTimestamp = 0;
    socket.on("look-away", () => {
      socket.broadcast.to(roomID).emit("look-away");
      lookAwayTimestamp += 1;
    });
    socket.on("look-back", async () => {
      socket.broadcast.to(roomID).emit("look-back");
      if (
        !isNaN(parseFloat(lookAwayTimestamp)) &&
        isFinite(lookAwayTimestamp)
      ) {
        await interview.findByIdAndUpdate(roomID, {
          $inc: { looking_away_time: lookAwayTimestamp },
          isCompleted: true,
        });
      } else {
        console.error("Invalid lookAwayTimestamp:", lookAwayTimestamp);
      }
      lookAwayTimestamp = 0;
    });
    socket.on("out-of-tab", () => {
      socket.broadcast.to(roomID).emit("out-of-tab");
      outOfTabTimestamp = Date.now();
    });
    socket.on("back-in-tab", async () => {
      socket.broadcast.to(roomID).emit("back-in-tab");
      const timeSpent = Date.now() - outOfTabTimestamp;
      if (!isNaN(parseFloat(timeSpent)) && isFinite(timeSpent)) {
        const int = await interview.findByIdAndUpdate(roomID, {
          $inc: { outoftab_time: timeSpent / 1000 },
        });
      }
    });
  });
  socket.on("connect-test", async ({ testID, candidate_id }) => {
    socket.join(testID);
    const test = await Prompt.find({ testId: testID });
    if (!test) {
      socket.emit("test-not-found");
      socket.disconnect();
      return;
    }
    const company_id = test[0].interviewerId;

    // Check if submission already exists
    const existingSubmission = await Submission.findOne({
      test_id: testID,
      candidate_id,
      company_id,
    });
    if (existingSubmission) {
      socket.emit("submission-exists");
      socket.disconnect();
      return; // Added to stop further execution
    }

    const submission = new Submission({
      test_id: testID,
      company_id,
      candidate_id,
    });
    await submission.save();

    let outOfTabTimestamp;
    let lookAwayTimestamp = 0;
    socket.on("look-away", () => {
      socket.broadcast.to(testID).emit("look-away");
      lookAwayTimestamp += 1;
    });
    socket.on("look-back", async () => {
      socket.broadcast.to(testID).emit("look-back");
      if (
        !isNaN(parseFloat(lookAwayTimestamp)) &&
        isFinite(lookAwayTimestamp)
      ) {
        await Submission.findByIdAndUpdate(submission._id, {
          $inc: { looking_away_time: lookAwayTimestamp },
          isCompleted: true,
        });
      } else {
        console.error("Invalid lookAwayTimestamp:", lookAwayTimestamp);
      }
      lookAwayTimestamp = 0;
    });
    socket.on("out-of-tab", () => {
      socket.broadcast.to(testID).emit("out-of-tab");
      outOfTabTimestamp = Date.now();
      console.log("Out of Tab");
    });
    socket.on("back-in-tab", async () => {
      socket.broadcast.to(testID).emit("back-in-tab");
      const timeSpent = Date.now() - outOfTabTimestamp;
      console.log("Back in Tab" + timeSpent);
      if (!isNaN(parseFloat(timeSpent)) && isFinite(timeSpent)) {
        const int = await Submission.findByIdAndUpdate(submission._id, {
          $inc: { outoftab_time: timeSpent / 1000 },
        });
      }
    });
    socket.on("Answer", async ({ questionNo, answer, time_taken }) => {
      submission.answers.push({ answer, time_taken });
      await submission.save();
    });
    socket.on("End-Test", async ({totalScore, totalTime}) => {
      await Submission.findByIdAndUpdate(submission._id, { test_score: totalScore, time_taken: totalTime });
      await Candidate.findByIdAndUpdate(candidate_id, {
        current_status: "Test Submitted",
      });
      socket.disconnect();
    });
  });
});
