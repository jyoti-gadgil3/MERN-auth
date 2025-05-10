import express from 'express';
import { isAuthenticated, login, logout, register, resetPassword, sendResetOtp, sendVerifyOtp, verifyEmail } from '../controllers/authController.js';
import userAuth from '../middleware/userAuth.js';

const authRouter = express.Router();

// user registration route
authRouter.post('/register',register)

// user login route
authRouter.post('/login',login)

// user logout route
authRouter.post('/logout',logout)

// Route to send verify OTP
authRouter.post('/send-verify-otp',userAuth, sendVerifyOtp)

// Route to verify account using OTP
authRouter.post('/verify-account',userAuth, verifyEmail)

// Route to verify if user is authenticated
authRouter.post('/is-auth',userAuth, isAuthenticated)

// Route to send reset OTP
authRouter.post('/send-reset-otp',sendResetOtp)

// Route to Reset the password
authRouter.post('/reset-password',resetPassword)


export default authRouter;