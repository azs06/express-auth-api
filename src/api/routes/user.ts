import express from "express";
import bcrypt from "bcryptjs";
import { db } from "../../config/db.ts";
import { users } from "../../schema/index.ts";

const router = express.Router();

// Get all users
router.get("/", async (req, res) => {
  try {
    const allUsers = await db.select().from(users);
    res.json(allUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new user
router.post("/", async (req, res) => {
  try {
    const { name, email, password, roleId, username } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newValue = {
      name,
      email,
      password: hashedPassword,
      roleId,
      username,
    };

    const newUser = await db.insert(users).values(newValue)

    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
