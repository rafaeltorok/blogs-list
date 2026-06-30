// Models
import { Session } from "../models/index.js";

// Check if the authorization token has a valid and active session
const activeSession = async (req, res, next) => {
  const authToken = req.get("authorization");

  if (!authToken) {
    return res.status(401).json({ error: "Token missing" });
  }

  const session = await Session.findOne({
    where: {
      sessionToken: authToken.substring(7),
    },
  });

  if (!session) {
    return res.status(401).json({ error: "Token expired" });
  }

  next();
};

export default activeSession;
