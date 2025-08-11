import { validationResult } from "express-validator";
import Photography from "../models/Photography.js";
import User from "../models/User.js";

// Create a photography collection
const createPhotography = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { title, description, category, tags } = req.body;
    const imageUrls = req.files ? req.files.map(file => file.path) : [];

    if (imageUrls.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
    }

    const newPhotography = new Photography({
      title,
      description,
      images: imageUrls,
      category,
      tags: Array.isArray(tags)
        ? tags.map((tag) => tag.trim())
        : typeof tags === "string"
        ? tags.split(",").map((tag) => tag.trim())
        : [],
      createdBy: req.user.id,
    });

    const photography = await newPhotography.save();
    res.json(photography);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Get all photography collections
const getAllPhotography = async (req, res) => {
  try {
    const photography = await Photography.find({ status: "active" })
      .sort({ date: -1 })
      .populate("createdBy", ["name", "avatar"]);
    
    res.json(photography);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Get photography by ID
const getPhotographyById = async (req, res) => {
  try {
    const photography = await Photography.findById(req.params.id)
      .populate("createdBy", ["name", "avatar"]);

    if (!photography || photography.status === "deleted") {
      return res.status(404).json({ msg: "Photography collection not found" });
    }

    res.json(photography);
  } catch (err) {
    console.error("Error in getPhotographyById:", err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Photography collection not found" });
    }
    return res.status(500).json({ msg: "Server Error" });
  }
};

// Delete a photography collection
const deletePhotography = async (req, res) => {
  try {
    const photography = await Photography.findById(req.params.id);

    if (!photography) {
      return res.status(404).json({ msg: "Photography collection not found" });
    }

    // Check if user owns the collection or is admin
    const user = await User.findById(req.user.id);
    if (photography.createdBy.toString() !== req.user.id && user.role !== "admin") {
      return res.status(401).json({ msg: "User not authorized" });
    }

    // Soft delete - update status
    photography.status = "deleted";
    await photography.save();

    res.json({ msg: "Photography collection removed" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Photography collection not found" });
    }
    res.status(500).send("Server Error");
  }
};

// Update a photography collection
const updatePhotography = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const photography = await Photography.findById(req.params.id);

    if (!photography) {
      return res.status(404).json({ msg: "Photography collection not found" });
    }

    // Check if user owns the collection
    if (photography.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    const { title, description, category, tags } = req.body;
    const newImageUrls = req.files ? req.files.map(file => file.path) : [];

    photography.title = title;
    photography.description = description;
    photography.category = category;

    if (tags) {
      photography.tags = tags.split(",").map((tag) => tag.trim());
    }

    // Add new images if any
    if (newImageUrls.length > 0) {
      photography.images = [...photography.images, ...newImageUrls];
    }

    await photography.save();

    res.json(photography);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Photography collection not found" });
    }
    res.status(500).send("Server Error");
  }
};

// Get photography by category
const getPhotographyByCategory = async (req, res) => {
  try {
    const photography = await Photography.find({
      category: req.params.category,
      status: "active",
    }).sort({ date: -1 });

    if (!photography.length) {
      return res.status(404).json({ msg: "No photography found in this category" });
    }

    res.json(photography);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Get all photography (admin)
const getAllPhotographyAdmin = async (req, res) => {
  try {
    const photography = await Photography.find().sort({ date: -1 });
    res.json(photography);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

export default {
  createPhotography,
  getAllPhotography,
  getPhotographyById,
  deletePhotography,
  updatePhotography,
  getPhotographyByCategory,
  getAllPhotographyAdmin,
}; 