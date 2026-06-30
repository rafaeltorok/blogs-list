// Models
import User from "../models/user.js";

// Check if the currently logged user has admin permission
const isAdmin = async (req, res, next) => {
  const user = await User.findByPk(req.decodedToken.id);

  if (!user.admin) {
    return res.status(401).json({ error: "Operation not allowed" });
  }

  next();
};

export default isAdmin;
