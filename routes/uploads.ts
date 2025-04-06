import express from "express";
import { upload } from "../middleware/upload.middleware.js";
import { uploadToR2, deleteFromR2 } from "../config/cloudflareR2.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// Upload Image to Cloudflare R2
router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { category } = req.body; // Pass category from frontend ("avatar" or "listing")
    if (!category || (category !== "avatar" && category !== "listing")) {
      return res
        .status(400)
        .json({ error: "Invalid category. Use 'avatar' or 'listing'." });
    }

    const result = await uploadToR2(req.file, category);
    res.json({ imageUrl: result.url, key: result.key });
  } catch (error) {
    res.status(500).json({
      error: "Image upload failed",
      details: (error as Error).message,
    });
  }
});

// DELETE Image from Cloudflare R2
router.delete("/delete", async (req, res) => {
  try {
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({ error: "No image key provided" });
    }

    await deleteFromR2(key);
    res.json({ success: true, message: "Image deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Server error", details: (error as Error).message });
  }
});

export default router;
