import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import transporter from "../config/nodemailer.js";

// creating a controller for user registration
export const register = async (req, res) => {
  const { name, email, password } = req.body;
  // checking if all the required fields are present
  if (!name || !email || !password) {
    return res.json({ success: false, message: "Missing details!" });
  }
  try {
    // checking if User already exists from the database
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "User already exists!" });
    }
    // If user doesn't exist creating a hashed password to save in database
    const hashedPassword = await bcrypt.hash(password, 10);

    // creating a new user using name, email and hashed password
    const user = new userModel({ name, email, password: hashedPassword });
    await user.save(); // Saving the new user in database

    // generating token using JWT provided the token expires in 7 days
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Adding token in cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Send the welcome email to new registered user
    const mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: email,
        subject: "Welcome to MERNAuth",
        text:`Welcome ${name}, to MERNAuth website. Your account has been created with email id: ${email}`
    }

    await transporter.sendMail(mailOptions)

    return res.json({ success: true, message: "User is successfully Registered" });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

// creating a controller for user login
export const login = async (req, res) => {
  const { email, password } = req.body;

  // validate the email and password
  if (!email || !password) {
    return res.json({ success: false, message: "Please add all required fields" }); //either email or password are required
  }
  try {
    // checking if user is present in database
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "Invalid Credentials" }); //if email is not there
    }

    // checking if password is matching to the actual user password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({ success: false, message: "Invalid Credentials" }); //if password is not correct
    }

    // generate the token user will be authenticated and logged in
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Adding token in cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ success: true, message: "User is successfully Logged In" });
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};

// creating a controller for user logout
export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });

    return res.json({success:true, message:"Logged Out"})
  } catch (error) {
    return res.json({ success: false, message: err.message });
  }
};
