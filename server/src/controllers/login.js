// Dependencies
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { SECRET } from "../utils/config.js";

// Model
import { User, Session } from "../models/index.js";

const loginRouter = express.Router();

loginRouter.post("/", async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Return an error message when missing credentials
    if (username === undefined || password === undefined) {
      return res.status(400).json({ error: "Missing credentials" });
    }

    // Confirm the user exists
    const user = await User.findOne({
      where: {
        username: username,
      },
    });

    const passwordCorrect =
      user === null ? false : await bcrypt.compare(password, user.passwordHash);

    // Return an error message if the user does not exist
    if (!(user && passwordCorrect)) {
      return res.status(401).json({
        error: "Invalid username or password",
      });
    }

    // Check if the user is disabled
    if (user.disabled) {
      return res.status(403).json({
        error: "Your account has been disabled, please contact an admin",
      });
    }

    // Generates the token
    const userForToken = {
      username: user.username,
      id: user.id,
    };

    const token = jwt.sign(userForToken, SECRET);

    // Start a new session for the logged user
    await Session.create({
      userId: user.id,
      sessionToken: token,
    });

    // Return the token alongside the non-sensitive user information
    return res
      .status(200)
      .send({ token, username: user.username, name: user.name });
  } catch (err) {
    next(err);
  }
});

export default loginRouter;
