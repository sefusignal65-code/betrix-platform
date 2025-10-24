import jwt from "jsonwebtoken";
import { AUTH_CONFIG } from "../config/auth";

export function withAuth(handler) {
  return async (req, res) => {
    try {
      // Get token from header
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ error: "No token provided" });
      }

      // Verify token
      const decoded = jwt.verify(token, AUTH_CONFIG.JWT_SECRET);
      req.user = decoded;

      // Continue to handler
      return handler(req, res);
    } catch (error) {
      console.error("Auth middleware error:", error);
      return res.status(401).json({ error: "Invalid token" });
    }
  };
}

export function withAdminAuth(handler) {
  return async (req, res) => {
    try {
      // Get token from header
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ error: "No token provided" });
      }

      // Verify token
      const decoded = jwt.verify(token, AUTH_CONFIG.JWT_SECRET);
      
      // Check if user is admin
      if (decoded.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      req.user = decoded;

      // Continue to handler
      return handler(req, res);
    } catch (error) {
      console.error("Admin auth middleware error:", error);
      return res.status(401).json({ error: "Invalid token" });
    }
  };
}