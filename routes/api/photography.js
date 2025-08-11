import express from "express";
import { check } from "express-validator";
import auth from "../../middleware/auth.js";
import admin from "../../middleware/admin.js";
import { photographyUpload } from "../../middleware/upload.js";
import photographyController from "../../controllers/photographyController.js";

const router = express.Router();

// Create a photography collection (admin only)
router.post(
  "/add",
  [
    auth,
    admin,
    photographyUpload.array("images", 10), // Allow up to 10 images
    [
      check("title", "Title is required").not().isEmpty(),
    ],
  ],
  photographyController.createPhotography
);

// Get all photography collections
router.get("/all", photographyController.getAllPhotography);

// Get all photography (admin)
router.get("/admin/all", [auth, admin], photographyController.getAllPhotographyAdmin);

// Get photography by category
router.get("/category/:category", photographyController.getPhotographyByCategory);

// Get photography by ID
router.get("/:id", photographyController.getPhotographyById);

// Delete a photography collection
router.delete("/:id", auth, photographyController.deletePhotography);

// Update a photography collection
router.put(
  "/:id",
  [
    auth,
    admin,
    photographyUpload.array("images", 10),
    [
      check("title", "Title is required").not().isEmpty(),
    ],
  ],
  photographyController.updatePhotography
);

export default router; 