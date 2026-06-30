// Dependencies
import { body, validationResult } from "express-validator";

// Validations
const validateYear = [
  // Prevents strings from passing through
  body("year")
    .optional()
    .custom((value) => {
      return typeof value === "number";
    })
    .withMessage("Invalid year format"),

  // Check if the blog is no older than 1991
  body("year")
    .optional()
    .isInt({ min: 1991 })
    .withMessage("A blog cannot be older than 1991"),

  // Check if the year does not surpass the current year
  body("year")
    .optional()
    .isInt({ max: new Date().getFullYear() })
    .withMessage("The year cannot exceed the current year"),

  // Handles the error response
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => error.msg);
      return res.status(400).json({ error: errorMessages });
    }
    next();
  },
];

export default validateYear;
