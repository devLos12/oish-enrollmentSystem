import Announcement from "../model/announcement.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Create uploads directory if it doesn't exist
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
  },
});

// Simple validation - images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (JPEG, JPG, PNG, GIF)"), false);
  }
};

// Configure multer - max 10 images, 5MB each
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max per file
  },
}).array("files", 10); // Max 10 images

// Multer middleware wrapper
export const uploadFiles = (req, res, next) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "File too large. Max size is 5MB per image" });
      }
      if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({ message: "Too many files. Maximum is 10 images" });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};


// Get all announcements
export const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate("postedBy", "firstName lastName")
      .sort({ createdAt: -1 });

    res.status(200).json(announcements);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).json({ message: "Failed to fetch announcements", error: error.message });
  }
};


// Get single announcement by ID
export const getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id)
      .populate("postedBy", "firstName lastName");

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    res.status(200).json(announcement);
  } catch (error) {
    console.error("Error fetching announcement:", error);
    res.status(500).json({ message: "Failed to fetch announcement", error: error.message });
  }
};

// Add new announcement
export const addAnnouncement = async (req, res) => {
  try {
    const { title, description, category } = req.body;


    // Simple validation
    if (!title || !description || !category) {
      return res.status(400).json({ message: "Title, description, and category are required" });
    }


    // Process uploaded images
    const files = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        files.push({
          name: file.originalname,
          url: `/uploads/${file.filename}`,
          type: file.mimetype,
          size: file.size,
        });
      });
    }

    // Create new announcement
    const newAnnouncement = new Announcement({
      title,
      description,
      category,
      files,
    });

    await newAnnouncement.save();

    res.status(201).json({ message: "Announcement created successfully"});
  } catch (error) {
    console.error("Error creating announcement:", error);
    res.status(500).json({ message: "Failed to create announcement", error: error.message });
  }
};


// Update announcement
export const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, filesToRemove } = req.body;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    // Update fields
    if (title) announcement.title = title;
    if (description) announcement.description = description;
    if (category) announcement.category = category;

    // Remove files if specified
    if (filesToRemove) {
      const filesToRemoveArray = JSON.parse(filesToRemove);
      
      // Delete physical files from server
      filesToRemoveArray.forEach((fileUrl) => {
        try {
          const filePath = path.join(process.cwd(), "uploads", path.basename(fileUrl));
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          console.error("Error deleting file:", err);
        }
      });

      // Remove from database
      announcement.files = announcement.files.filter(
        file => !filesToRemoveArray.includes(file.url)
      );
    }

    // Process new uploaded images
    if (req.files && req.files.length > 0) {
      const newFiles = [];
      req.files.forEach((file) => {
        newFiles.push({
          name: file.originalname,
          url: `/uploads/${file.filename}`,
          type: file.mimetype,
          size: file.size,
        });
      });
      announcement.files = [...announcement.files, ...newFiles];
    }

    await announcement.save();
    await announcement.populate("postedBy", "firstName lastName email");

    res.status(200).json({
      message: "Announcement updated successfully",
      announcement,
    });
  } catch (error) {
    console.error("Error updating announcement:", error);
    res.status(500).json({ message: "Failed to update announcement", error: error.message });
  }
};


// Delete announcement
export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    // Delete associated image files
    if (announcement.files && announcement.files.length > 0) {
      announcement.files.forEach((file) => {
        try {
          const filePath = path.join(process.cwd(), "uploads", path.basename(file.url));
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          console.error("Error deleting file:", err);
        }
      });
    }

    await Announcement.findByIdAndDelete(id);

    res.status(200).json({ message: "Announcement deleted successfully" });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    res.status(500).json({ message: "Failed to delete announcement", error: error.message });
  }
};