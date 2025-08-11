import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key,
  api_secret: process.env.api_secret,
});

// Cloudinary storage config for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "blogs", // Cloudinary folder name
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

// Create a custom storage for photography that allows folder override
const createPhotographyStorage = (folderName) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: folderName,
      allowed_formats: ["jpg", "png", "jpeg"],
    },
  });
};

// Multer middleware
const upload = multer({ storage });

// Photography upload middleware with custom folder
const photographyUpload = multer({ 
  storage: createPhotographyStorage("photography") 
});

export default upload;
export { photographyUpload, cloudinary };
