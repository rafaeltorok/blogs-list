// Dependencies
import app from "./app.js";
import sequelize from "./utils/connectdb.js";
import { runMigrations } from "./utils/migrations.js";

// Utils
import { PORT } from "./utils/config.js";

// Handles connection and start the Express Server
async function start() {
  try {
    await sequelize.authenticate();
    await runMigrations();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1);
  }
}

start();
