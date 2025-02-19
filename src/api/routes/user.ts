import express from "express";
import { User } from "../../models/User";
import { authenticate, authorize } from "../middleware/authMiddleware";

const router = express.Router();


// Get all users (Admin only)
router.get("/", authenticate, authorize([1]), async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

// Get own profile
router.get("/me", authenticate, async (req, res) => {
  res.json(req.user);
});

export default router;
