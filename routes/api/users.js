import express from "express";
const router = express.Router();
import { check, validationResult } from "express-validator";
import auth from "../../middleware/auth.js";
import admin from "../../middleware/admin.js";
import { registerUser, getAllUsers } from "../../controllers/userController.js";
import { getsUser } from "../../controllers/authController.js";
router.get("/profile", auth, getsUser);
router.post(
  "/register",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check(
      "password",
      "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 }),
  ],
  registerUser
);

router.get("/", [auth, admin], getAllUsers);

export default router;
