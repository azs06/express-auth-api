import express from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../../config/db.ts";
import { users, roles, userRoles } from "../../schema/index.ts";
import { authenticate } from "../middleware/authMiddleware.ts";


const router = express.Router();

// Get all users
router.get("/", authenticate, async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthenticated" });
    return;
  }
  try {
    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        name: users.name,
        email: users.email,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        lastLogin: users.lastLogin,
        roles: roles.name,
      })
      .from(users)
      .leftJoin(userRoles, eq(userRoles.userId, users.id))
      .leftJoin(roles, eq(userRoles.roleId, roles.id));

    const formattedUsers = Object.values(
      allUsers.reduce((acc, user) => {
        const {
          id,
          username,
          name,
          email,
          isActive,
          createdAt,
          updatedAt,
          roles,
          lastLogin,
        } = user;
        if (!acc[id]) {
          acc[id] = {
            id,
            username,
            name,
            email,
            isActive,
            createdAt,
            updatedAt,
            lastLogin,
            roles: [],
          };
        }
        if (roles) {
          acc[id].roles.push(roles);
        }
        return acc;
      }, {})
    );

    res.json(formattedUsers);
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

    const [insertedUser] = await db
      .insert(users)
      .values(newValue)
      .$returningId();

    const [newUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, insertedUser.id));

    res.status(201).json(newUser);
    return;
  } catch (error) {
    res.status(500).json({ message: error.message });
    return;
  }
});

router.get("/:id", authenticate, async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthenticated" });
    return;
  }
  try {
    const { id } = req.params;
    const user = await db
      .select({
        id: users.id,
        username: users.username,
        name: users.name,
        email: users.email,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        lastLogin: users.lastLogin,
        roles: roles.name,
      })
      .from(users)
      .leftJoin(userRoles, eq(userRoles.userId, users.id))
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(users.id, parseInt(id, 10)));
    if (user.length === 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const formattedUser = Object.values(
      user.reduce((acc, user) => {
        const {
          id,
          username,
          name,
          email,
          isActive,
          createdAt,
          updatedAt,
          roles,
          lastLogin,
        } = user;
        if (!acc[id]) {
          acc[id] = {
            id,
            username,
            name,
            email,
            isActive,
            createdAt,
            updatedAt,
            lastLogin,
            roles: [],
          };
        }
        if (roles) {
          acc[id].roles.push(roles);
        }
        return acc;
      }, {})
    );
    res.json(formattedUser[0]);
    return;
  } catch (error) {
    res.status(500).json({ message: error.message });
    return;
  }
});

router.delete("/:id", authenticate, async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthenticated" });
    return;
  }
  try {
    const { id } = req.params;
    const deletedUser = await db
      .delete(users)
      .where(eq(users.id, parseInt(id, 10)));

    if (deletedUser[0].affectedRows === 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(200).json({ message: "User deleted successfully" });
    return;
  } catch (error) {
    res.status(500).json({ message: error.message });
    return;
  }
});

export default router;
