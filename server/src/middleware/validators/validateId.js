// Dependencies
import { param, validationResult } from "express-validator";

// Validations
const validateId = [
  param("id").notEmpty().withMessage("Missing ID value"),
  param("id").isInt({ min: 0 }).withMessage("Invalid ID format"),

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

export default validateId;
