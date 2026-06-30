// Dependencies
import { body, validationResult } from "express-validator";

// Validations
const validatePassword = [
  // Check if it is empty
  body("password").notEmpty().withMessage("Password is required"),

  // Check if the password is within the allowed length
  body("password")
    .isLength({ min: 5, max: 64 })
    .withMessage("Password length must be between 5 and 64 chars long"),

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

export default validatePassword;
