import multer from "multer";
import path from "path";
import fs from "fs";
import sizeOf from "image-size";

import crypto from "crypto";
import { updateSlimUsernameStatus } from "../src/skin-providers/is-slim.js";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, `${crypto.randomUUID()}.png`); 
  },
});

const fileFilter = (req, file, cb) => {
  const isPng =
    file.mimetype === "image/png" ||
    path.extname(file.originalname).toLowerCase() === ".png";
  if (isPng) {
    cb(null, true);
  } else {
    cb(new Error("Only PNG images are allowed!"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 64 * 1024 }, // 64 KB max
});

export function handleAvatarUpload(req, res, next) {
  upload.single("skin")(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File size exceeds the 64 KB limit." });
    }
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}

export function processAvatar(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }
  const { name, slim } = req.body;
  if (!name || typeof name !== "string") {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: "Missing or invalid 'name' field." });
  }
  if (name.length < 3 || name.length > 16) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({
      error: `Name must be 3-16 characters (got ${name.length}).`,
    });
  }
  if (!/^[a-zA-Z0-9_\- ]+$/.test(name)) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: "Name contains invalid characters." });
  }
  const safeUsername = name.replace(/[^a-zA-Z0-9_\-]/g, "");
  const finalPath = path.join("uploads", `${safeUsername}.png`);

  try {
    const buffer = fs.readFileSync(req.file.path);
    const dimensions = sizeOf(buffer);

    if (dimensions.width > 64 || dimensions.height > 64) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: `Dimensions (${dimensions.width}x${dimensions.height}) exceed 64x64 pixels.`,
      });
    }
    fs.renameSync(req.file.path, finalPath);
    updateSlimUsernameStatus(safeUsername, slim == "on")
    res.status(200).json({
      message: "Skin uploaded successfully!",
      access_key: safeUsername,
    });
  } catch (err) {
    console.error(err.stack);
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: "Failed to process image properties." });
  }
}