import { Request, Response, NextFunction } from "express";
import { passport } from "../../config/passport.ts";

// Extend Request to include the authenticated user type
interface AuthenticatedRequest extends Request {
  user?: { id: number; roleId: number };
}

// Middleware to protect routes
export const authenticate = passport.authenticate("jwt", { session: false });

// Middleware to check role-based access
export const authorize = (roles: number[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.roleId)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};
