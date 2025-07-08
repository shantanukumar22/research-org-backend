import { validationResult } from "express-validator";
import Blog from "../models/Blog.js";
import User from "../models/User.js";
import upload from "../middleware/upload.js";
// creating a blog post

const createBlog = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const user = await User.findById(req.user.id).select("-password");
    const { title, content, isAnonymous, tags, section } = req.body;
    const imageUrl = req.file ? req.file.path : null;

    const newBlog = new Blog({
      title,
      content,
      isAnonymous,
      user: req.user.id,
      tags: Array.isArray(tags)
        ? tags.map((tag) => tag.trim())
        : typeof tags === "string"
        ? tags.split(",").map((tag) => tag.trim())
        : [],
      image: imageUrl,
      section,
    });
    if (!isAnonymous) {
      newBlog.name = user.name;
      newBlog.avatar = user.avatar;
    }
    const blog = await newBlog.save();
    res.json(blog);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// ! getting all blog
const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ status: "active" })
      .sort({ date: -1 })
      .populate("user", ["name", "avatar"]);
    // Remove user details for anonymous posts
    const sanitizedBlogs = blogs.map((blog) => {
      if (blog.isAnonymous) {
        return {
          ...blog._doc,
          user: null,
          name: "Anonymous",
        };
      }
      return blog;
    });

    res.json(sanitizedBlogs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate("user", ["name", "avatar"]) // Only populate necessary user fields
      .populate("likes.user", ["name", "avatar"])
      .populate("comments.user", ["name", "avatar"]);

    if (!blog || blog.status === "deleted") {
      return res.status(404).json({ msg: "Blog not found" });
    }

    // Create a response object with all necessary fields
    const response = {
      _id: blog._id,
      title: blog.title,
      content: blog.content,
      name: blog.isAnonymous ? "Anonymous" : blog.name,
      avatar: blog.isAnonymous ? null : blog.avatar,
      date: blog.date,
      createdAt: blog.createdAt,
      updatedAt: blog.updatedAt,
      user: blog.isAnonymous ? null : blog.user,
      image: blog.image,
      tags: blog.tags || [],
      section: blog.section,
      comments: blog.comments || [],
      likes: blog.likes || [],
      isAnonymous: blog.isAnonymous
    };

    return res.json(response);
  } catch (err) {
    console.error("Error in getBlogById:", err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Blog not found" });
    }
    return res.status(500).json({ msg: "Server Error" });
  }
};
// Delete a blog
const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ msg: "Blog not found" });
    }

    // Check if user owns the blog or is admin
    const user = await User.findById(req.user.id);
    if (blog.user.toString() !== req.user.id && user.role !== "admin") {
      return res.status(401).json({ msg: "User not authorized" });
    }

    // Soft delete - update status
    blog.status = "deleted";
    await blog.save();

    res.json({ msg: "Blog removed" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Blog not found" });
    }
    res.status(500).send("Server Error");
  }
};

// Update a blog
const updateBlog = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ msg: "Blog not found" });
    }

    // Check if user owns the blog
    if (blog.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    const { title, content, isAnonymous, tags } = req.body;

    blog.title = title;
    blog.content = content;
    blog.isAnonymous = isAnonymous;

    if (tags) {
      blog.tags = tags.split(",").map((tag) => tag.trim());
    }

    // Update name and avatar based on anonymity
    if (isAnonymous) {
      blog.name = undefined;
      blog.avatar = undefined;
    } else {
      const user = await User.findById(req.user.id);
      blog.name = user.name;
      blog.avatar = user.avatar;
    }

    await blog.save();

    res.json(blog);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Blog not found" });
    }
    res.status(500).send("Server Error");
  }
};

// Like a blog
const likeBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ msg: "Blog not found" });
    }

    // Check if the blog has already been liked by this user
    if (blog.likes.some((like) => like.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: "Blog already liked" });
    }

    blog.likes.unshift({ user: req.user.id });

    await blog.save();

    res.json(blog.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Unlike a blog
const unlikeBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ msg: "Blog not found" });
    }

    // Check if the blog has been liked by this user
    if (!blog.likes.some((like) => like.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: "Blog has not yet been liked" });
    }

    // Remove the like
    blog.likes = blog.likes.filter(
      ({ user }) => user.toString() !== req.user.id
    );

    await blog.save();

    res.json(blog.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Add comment to blog
const addComment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findById(req.user.id).select("-password");
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ msg: "Blog not found" });
    }

    const { text, isAnonymous } = req.body;

    const newComment = {
      text,
      user: req.user.id,
      isAnonymous,
    };

    // Only add name and avatar if not anonymous
    if (!isAnonymous) {
      newComment.name = user.name;
      newComment.avatar = user.avatar;
    }

    blog.comments.unshift(newComment);

    await blog.save();

    res.json(blog.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Delete comment
const deleteComment = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ msg: "Blog not found" });
    }

    // Pull out comment
    const comment = blog.comments.find(
      (comment) => comment.id === req.params.comment_id
    );

    // Make sure comment exists
    if (!comment) {
      return res.status(404).json({ msg: "Comment does not exist" });
    }

    // Check user is comment owner or blog owner or admin
    const user = await User.findById(req.user.id);
    if (
      comment.user.toString() !== req.user.id &&
      blog.user.toString() !== req.user.id &&
      user.role !== "admin"
    ) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    // Get remove index
    blog.comments = blog.comments.filter(
      ({ id }) => id !== req.params.comment_id
    );

    await blog.save();

    res.json(blog.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Get blogs by user
const getBlogsByUser = async (req, res) => {
  try {
    const blogs = await Blog.find({
      user: req.params.user_id,
      status: "active",
    }).sort({ date: -1 });

    if (!blogs.length) {
      return res.status(404).json({ msg: "No blogs found for this user" });
    }

    res.json(blogs);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "No blogs found for this user" });
    }
    res.status(500).send("Server Error");
  }
};

// Get blogs by tag
const getBlogsByTag = async (req, res) => {
  try {
    const blogs = await Blog.find({
      tags: req.params.tag_name,
      status: "active",
    }).sort({ date: -1 });

    if (!blogs.length) {
      return res.status(404).json({ msg: "No blogs found with this tag" });
    }

    // Remove user details for anonymous posts
    const sanitizedBlogs = blogs.map((blog) => {
      if (blog.isAnonymous) {
        return {
          ...blog._doc,
          user: null,
          name: "Anonymous",
        };
      }
      return blog;
    });

    res.json(sanitizedBlogs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Archive blog
const archiveBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ msg: "Blog not found" });
    }

    // Check if user is blog owner or admin
    const user = await User.findById(req.user.id);
    if (blog.user.toString() !== req.user.id && user.role !== "admin") {
      return res.status(401).json({ msg: "User not authorized" });
    }

    blog.status = "archived";
    await blog.save();

    res.json({ msg: "Blog archived" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Blog not found" });
    }
    res.status(500).send("Server Error");
  }
};

// Get all blogs (admin)
const getAllBlogsAdmin = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ date: -1 });
    res.json(blogs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

export default {
  createBlog,
  getAllBlogs,
  getBlogById,
  deleteBlog,
  updateBlog,
  likeBlog,
  unlikeBlog,
  addComment,
  deleteComment,
  getBlogsByUser,
  getBlogsByTag,
  archiveBlog,
  getAllBlogsAdmin,
};
