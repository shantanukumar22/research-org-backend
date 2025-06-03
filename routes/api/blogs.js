// import express from "express";
// import { check } from "express-validator";
// import auth from "../../middleware/auth.js";
// import admin from "../../middleware/admin.js";
// import upload from "../../middleware/upload.js";
// import blogController from "../../controllers/blogController.js";

// const router = express.Router();

// router.post(
//   "/add",
//   [
//     auth,
//     admin,
//     upload.single("image"),
//     [
//       check("title", "Title is required").not().isEmpty(),
//       check("content", "Content is required").not().isEmpty(),
//     ],
//   ],
//   blogController.createBlog
// );

// router.get("/all", blogController.getAllBlogs);

// router.get("/:id", blogController.getBlogById);

// router.delete("/:id", auth, blogController.deleteBlog);

// router.put(
//   "/:id",
//   [
//     auth,
//     [
//       check("title", "Title is required").not().isEmpty(),
//       check("content", "Content is required").not().isEmpty(),
//     ],
//   ],
//   blogController.updateBlog
// );

// router.put("/like/:id", auth, blogController.likeBlog);

// router.put("/unlike/:id", auth, blogController.unlikeBlog);

// router.post(
//   "/comment/:id",
//   [auth, [check("text", "Text is required").not().isEmpty()]],
//   blogController.addComment
// );

// router.delete("/comment/:id/:comment_id", auth, blogController.deleteComment);

// router.get("/user/:user_id", blogController.getBlogsByUser);

// router.get("/tag/:tag_name", blogController.getBlogsByTag);

// router.put("/archive/:id", auth, blogController.archiveBlog);

// router.get("/admin/all", [auth, admin], blogController.getAllBlogsAdmin);

// export default router;

import express from "express";
import { check } from "express-validator";
import auth from "../../middleware/auth.js";
import admin from "../../middleware/admin.js";
import upload from "../../middleware/upload.js";
import blogController from "../../controllers/blogController.js";
import Blog from "../../models/Blog.js";
const router = express.Router();

router.post(
  "/add",
  [
    auth,
    admin,
    upload.single("image"),
    [
      check("title", "Title is required").not().isEmpty(),
      check("content", "Content is required").not().isEmpty(),
    ],
  ],
  blogController.createBlog
);

router.get("/all", blogController.getAllBlogs);

router.get("/:id", blogController.getBlogById);

router.delete("/:id", auth, blogController.deleteBlog);

router.put(
  "/:id",
  [
    auth,
    [
      check("title", "Title is required").not().isEmpty(),
      check("content", "Content is required").not().isEmpty(),
    ],
  ],
  blogController.updateBlog
);

router.put("/like/:id", auth, blogController.likeBlog);

router.put("/unlike/:id", auth, blogController.unlikeBlog);

router.post(
  "/comment/:id",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  blogController.addComment
);

router.delete("/comment/:id/:comment_id", auth, blogController.deleteComment);

router.get("/user/:user_id", blogController.getBlogsByUser);

router.get("/tag/:tag_name", blogController.getBlogsByTag);

router.put("/archive/:id", auth, blogController.archiveBlog);

router.get("/admin/all", [auth, admin], blogController.getAllBlogsAdmin);

// ✅ WYSIWYG image upload route
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs";

// @route   GET /api/blogs/:id
// @desc    Get single blog by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ msg: "Blog not found" });
    }

    res.status(200).json(blog);
  } catch (err) {
    console.error("Error fetching blog:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post(
  "/upload/wysiwyg-image",
  [auth, admin, upload.single("image")],
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ msg: "No file uploaded" });
      }

      const localPath = req.file.path;

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(localPath, {
        folder: "blogs",
      });

      // ✅ Only delete if it’s a local file path, not a URL
      if (!result.secure_url.startsWith("http")) {
        fs.unlinkSync(localPath);
      } else {
        fs.unlink(localPath, (err) => {
          if (err) console.warn("⚠️ Failed to delete local file:", err);
        });
      }

      return res.status(200).json({ imageUrl: result.secure_url });
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      return res.status(500).json({ msg: "Image upload failed" });
    }
  }
);
// routes/blogs.js or similar
router.get("/section/:sectionType", async (req, res) => {
  try {
    const blogs = await Blog.find({
      section: req.params.sectionType,
      status: { $ne: "deleted" }, // filter out deleted blogs
    }).sort({ createdAt: -1 }); // optional: latest first

    res.json(blogs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch blogs" });
  }
});
export default router;
