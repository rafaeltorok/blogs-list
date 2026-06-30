// Dependencies
import express from "express";
import bcrypt from "bcrypt";

// Models
import { Blog, User, Session } from "../models/index.js";

// Middleware
import { userFinder } from "../middleware/finders.js";
import tokenExtractor from "../middleware/tokenExtractor.js";
import isAdmin from "../middleware/isAdmin.js";
import activeSession from "../middleware/activeSession.js";

// Validators
import validateUser from "../middleware/validators/usersValidator.js";
import validateId from "../middleware/validators/validateId.js";
import validatePassword from "../middleware/validators/validatePassword.js";

const userRouter = express.Router();

// GET all
userRouter.get("/", async (req, res, next) => {
  try {
    const data = await User.findAll({
      attributes: {
        exclude: ["passwordHash"],
      },
      include: {
        model: Blog,
        attributes: {
          exclude: ["userId"],
        },
      },
    });
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
});

// GET by id
userRouter.get("/:id", validateId, userFinder, async (req, res, next) => {
  try {
    return res.status(200).json(req.user);
  } catch (err) {
    next(err);
  }
});

// POST a new user
userRouter.post("/", validateUser, validatePassword, async (req, res, next) => {
  try {
    const { username, name, password } = req.body;

    // Hash the password to be stored
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create the new user
    const newUser = await User.create({
      username,
      name,
      passwordHash: passwordHash,
    });

    // Remove sensitive field from the response
    const nonSensitiveData = newUser.toJSON();
    delete nonSensitiveData.passwordHash;

    res.status(201).json(nonSensitiveData);
  } catch (err) {
    next(err);
  }
});

// DELETE a user
userRouter.delete("/:id", validateId, async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Remove the user
    const removedUsers = await User.destroy({
      where: {
        id: userId,
      },
    });

    if (removedUsers === 1) {
      return res.status(204).end();
    } else {
      return res.status(404).end();
    }
  } catch (err) {
    next(err);
  }
});

// PUT (update) a user's name
userRouter.put("/:username", async (req, res, next) => {
  try {
    const newName = req.body.name;
    const userToUpdate = await User.findOne({
      where: {
        username: req.params.username,
      },
    });

    // Check if the user exists
    if (!userToUpdate) {
      return res.status(404).end();
    }

    // Check if the new name is invalid
    if (newName === undefined || newName.trim() === "") {
      return res.status(400).json({ error: "Invalid user's name" });
    }

    // Update and return the user's info
    await userToUpdate.update({ name: newName });

    // Remove sensitive field from the response
    const nonSensitiveData = userToUpdate.toJSON();
    delete nonSensitiveData.passwordHash;

    return res.status(200).json(nonSensitiveData);
  } catch (err) {
    next(err);
  }
});

// Admin-only route to enable or disable a user
userRouter.put(
  "/:username/disabled",
  tokenExtractor,
  activeSession,
  isAdmin,
  async (req, res, next) => {
    try {
      const userToDisable = await User.findOne({
        where: {
          username: req.params.username,
        },
      });

      // Check if the disabled value is a valid boolean
      if (typeof req.body.disabled !== "boolean") {
        return res
          .status(400)
          .json({
            error: "The disabled field must be either 'true' or 'false'",
          });
      }

      // Check if the user exists
      if (userToDisable) {
        userToDisable.disabled = req.body.disabled;
        await userToDisable.save();

        // Remove sensitive fields from the response
        const nonSensitiveData = userToDisable.toJSON();
        delete nonSensitiveData.passwordHash;

        // Remove all active sessions related to the disabled user
        await Session.destroy({
          where: {
            userId: userToDisable.id,
          },
        });

        return res.status(200).send(nonSensitiveData);
      } else {
        return res.status(404).end();
      }
    } catch (err) {
      next(err);
    }
  },
);

export default userRouter;
