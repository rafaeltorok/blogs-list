import { Model, DataTypes } from "sequelize";
import sequelize from "../utils/connectdb.js";

export default class Session extends Model {}

Session.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    startSession: {
      type: DataTypes.DATE,
      defaultValue: new Date(),
    },
    sessionToken: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    underscored: true,
    timestamps: false,
    modelName: "session",
  },
);
