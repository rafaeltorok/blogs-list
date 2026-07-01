import { DataTypes } from "sequelize";

export async function up({ context: queryInterface }) {
  await queryInterface.addColumn("blogs", "year", {
    type: DataTypes.INTEGER,
    defaultValue: new Date().getFullYear(),
    validator: {
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
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeColumn("blogs", "year");
}
