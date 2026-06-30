import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 3001;

let DATABASE_URL;

switch (process.env.NODE_ENV) {
  case "test":
    DATABASE_URL = process.env.TEST_DATABASE_URL;
    break;
  case "e2e":
    DATABASE_URL = process.env.E2E_DATABASE_URL;
    break;
  default:
    DATABASE_URL = process.env.DATABASE_URL;
    break;
}

const SECRET = process.env.SECRET || "secret";

export { PORT, DATABASE_URL, SECRET };

