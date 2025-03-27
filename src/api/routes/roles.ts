import express, { Request, Response } from "express";
import {
  roles,
  rolePermissions,
  permissions,
  userRoles,
  users,
} from "../../schema/index.ts";
import { authenticate } from "../middleware/authMiddleware.ts";
import { db } from "../../config/db.ts";
import { eq } from "drizzle-orm";

const router = express.Router();

// GET /roles - Retrieve all roles along with their permissions
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    // Fetch roles joined with role_permissions and permissions
    const rows = await db
      .select({
        roleId: roles.id,
        roleName: roles.name,
        roleDescription: roles.description,
        roleCreatedAt: roles.createdAt,
        roleUpdatedAt: roles.updatedAt,
        permissionId: permissions.id,
        permissionName: permissions.name,
        permissionDescription: permissions.description,
        permissionResourceType: permissions.resourceType,
        permissionActionType: permissions.actionType,
        permissionCreatedAt: permissions.createdAt,
      })
      .from(roles)
      .leftJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id));

    // Group the rows by role so that each role contains an array of permissions
    const rolesMap: Record<number, any> = {};
    rows.forEach((row) => {
      if (!rolesMap[row.roleId]) {
        rolesMap[row.roleId] = {
          id: row.roleId,
          name: row.roleName,
          description: row.roleDescription,
          createdAt: row.roleCreatedAt,
          updatedAt: row.roleUpdatedAt,
          permissions: [],
        };
      }
      // Only push permission if one exists (role may have no permissions)
      if (row.permissionId) {
        rolesMap[row.roleId].permissions.push({
          id: row.permissionId,
          name: row.permissionName,
          description: row.permissionDescription,
          resourceType: row.permissionResourceType,
          actionType: row.permissionActionType,
          createdAt: row.permissionCreatedAt,
        });
      }
    });

    const result = Object.values(rolesMap);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching roles with permissions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", authenticate, async (req: Request, res: Response) => {
  const name = req.body.name || "";
  const description = req.body.description || "";
  const permissions = req.body.permissions || [];
  const newValue = {
    name,
    description,
  };
  if (!name || !description) {
    res.status(400).json({ message: "Name and description are required." });
    return;
  }
  try {
    const roleId = await db.insert(roles).values(newValue).$returningId()
    const newEntries = permissions.map((permissionId: number) => {
      return { roleId, permissionId };
    });
    await db.insert(rolePermissions).values(newEntries);
    res.status(201).json({ message: "Role created successfully" });
    return;
  } catch (error) {
    console.error("Error creating role:", error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
});

router.post(
  "/add-role-user",
  authenticate,
  async (req: Request, res: Response) => {
    const { userId, roleId, assignedBy } = req.body;

    if (!userId || !roleId) {
      res.status(400).json({ message: "userId and roleId are required." });
      return;
    }

    const user = await db.select().from(users).where(eq(users.id, userId));
    const role = await db.select().from(roles).where(eq(roles.id, roleId));

    if (!user) {
      res.status(404).json({ message: `User not found with the id: ${userId}` });
      return;
    }

    if(!role) {
      res.status(404).json({ message: `Role not found with the id: ${roleId}` });
      return;
    }

    const newValue: { userId: number; roleId: number; assignedBy?: number } = {
      userId,
      roleId,
    };

    if (assignedBy) {
      newValue.assignedBy = assignedBy;
    }

    try {
      await db.insert(userRoles).values(newValue);
      res.status(201).json({ message: "Role added to user successfully" });
      return;
    } catch (error) {
      console.error("Error adding role to user:", error);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
  }
);

router.put("/update/:id", authenticate, async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id, 10);
  const { roles, assignedBy } = req.body;

  if (!userId || !roles || !Array.isArray(roles)) {
    res
      .status(400)
      .json({ message: "User id and an array of role IDs are required." });
    return;
  }

  try {
    await db.delete(userRoles).where(eq(userRoles.userId, userId));

    const newEntries = roles.map((roleId: number) => {
      const entry: { userId: number; roleId: number; assignedBy?: number } = {
        userId,
        roleId,
      };
      if (assignedBy) {
        entry.assignedBy = assignedBy;
      }
      return entry;
    });

    const result = await db.insert(userRoles).values(newEntries);
    res
      .status(200)
      .json({ message: "User roles updated successfully", result });
    return;
  } catch (error) {
    console.error("Error updating user roles:", error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
});

export default router;
