import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();
import { DATABASE_URL } from "./config.js";

let sequelize;

if (process.env.DATABASE_SSL === "true") {
  // SSL is required for remote databases
  sequelize = new Sequelize(DATABASE_URL, {
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: process.env.NODE_ENV === "test" ? false : true,
  });
} else if (process.env.DATABASE_SSL === "false") {
  // Disable SSL connections for the Docker orchestrations
  sequelize = new Sequelize(DATABASE_URL, {
    dialect: "postgres",
    dialectOptions: {
      ssl: false,
    },
    logging: process.env.NODE_ENV === "test" ? false : true,
  });
} else {
  throw new Error(
    "The env variable 'DATABASE_SSL' must be set to either true or false",
  );
}

export default sequelize;
