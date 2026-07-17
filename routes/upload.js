import multer from "multer";
import path from "path";
import fs from "fs";
import sizeOf from "image-size";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const username = req.params.username || "anonymous";
    const safeUsername = username.replace(/[^a-zA-Z0-9_\-]/g, "");
    cb(null, `${safeUsername}.png`);
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
  upload.single("avatar")(req, res, (err) => {
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
  try {
    const dimensions = sizeOf(req.file.path);

    if (dimensions.width > 64 || dimensions.height > 64) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: `Dimensions (${dimensions.width}x${dimensions.height}) exceed 64x64 pixels.`,
      });
    }

    res.status(200).json({
      message: "Avatar uploaded successfully!",
      filename: req.file.filename,
    });
  } catch (err) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: "Failed to process image properties." });
  }
}