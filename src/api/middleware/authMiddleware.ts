import { Request, Response, NextFunction } from "express";
import passport from "passport";

// Middleware to protect routes
export const authenticate = passport.authenticate("jwt", { session: false });

// Middleware to check role-based access
export const authorize = (roles: number[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role_id)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};
