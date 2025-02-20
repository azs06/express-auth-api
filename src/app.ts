import express from "express";
import dotenv from "dotenv";
import userRoutes from "./api/routes/user";
import authRoutes from "./api/routes/auth";
import { passport } from "./config/passport";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(passport.initialize());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Routes
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

export { app };
