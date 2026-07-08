// Dependencies
import express from "express";

// Routes
import blogsRouter from "./controllers/blogs.js";
import userRouter from "./controllers/users.js";
import loginRouter from "./controllers/login.js";
import logoutRouter from "./controllers/logout.js";
import healthRouter from "./controllers/health.js";
import testsRouter from "./controllers/tests.js";
import authorsRouter from "./controllers/authors.js";
import readingListRouter from "./controllers/readingLists.js";

// Middleware
import errorHandler from "./middleware/errorHandler.js";

// Express server setup
const app = express();

app.use(express.json());

// Serve the static build for the frontend
app.use(express.static("dist"));

// Data routes
app.use("/api/blogs", blogsRouter);
app.use("/api/users", userRouter);
app.use("/api/authors", authorsRouter);
app.use("/api/readinglists", readingListRouter);

// Session-related routes
app.use("/api/login", loginRouter);
app.use("/api/logout", logoutRouter);

// Server health check route
app.use("/api/health", healthRouter);

// Truncate all tables when running tests
if (process.env.NODE_ENV === "test" || process.env.NODE_ENV === "e2e") {
  app.use("/api/reset", testsRouter);
}

// Error handler middleware
app.use(errorHandler);

export default app;
