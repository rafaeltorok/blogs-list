import express from "express";

// Models
import { Blog, User, ReadingList } from "../models/index.js";

// Middleware
import tokenExtractor from "../middleware/tokenExtractor.js";
import activeSession from "../middleware/activeSession.js";

// Validators
import validateReadingList from "../middleware/validators/validateReadingList.js";
import validateId from "../middleware/validators/validateId.js";
import validateReadStatus from "../middleware/validators/validateReadStatus.js";

const readingListRouter = express.Router();

// Add a blog to a user reading list
readingListRouter.post(
  "/",
  tokenExtractor,
  activeSession,
  validateReadingList,
  async (req, res, next) => {
    try {
      const userId = req.body.userId;
      const blogId = req.body.blogId;

      const user = await User.findByPk(userId);
      const blog = await Blog.findByPk(blogId);

      // Confirm both the user and the blog exists
      if (!user || !blog) {
        return res.status(404).end();
      }

      // Confirm the logged in user is adding the blog to its own reading list
      if (userId !== req.decodedToken.id) {
        return res
          .status(401)
          .json({ error: "You cannot modify another user's reading list" });
      }

      // Add the blog to the reading list
      await ReadingList.create({
        userId,
        blogId,
      });

      return res.status(200).json({
        message: `${blog.title} by ${blog.author} was added to the ${user.name}'s reading list`,
      });
    } catch (err) {
      next(err);
    }
  },
);

readingListRouter.put(
  "/:id",
  tokenExtractor,
  activeSession,
  validateId,
  validateReadStatus,
  async (req, res, next) => {
    try {
      const readingListEntry = await ReadingList.findByPk(req.params.id);

      // Confirm the list item exists
      if (!readingListEntry) {
        return res.status(404).end();
      }

      // Confirm the reading list entry belongs to the currently logged in user
      if (readingListEntry.userId !== req.decodedToken.id) {
        return res
          .status(401)
          .json({ error: "You cannot modify another user's reading list" });
      }

      // Update the read status for the entry
      await readingListEntry.update({ read: req.body.read });

      return res.status(200).json(readingListEntry.toJSON());
    } catch (err) {
      next(err);
    }
  },
);

export default readingListRouter;
