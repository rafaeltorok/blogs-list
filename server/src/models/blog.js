// Sequelize dependencies
import { Model, DataTypes } from "sequelize";
import sequelize from "../utils/connectdb.js";

// Blog model
export default class Blog extends Model {}
Blog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: {
          args: [3, 32],
          msg: "The title must be between 3 and 32 chars long",
        },
        notNull: {
          msg: "Title is required",
        },
      },
    },
    author: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: {
          args: [3, 32],
          msg: "The author's name must be between 3 and 32 chars long",
        },
        notNull: {
          msg: "Author is required",
        },
      },
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        isUrl: {
          msg: "Invalid URL format",
        },
        notNull: {
          msg: "URL is required",
        },
      },
    },
    likes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        isInt: {
          msg: "The likes counter must be a valid number",
        },
        min: {
          args: [0],
          msg: "The likes counter must be a positive number",
        },
      },
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Year is required",
        },
        isInt: {
          msg: "Invalid year format",
        },
        min: {
          args: [1991],
          msg: "A blog cannot be older than 1991",
        },
        max: {
          args: [new Date().getFullYear()],
          msg: "The year cannot exceed the current year",
        },
      },
    },
  },
  {
    sequelize,
    underscored: true,
    timestamps: true,
    modelName: "blog",
  },
);
