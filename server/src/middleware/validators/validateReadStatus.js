import { body, validationResult } from "express-validator";

// Validations
const validateReadStatus = [
  // Check if it is empty
  body("read").notEmpty().withMessage("Missing read status"),

  // Check if the read status is a valid boolean
  body("read")
    .custom((value) => {
      return typeof value === "boolean";
    })
    .withMessage("Invalid read status, must be either 'true' or 'false'"),

  // Handle the error response
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => error.msg);
      return res.status(400).json({ error: errorMessages });
    }
    next();
  },
];

export default validateReadStatus;
