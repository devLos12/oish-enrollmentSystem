// models/Announcement.js
import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["Enrollment", "Event", "Academic"],
    },
    files: [
      {
        name: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        type: {
          type: String, // MIME type (image/jpeg, application/pdf, etc.)
        },
        size: {
          type: Number, // File size in bytes
        },
      },
    ],
    postedBy: { 
        type: String, 
        required: false 
    }
  },{ timestamps: true }
);

// Virtual for formatted date
announcementSchema.virtual("formattedDate").get(function () {
  return this.createdAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
});

const Announcement = mongoose.model("Announcement", announcementSchema);

export default Announcement;