import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import connectDB from "./config/mongodb.js";
import authRouter from "./routes/authRoutes.js"
import userRouter from "./routes/userRoutes.js";

const app = express();
const port = process.env.PORT || 4000;
connectDB();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ credentials: true })); // we can send cookies in the response

// API endpoints for Authentication
app.use('/api/auth', authRouter)

// API endpoints for User
app.use('/api/user', userRouter)

app.get('/', (req, res)=>{
    res.send("API working")
})

app.listen(port, () => {
  console.log(`Server started on PORT: ${port}`);
});
