// Dependencies
import { body, validationResult } from "express-validator";

// Validations
const validateReadingList = [
  // Check if it is empty
  body("userId").notEmpty().withMessage("Missing the User ID"),
  body("blogId").notEmpty().withMessage("Missing the Blog ID"),

  // Check if the IDs are numbers
  // Prevents strings from passing through
  body("userId")
    .custom((value) => {
      return typeof value === "number";
    })
    .withMessage("Invalid ID format"),

  body("blogId")
    .custom((value) => {
      return typeof value === "number";
    })
    .withMessage("Invalid ID format"),

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

export default validateReadingList;
