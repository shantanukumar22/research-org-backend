import express from "express";
import { photographyUpload } from "./middleware/upload.js";

const app = express();

// Test route to check if photographyUpload is working
app.post("/test-upload", photographyUpload.array("images", 10), (req, res) => {
  console.log("Files received:", req.files);
  console.log("Body received:", req.body);
  
  if (req.files && req.files.length > 0) {
    const imageUrls = req.files.map(file => file.path);
    res.json({ 
      success: true, 
      message: "Upload successful", 
      files: req.files.length,
      imageUrls 
    });
  } else {
    res.status(400).json({ 
      success: false, 
      message: "No files received" 
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log("Test the upload endpoint with: curl -X POST -F 'images=@image1.jpg' -F 'images=@image2.jpg' http://localhost:3001/test-upload");
}); 