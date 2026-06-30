// Dependencies
import express from "express";

// Model
import { Session } from "../models/index.js";

// Middleware
import tokenExtractor from "../middleware/tokenExtractor.js";

const logoutRouter = express.Router();

logoutRouter.delete("/", tokenExtractor, async (req, res, next) => {
  try {
    const authorization = req.get("authorization");

    // Remove the current session
    await Session.destroy({
      where: {
        sessionToken: authorization.substring(7),
      },
    });

    return res.status(200).end();
  } catch (err) {
    next(err);
  }
});

export default logoutRouter;
