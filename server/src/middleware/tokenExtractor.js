// Dependencies
import jwt from "jsonwebtoken";
import { SECRET } from "../utils/config.js";

// Handles the authorization token
export default async function tokenExtractor(req, res, next) {
  const authorization = req.get("authorization");
  if (authorization && authorization.toLowerCase().startsWith("bearer ")) {
    try {
      req.decodedToken = jwt.verify(authorization.substring(7), SECRET);
    } catch {
      return res.status(401).json({ error: "invalid token" });
    }
  } else {
    return res.status(401).json({ error: "token missing" });
  }
  next();
}
