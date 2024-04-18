import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar:{
      type: String,
      default: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
    },
    otp: {
      code: {
        type: String,
        default: null,
      },
      expirationTime: {
        type: Date,
        default: null,
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("users", userSchema);
