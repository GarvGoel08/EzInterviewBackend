import User from "../models/userModel.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateOTP, sendOTPEmail } from "../utils/otpHandler.js";
import { errorHandler } from "../utils/error.js";

const OTP_EXPIRATION_TIME = 20 * 60 * 1000;

export const signup = async (req, res, next) => {
  const { username, email, password } = req.body;
  if (!email) return next(errorHandler(404, "Email is required!"));
  if (!username) return next(errorHandler(404, "Username is required!"));
  if (!password) return next(errorHandler(404, "Password is required!"));

  const otp = generateOTP();

  const hashedPassword = bcryptjs.hashSync(password, 10);
  const newUser = new User({
    username,
    email,
    password: hashedPassword,
    otp: {
      code: otp,
      expirationTime: Date.now() + OTP_EXPIRATION_TIME,
    },
  });

  await newUser.save();

  await sendOTPEmail(email, otp);
  res
    .status(201)
    .json(
      "User created successfully! Please check your email for OTP verification."
    );

  try {
  } catch (error) {
    next(error);
  }
};

export const verifyOTP = async (req, res, next) => {
  const { email, otp } = req.body;
  console.log("Email:", email);
  console.log("OTP:", otp);

  try {
    const user = await User.findOne({ email });
    console.log("User:", user);

    if (!user) {
      return next(errorHandler(404, "User not found!"));
    }

    if (!user.otp || otp !== user.otp.code) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (Date.now() > user.otp.expirationTime) {
      return res.status(400).json({ error: "OTP has expired" });
    }

    // Clear OTP data from user
    user.otp.code = null;
    user.otp.expirationTime = null;
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    // Exclude sensitive data from response
    const { password: pass, otp: userOtp, ...rest } = user._doc;

    // Set JWT token in cookie and send user data in response

    res.status(200).json({ token, user: rest });
  } catch (error) {
    next(error);
  }
};

export const signin = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email) return next(errorHandler(404, "Email is required!"));
  try {
    const validUser = await User.findOne({ email });
    if (!validUser) return next(errorHandler(404, "User not found!"));
    const validPassword = bcryptjs.compareSync(password, validUser.password);
    if (!validPassword) return next(errorHandler(401, "Wrong credentials!"));
    const token = jwt.sign({ id: validUser._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    const { password: pass, ...rest } = validUser._doc;
    res.status(200).json({ token, user: rest });
  } catch (error) {
    next(error);
  }
};

export const google = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      const { password: pass, ...rest } = user._doc;
      res
        .cookie("access_token", token, {
          httpOnly: true,
          domain: "ec2-3-108-55-125.ap-south-1.compute.amazonaws.com",
        })
        .status(200)
        .json(rest);
    } else {
      const generatedPassword =
        Math.random().toString(36).slice(-8) +
        Math.random().toString(36).slice(-8);
      const hashedPassword = bcryptjs.hashSync(generatedPassword, 10);
      const newUser = new User({
        username:
          req.body.name.split(" ").join("").toLowerCase() +
          Math.random().toString(36).slice(-4),
        email: req.body.email,
        password: hashedPassword,
        avatar: req.body.photo,
      });
      await newUser.save();
      const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);
      const { password: pass, ...rest } = newUser._doc;
      res
        .cookie("access_token", token, {
          httpOnly: true,

          domain: "ec2-3-108-55-125.ap-south-1.compute.amazonaws.com",

          path: "/",
        })
        .status(200)
        .json(rest);
    }
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  if (req.user.id !== req.params.id)
    return next(errorHandler(401, "You can only update your own account!"));

  if (req.body.password) {
    req.body.password = bcryptjs.hashSync(req.body.password, 10);
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        avatar: req.body.avatar,
      },
    },
    { new: true }
  );

  const { password, ...rest } = updatedUser._doc;

  res.status(200).json(rest);
};

export const signOut = async (req, res, next) => {
  try {
    res.clearCookie("access_token");
    res.status(200).json("User has been logged out!");
  } catch (error) {
    next(error);
  }
};
