import sequelize from "./connectdb.js";
import { Umzug, SequelizeStorage } from "umzug";

const migrationConf = {
  migrations: {
    glob: "migrations/*.js",
  },
  storage: new SequelizeStorage({ sequelize, tableName: "migrations" }),
  context: sequelize.getQueryInterface(),
  logger: console,
};

export async function runMigrations() {
  const migrator = new Umzug(migrationConf);

  const migrations = await migrator.up();

  console.log("Migrations up to date", {
    files: migrations.map((mig) => mig.name),
  });
}

export async function rollbackMigration() {
  await sequelize.authenticate();
  const migrator = new Umzug(migrationConf);
  await migrator.down();
}
