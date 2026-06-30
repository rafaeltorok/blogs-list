// Dependencies
import { body, validationResult } from "express-validator";

// Validations
const validateUser = [
  // Username validations
  body("username").notEmpty().withMessage("Username is required"),
  body("username").isEmail().withMessage("Invalid email address"),
  body("username")
    .isLength({ min: 5, max: 32 })
    .withMessage("The username must be between 5 and 32 chars long"),

  // Name validations
  body("name").notEmpty().withMessage("Name is required"),
  body("name")
    .isLength({ min: 3, max: 32 })
    .withMessage("The user's name must be between 3 and 32 chars long"),

  // Password validations
  body("password").notEmpty().withMessage("Password is required"),
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

export default validateUser;
