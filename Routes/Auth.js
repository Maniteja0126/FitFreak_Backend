const express = require("express");
const router = express.Router();
const User = require("../Models/UserSchema");
const errorHandler = require("../Middlewares/errorMiddleware");
const authTokenHandler = require("../Middlewares/checkAuthToken");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
require("dotenv").config();
// jqcg ttek ldky zknz

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "maniteja2601@gmail.com",
    pass: "jqcgttekldkyzknz",
  },
});

router.get("/test", async (req, res) => {
  res.json({
    message: "Auth api is working",
  });
});

const CreateResponse = (ok, message, data) => {
  return {ok, message, data}
};
router.post("/register", async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      weightInKg,
      heightInCm,
      gender,
      dob,
      goal,
      activityLevel,
    } = req.body;
    const existingUser = await User.findOne({ email: email });

    if (existingUser) {
      return res
        .status(409)
        .json(CreateResponse(false, " Email already exists"));
    }

    const newUser = new User({
      name,
      password,
      email,
      weight: [
        {
          weight: weightInKg,
          unit: "kg",
          date: Date.now(),
        },
      ],
      height: [
        {
          height: heightInCm,
          unit: "cm",
          date: Date.now(),
        },
      ],
      gender,
      dob,
      goal,
      activityLevel,
    });
    await newUser.save();
    res.status(201).json(CreateResponse(true, "User registered successfully"));
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json(CreateResponse(false, "Invalid credentials"));
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json(CreateResponse(false, "Invalid credentials"));
    }

    const authToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "50m" }
    );
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET_KET,
      { expiresIn: "100m" }
    );

    res.cookie("authToken", authToken, { httpOnly: true });
    res.cookie("refreshToken", refreshToken, { httpOnly: true });
    res.status(200).json(
      CreateResponse(true, "Login successful", {
        authToken,
        refreshToken,
      })
    );
  } catch (err) {
    next(err);
  }
});
router.post("/sendotp", async (req, res) => {
  try {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000);

    const mailOptions = {
      from: "maniteja2601@gmail.com",
      to: email,
      subject: "OTP for verification",
      text: `Your OTP is ${otp}`,
    };

    transporter.sendMail(mailOptions, async (err, info) => {
      if (err) {
        console.log(err);
        res.status(500).json(CreateResponse(false, err.message));
      } else {
        res.json(CreateResponse(true, "OTP sent successfully", { otp }));
      }
    });
  } catch (error) {
    next(error);
  }
});
router.post("/checklogin", authTokenHandler, async (req, res) => {
  try {
    res.json({
      ok: true,
      message: "User authenticated successfully",
    });
  } catch (error) {
    next(error);
  }
});

router.use(errorHandler);

module.exports = router;
