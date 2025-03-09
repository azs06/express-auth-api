import express from "express";
import bcrypt from "bcryptjs";
import { db } from "../../config/db.ts";
import { users } from "../../schema/index.ts";
import { authenticate } from "../middleware/authMiddleware.ts";

const router = express.Router();

// Get all users
router.get("/", authenticate, async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthenticated" });
    return;
  }
  try {
    const allUsers = await db.select().from(users);
    res.json(allUsers);
    return;
  } catch (error) {
    res.status(500).json({ message: error.message });
    return;
  }
});

// Create new user
router.post("/", authenticate, async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthenticated" });
    return;
  }
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
    return;
  } catch (error) {
    res.status(500).json({ message: error.message });
    return;
  }
});

export default router;
