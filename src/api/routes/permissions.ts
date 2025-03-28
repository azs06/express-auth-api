import express, { Request, Response } from "express";
import { permissions } from "../../schema/index.ts";
import { authenticate } from "../middleware/authMiddleware.ts";
import { db } from "../../config/db.ts";
import { eq } from "drizzle-orm";

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
    const id = await db
      .insert(permissions)
      .values(newPermission)
      .$returningId();
    if (!id) {
      res.status(500).json({ error: "Failed to create permission" });
      return;
    }
    res
      .status(200)
      .json({
        message: "Permission created successfully",
        permission: { id, ...newPermission },
      });
    return;
  } catch (error) {
    console.error("Error fetching permissions:", error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

router.put("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, resourceType, actionType } = req.body;
    const savedPermission = await db
      .select()
      .from(permissions)
      .where(eq(permissions.id, parseInt(id, 10)));
    if (savedPermission.length === 0) {
      res.status(404).json({ error: "Permission not found" });
      return;
    }
    const updatedPermission = Object.assign({}, savedPermission[0], {
      name: name || savedPermission[0].name,
      description: description || savedPermission[0].description,
      resourceType: resourceType || savedPermission[0].resourceType,
      actionType: actionType || savedPermission[0].actionType,
    });

    await db
      .update(permissions)
      .set(updatedPermission)
      .where(eq(permissions.id, parseInt(id, 10)));

    const updatedRecord = await db
      .select()
      .from(permissions)
      .where(eq(permissions.id, parseInt(id, 10)));
    res
      .status(200)
      .json({
        message: "Permission updated successfully",
        permission: updatedRecord[0],
      });
    return;
  } catch (error) {
    console.error("Error updating permission:", error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

export default router;
