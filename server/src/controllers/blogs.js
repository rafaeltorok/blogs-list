// Dependencies
import express from "express";
import { Op } from "sequelize";

// Models
import { Blog, User } from "../models/index.js";

// Middleware
import { blogFinder } from "../middleware/finders.js";
import tokenExtractor from "../middleware/tokenExtractor.js";
import activeSession from "../middleware/activeSession.js";

// Validators
import validateBlog from "../middleware/validators/blogsValidator.js";
import validateId from "../middleware/validators/validateId.js";
import validateLikes from "../middleware/validators/validateLikes.js";
import validateYear from "../middleware/validators/validateYear.js";

const blogsRouter = express.Router();

// GET all
blogsRouter.get("/", async (req, res, next) => {
  try {
    const where = {};

    // Search by Title only
    if (req.query.title) {
      where.title = {
        [Op.iLike]: `%${req.query.title}%`,
      };
    }

    // Search by Author name only
    if (req.query.author) {
      where.author = {
        [Op.iLike]: `%${req.query.author}%`,
      };
    }

    // Search by both Title and Author
    if (req.query.search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${req.query.search}%` } },
        { author: { [Op.iLike]: `%${req.query.search}%` } },
      ];
    }

    const data = await Blog.findAll({
      attributes: {
        exclude: ["userId"],
      },
      include: {
        model: User,
        attributes: ["name"],
      },
      order: [["likes", "desc"]],
      where,
    });

    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
});

// GET a blog by its id
blogsRouter.get("/:id", validateId, blogFinder, async (req, res, next) => {
  try {
    return res.status(200).json(req.blog);
  } catch (err) {
    next(err);
  }
});

// POST a new blog
blogsRouter.post(
  "/",
  tokenExtractor,
  activeSession,
  validateBlog,
  validateYear,
  async (req, res, next) => {
    try {
      const user = await User.findByPk(req.decodedToken.id);
      const { title, author, url, likes, year } = req.body;

      // Create a new blog
      const newBlog = await Blog.create({
        title,
        author,
        url,
        likes,
        year,
        userId: user.id,
      });

      res.status(201).json(newBlog);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE a blog
blogsRouter.delete(
  "/:id",
  tokenExtractor,
  activeSession,
  validateId,
  async (req, res, next) => {
    try {
      const blogId = req.params.id;

      // Check if the user is authorized
      await User.findByPk(req.decodedToken.id);

      // Confirm the blog to be removed exists
      const blogToBeRemoved = await Blog.findByPk(blogId);

      if (!blogToBeRemoved) {
        return res.status(404).end();
      }

      // Confirm the currently logged in user is the one who owns the blog
      if (blogToBeRemoved.userId !== req.decodedToken.id) {
        return res
          .status(401)
          .json({ error: "Only the user who added the blog can remove it" });
      }

      // Remove the blog
      const removedBlogs = await Blog.destroy({
        where: {
          id: blogId,
        },
      });

      if (removedBlogs === 1) {
        res.status(204).end();
      } else {
        res.status(404).end();
      }
    } catch (err) {
      next(err);
    }
  },
);

// PUT (update) a blog's number of likes
blogsRouter.put(
  "/:id",
  tokenExtractor,
  activeSession,
  validateId,
  blogFinder,
  validateLikes,
  async (req, res, next) => {
    try {
      const likes = req.body.likes;

      // Check if the user is authorized
      await User.findByPk(req.decodedToken.id);

      // Find the blog to be updated
      const blogToUpdate = req.blog;

      // Update the likes counter
      await blogToUpdate.update({ likes: likes });

      res.status(200).json(blogToUpdate.toJSON());
    } catch (err) {
      next(err);
    }
  },
);

export default blogsRouter;
