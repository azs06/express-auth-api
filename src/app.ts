import express from "express";
import dotenv from "dotenv";
import userRoutes from "./api/routes/user";
import { sequelize } from "./config/sequelize";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

app.use("/api/users", userRoutes);

// Test database connection
sequelize.authenticate()
  .then(() => console.log("Database connected"))
  .catch(err => console.error("DB connection error:", err));

// Routes
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

export {
    app
}