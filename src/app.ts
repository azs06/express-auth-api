import express from "express";
import dotenv from "dotenv";
import userRoutes from "./api/routes/user.ts";
import authRoutes from "./api/routes/auth.ts";
import { passport } from "./config/passport.ts";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(passport.initialize());

// Routes
app.get("/", (req, res) => {
  res.json("Hello, World!");
});
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);



export { app };
