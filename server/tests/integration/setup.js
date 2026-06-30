// Dependencies
import sequelize from "../../src/utils/connectdb.js";

// Generates all tables inside the database
export async function setupDb() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1);
  }
}

// Close the connection and clears all data
export async function dbCleanup() {
  // Drop all tables
  await sequelize.drop();
  await sequelize.close();
}
