import { Model, DataTypes } from "sequelize";
import sequelize from "../utils/connectdb.js";

export default class ReadingList extends Model {}

ReadingList.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    addedOn: {
      type: DataTypes.DATE,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    blogId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "blogs", key: "id" },
    },
  },
  {
    sequelize,
    underscored: true,
    timestamps: false,
    modelName: "reading_list",
  },
);
