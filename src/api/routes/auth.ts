import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../../config/db";
import { users } from "../../schema";
import dotenv from "dotenv";
import { authenticate } from "../middleware/authMiddleware";

dotenv.config();

const router = express.Router();

// Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await db.select().from(users).where(eq(users.email, email));

    if (!user.length) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user[0].password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user[0].id, roleId: user[0].roleId },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await db.select().from(users).where(eq(users.id, req.user.id));

    if (!user.length) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ id: user[0].id, email: user[0].email, roleId: user[0].roleId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
