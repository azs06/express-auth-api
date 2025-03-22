import express, { Request, Response } from "express";
import { roles, rolePermissions, permissions, userRoles } from "../../schema/index.ts";
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

router.post("/create", authenticate, async (req: Request, res: Response) => {  
  const name = req.body.name || ""
  const description = req.body.description || "";
  const newValue = {
    name,
    description
  }
  if (!name || !description) {
    res.status(400).json({ message: "Name and description are required." });
    return;
  }
  try {
    const result = await db.insert(roles).values(newValue);
    res.status(201).json(result);
    return;
  } catch (error) {
    console.error("Error creating role:", error);
    res.status(500).json({ message: "Internal server error" });
    return
  }
})

router.post("/add-role-user", authenticate, async(req: Request, res: Response) => {
  const userId = req.body.userId;
  const roleId = req.body.roleId;
  const assignedBy = req.body.assignedBy;
  const newValue: { userId: number; roleId: number; assignedBy?: number } = {
    userId,
    roleId,
  };
  if(assignedBy){
    newValue["assigned_by"] = assignedBy
  }
  if (!userId || !roleId) {
    res.status(400).json({ message: "userId and roleId are required." });
    return;
  }
  try {
    const result = await db.insert(userRoles).values(newValue);
    res.status(201).json(result);
    return;
  } catch (error) {
    console.error("Error adding role to user:", error);
    res.status(500).json({ message: "Internal server error" });
    return
  }

})

router.post("/update/:id", authenticate, async (req: Request, res: Response) => {  
  const user = req.body.user;
  const roles = req.body.permissions;

  // update roles

})


export default router;
