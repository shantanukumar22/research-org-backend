import express from "express";
const router = express.Router();
import { check } from "express-validator";
import auth from "../../middleware/auth.js"; // ✅ fixed
import { loginUser, getsUser } from "../../controllers/authController.js"; // also make sure this ends with .js if needed

router.get("/", auth, getsUser);
router.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  loginUser
);

export default router;
