import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../../config/db.ts";
import { users } from "../../schema/index.ts";
import dotenv from "dotenv";
import { authenticate } from "../middleware/authMiddleware.ts";
import { Request, Response } from "express";

dotenv.config();

const router = express.Router();

interface AuthenticatedRequest extends Request {
  user?: { id: number; roleId: number };
}

// Login Route
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;


  try {
    const user = await db.select().from(users).where(eq(users.email, email));

    if (!user.length) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user[0].password);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const token = jwt.sign(
      { id: user[0].id },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    res.json({ token, user });
    return;
  } catch (error) {
    res.status(500).json({ message: error.message });
    return;
  }
});

router.get(
  "/me",
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ message: "Unauthenticated" });
      return;
    }
    try {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user.id));

      if (!user.length) {
        res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user[0].id,
        email: user[0].email,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;
