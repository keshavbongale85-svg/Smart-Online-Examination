import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

// Verify JWT (from cookie or Authorization header) and attach req.user
export const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401);
      throw new Error("Not authorized, no token");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401);
      throw new Error("Not authorized, user not found");
    }
    if (!user.isActive) {
      res.status(403);
      throw new Error("Account is deactivated");
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

// Restrict to specific roles, e.g. authorize("admin")
export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    res.status(403);
    return next(new Error("Not authorized to access this resource"));
  }
  next();
};

// Convenience admin-only guard
export const admin = authorize("admin");
