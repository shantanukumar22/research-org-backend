import mongoose from "mongoose";
const Schema = mongoose.Schema;

const PhotographySchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  images: [{
    type: String,
    required: true,
  }],
  category: {
    type: String,
    required: false,
    default: "general"
  },
  tags: [{
    type: String,
  }],
  date: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    default: "active",
    enum: ["active", "archived", "deleted"],
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  }
});

const Photography = mongoose.model("photography", PhotographySchema);
export default Photography; 