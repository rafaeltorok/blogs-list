import express from "express";

const healthRouter = express.Router();

healthRouter.get("/", async (_req, res) => {
  return res.status(200).send("Server is online");
});

export default healthRouter;
