import dotenv from "dotenv";
dotenv.config();

// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV !== "test") {
    console.error(err); // Log on the server for debugging
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(400).json({ error: "Username must be unique" });
  }

  if (err.name === "SequelizeValidationError") {
    if (err.errors.length > 1) {
      return res
        .status(400)
        .json({ error: err.errors.map((error) => error.message) });
    } else {
      return res.status(400).json({ error: err.errors[0].message });
    }
  }

  res.status(500).json({ error: "internal server error" });
}
