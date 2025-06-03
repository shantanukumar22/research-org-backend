import User from "../models/User.js";

const admin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied: Admin only" });
    }

    next();
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

export default admin;
