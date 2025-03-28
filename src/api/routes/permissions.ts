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

router.post("/", authenticate, async (req: Request, res: Response) => {
  try {
    const { name, description, resourceType, actionType } = req.body;
    if (!name || !resourceType || !actionType) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const newPermission = {
      name,
      description,
      resourceType,
      actionType,
    };
    const id = await db.insert(permissions).values(newPermission).$returningId();
    if (!id) {
      res.status(500).json({ error: "Failed to create permission" });
      return;
    }
    // Optionally, you can return the created permission
    res.status(200).json({message: "Permission created successfully", permission: { id, ...newPermission}});
    return;
  } catch (error) {
    console.error("Error fetching permissions:", error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

export default router;
