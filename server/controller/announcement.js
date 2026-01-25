import Announcement from "../model/announcement.js";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";



// Helper function to upload to Cloudinary
const uploadToCloudinary = (fileBuffer, originalname) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "announcements", // Folder sa Cloudinary
        resource_type: "auto",
        public_id: `${Date.now()}-${originalname.split('.')[0]}`,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};


// Configure multer storage
const storage = multer.memoryStorage();




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


 // Upload images to Cloudinary
  const files = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      try {
        const result = await uploadToCloudinary(file.buffer, file.originalname);
        files.push({
          name: file.originalname,
          url: result.secure_url,
          publicId: result.public_id, // Important for deletion later
          type: file.mimetype,
          size: file.size,
        });
      } catch (uploadError) {
        console.error("Error uploading to Cloudinary:", uploadError);
        // You can choose to continue or throw error
      }
    }
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
      
      // Delete from Cloudinary using publicId
      for (const fileUrl of filesToRemoveArray) {
        try {
          // Find the file in announcement.files to get publicId
          const fileToDelete = announcement.files.find(f => f.url === fileUrl);
          if (fileToDelete && fileToDelete.publicId) {
            await cloudinary.uploader.destroy(fileToDelete.publicId);
          }
        } catch (err) {
          console.error("Error deleting from Cloudinary:", err);
        }
      }

      // Remove from database
      announcement.files = announcement.files.filter(
        file => !filesToRemoveArray.includes(file.url)
      );
    }


    // Upload new images to Cloudinary
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await uploadToCloudinary(file.buffer, file.originalname);
          announcement.files.push({
            name: file.originalname,
            url: result.secure_url,
            publicId: result.public_id,
            type: file.mimetype,
            size: file.size,
          });
        } catch (uploadError) {
          console.error("Error uploading to Cloudinary:", uploadError);
        }
      }
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
      for (const file of announcement.files) {
        try {
          if (file.publicId) {
            cloudinary.uploader.destroy(file.publicId);1
          }
        } catch (err) {
          console.error("Error deleting from Cloudinary:", err);
        }
      }
    }

    await Announcement.findByIdAndDelete(id);
    res.status(200).json({ message: "Announcement deleted successfully" });

    
  } catch (error) {
    console.error("Error deleting announcement:", error);
    res.status(500).json({ message: "Failed to delete announcement", error: error.message });
  }
};