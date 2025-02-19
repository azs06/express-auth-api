import express from "express";
import { User } from "../model/User";

const router = express.Router();


// Get all users
router.get("/", async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

// Create a new user
router.post("/", async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json(user);
});

export default router;
