// Sequelize dependencies
import { Model, DataTypes } from "sequelize";
import sequelize from "../utils/connectdb.js";

// User model
export default class User extends Model {}
User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: {
          msg: "Invalid email address",
        },
        len: {
          args: [5, 32],
          msg: "The username must be between 5 and 32 chars long",
        },
        notNull: {
          msg: "Username is required",
        },
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [3, 32],
          msg: "The user's name must be between 3 and 32 chars long",
        },
        notNull: {
          msg: "Name is required",
        },
      },
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    admin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    disabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    underscored: true,
    timestamps: true,
    modelName: "user",
  },
);
