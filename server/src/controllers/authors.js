// Dependencies
import express from "express";
import sequelize from "../utils/connectdb.js";

// Models
import { Blog } from "../models/index.js";

const authorsRouter = express.Router();

// Routes
authorsRouter.get("/", async (req, res, next) => {
  try {
    const authors = await Blog.findAll({
      attributes: [
        "author",
        [sequelize.fn("COUNT", sequelize.col("author")), "blogs"],
        [sequelize.fn("SUM", sequelize.col("likes")), "likes"],
      ],
      group: ["author"],
      order: [["likes", "DESC"]],
    });

    return res.status(200).json(authors);
  } catch (err) {
    next(err);
  }
});

export default authorsRouter;
