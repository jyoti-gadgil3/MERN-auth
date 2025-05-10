import express from 'express';
import { login, logout, register } from '../controllers/authController.js';

const authRouter = express.Router();

// user registration route
authRouter.post('/register',register)

// user login route
authRouter.post('/login',login)

// user logout route
authRouter.post('/logout',logout)

export default authRouter;