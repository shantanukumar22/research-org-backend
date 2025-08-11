import express from "express";
import connectDB from "./config/db.js";
import cors from "cors";
import userRoutes from "./routes/api/users.js";
import authRoutes from "./routes/api/auth.js";
import blogRoutes from "./routes/api/blogs.js";
import photographyRoutes from "./routes/api/photography.js";

const app = express();

// connecting to the mongodbatlas db
connectDB();

// middleware
app.use(express.json({ extended: false }));
app.use(cors({ origin: "*" }));

app.get("/", (req, res) => {
  res.send("API Running ");
});

// routes
app.use("/api/users", userRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/photography", photographyRoutes);
const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
  console.log(`server started on the port ${PORT}`);
});
