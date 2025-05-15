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
      to: process.env.RECEIVE_EMAIL, //It should be user.email but for testing given receiver email
      subject: "Welcome to MERNAuth",
      text: `Welcome ${name}, to MERNAuth website. Your account has been created with email id: ${email}`,
    };

    await transporter.sendMail(mailOptions);

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

    return res.json({ success: true, message: "Logged Out" });
  } catch (error) {
    return res.json({ success: false, message: err.message });
  }
};

//  creating a controller to send verification OTP to User's Email
export const sendVerifyOtp = async (req, res) => {
  try {
    const { userId } = req.body;
    // Get the user from database from the User ID
    const user = await userModel.findById(userId);

    if (user.isAccountVerified) {
      return res.json({ success: false, message: "Account is already verified" });
    }

    // To generate a 6 digit random number
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // Save the otp in database
    user.verifyOtp = otp;

    // Set expiry date one day after the current date
    user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

    await user.save();

    // Send the otp to the User via email
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: process.env.RECEIVE_EMAIL, //It should be user.email but for testing given receiver email
      subject: "Account Verification OTP",
      text: `Your OTP is ${otp}. Verify your account using this OTP. for email ${user.email}`,
    };
    await transporter.sendMail(mailOptions);

    return res.json({ success: true, message: "Verification OTP sent on email" });
  } catch (error) {
    return res.json({ success: false, message: err.message });
  }
};

// creating a controller to verify the user Email
export const verifyEmail = async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.json({ success: false, message: "Missing information" });
  }

  try {
    const user = await userModel.findById(userId);
    // Check if user is present in database
    if (!user) {
      return res.json({ success: false, message: "User Not Found!" });
    }

    // Check if user has entered correct OTP
    if (user.verifyOtp === "" || user.verifyOtp !== otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    // Check if entered OTP has expired or not
    if (user.verifyOtpExpireAt < Date.now()) {
      return res.json({ success: false, message: "OTP expired!" });
    }

    // Saving the user data
    user.isAccountVerified = true;
    user.verifyOtp = "";
    user.verifyOtpExpireAt = 0;
    await user.save();

    return res.json({ success: true, message: "Email Verified Successfully!" });
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};

// creating a controller to verify if user is authenticated
export const isAuthenticated = async (req, res) => {
  try {
    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};

// creating a controller to Send Password reset OTP
export const sendResetOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.json({ success: false, message: "Enter all required Details" });
  }
  try {
    const user = await userModel.findOne({email});
    if (!user) {
      return res.json({ success: false, message: "Invalid Credentials" }); //Instead of User not found
    }

    // To generate a 6 digit random number
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // Save the otp in database
    user.resetOtp = otp;

    // Set expiry date one day after the current date
    user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000;

    await user.save();

    // Send the otp to the User via email
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: process.env.RECEIVE_EMAIL, //It should be user.email but for testing given receiver email
      subject: "Password Reset OTP",
      text: `Your OTP for resetting your password is ${otp}. Use this OTP to resetting your password. for email ${user.email}`,
    };
    await transporter.sendMail(mailOptions);
    return res.json({ success: true, message: "OTP sent to your email" });
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};

// Reset the user password
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.json({ success: false, message: "Enter all required Details" });
  }

  try {
    
    const user = await userModel.findOne({email});
    if(!user){
        return res.json({ success: false, message: "Invalid Credentials" });
    }

    if(user.resetOtp === '' || user.resetOtp !== otp){
        return res.json({ success: false, message: "Invalid OTP" });
    }

    if(user.resetOtpExpireAt < Date.now()){
        return res.json({ success: false, message: "OTP Expired" });
    }

    // creating a hashed password for new password to save in database
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // saving a new hashed password in database
    user.password = hashedPassword;
    user.resetOtp = '';
    user.resetOtpExpireAt = 0;
    await user.save(); // Saving the new user in database

    return res.json({ success: true, message: "Password has been reset successfully" });

    
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};
