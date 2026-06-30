// Dependencies
import { body, validationResult } from "express-validator";

// Validations
const validateLikes = [
  // Check if it is empty
  body("likes")
    .notEmpty()
    .withMessage("The likes counter must be a valid number"),

  // Prevents strings from passing through
  body("likes")
    .custom((value) => {
      return typeof value === "number";
    })
    .withMessage("The likes counter must be a valid number"),

  // Check if it is a positive number
  body("likes")
    .isInt({ min: 0 })
    .withMessage("The likes counter must be a positive number"),

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

export default validateLikes;
