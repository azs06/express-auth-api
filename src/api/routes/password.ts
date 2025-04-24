import express, { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "../../config/db.ts";
import { users, passwordResetTokens } from "../../schema/index.ts";
import { and, eq, gte } from "drizzle-orm";
import { mailer } from "../../config/mailer.ts";

const router = express.Router();

// POST /password/forgot
router.post(
  "/forgot",
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
    }

    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      // always 200 to avoid enumeration
      if (!user) {
        res.json({
          message: "If that email is registered, you’ll receive a reset link.",
        });
        return;
      }

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1h

      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token,
        expiresAt,
      });

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
      await mailer.sendMail({
        from: process.env.MAIL_FROM,
        to: user.email,
        subject: "Your password reset link",
        text: `Reset your password: ${resetUrl}`,
        html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 1 hour.</p>`,
      });

      res.json({
        message: "If that email is registered, you’ll receive a reset link.",
      });
      return;
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Unable to process request" });
      return;
    }
  }
);

// POST /password/reset
router.post("/reset", async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
     res
      .status(400)
      .json({ message: "Token and new password are required" });
    return;
  }

  try {
    const [record] = await db
      .select({
        id: passwordResetTokens.id,
        userId: passwordResetTokens.userId,
      })
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          gte(passwordResetTokens.expiresAt, new Date())
        )
      );

    if (!record) {
      res.status(400).json({ message: "Invalid or expired token" });
      return;
    }

    const hashed = await bcrypt.hash(password, 10);

    await db
      .update(users)
      .set({ password: hashed })
      .where(eq(users.id, record.userId));

    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.id, record.id));

    res.json({ message: "Password has been reset successfully" });
    return;
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to reset password" });
    return;
  }
});

export default router;
