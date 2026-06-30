// Dependencies
import express from "express";

// Models
import { Blog, User, ReadingList, Session } from "../models/index.js";

const testsRouter = express.Router();

// Routes
testsRouter.post("/", async (req, res, next) => {
  try {
    await Blog.truncate({ restartIdentity: true, cascade: true });
    await User.truncate({ restartIdentity: true, cascade: true });
    await ReadingList.truncate({ restartIdentity: true, cascade: true });
    await Session.truncate({ restartIdentity: true, cascade: true });

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default testsRouter;
