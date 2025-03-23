import express, { Request, Response } from "express";
import { permissions } from "../../schema/index.ts";
import { authenticate } from "../middleware/authMiddleware.ts";
import { db } from "../../config/db.ts";

const router = express.Router();

router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const result = await db.select().from(permissions);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching permissions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
