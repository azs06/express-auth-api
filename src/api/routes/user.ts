import express from "express";
import bcrypt from "bcryptjs";
import { db } from "../../config/db.ts";
import { users, roles, userRoles } from "../../schema/index.ts";
import { authenticate } from "../middleware/authMiddleware.ts";
import { eq } from "drizzle-orm";

const router = express.Router();

// Get all users
router.get("/", authenticate, async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthenticated" });
    return;
  }
  try {

    const allUsers = await db.select({
      id: users.id,
      username: users.username,
      name: users.name,
      email: users.email,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      roles: roles.name, 
    }).from(users)
    .leftJoin(userRoles, eq(userRoles.userId, users.id))
    .leftJoin(roles, eq(userRoles.roleId, roles.id))


    const formattedUsers = Object.values(
      allUsers.reduce((acc, user) => {
        const { id, username, name, email, isActive, createdAt, updatedAt, roles } = user;
        if (!acc[id]) {
          acc[id] = { id, username, name, email, isActive, createdAt, updatedAt, roles: [] };
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

    const newUser = await db.insert(users).values(newValue);

    res.status(201).json(newUser);
    return;
  } catch (error) {
    res.status(500).json({ message: error.message });
    return;
  }
});

export default router;
