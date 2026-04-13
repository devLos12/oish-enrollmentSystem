import mongoose from "mongoose";

const schoolYearSchema = new mongoose.Schema({
  label: { 
    type: String, 
    required: true, 
    unique: true
  },
  schoolYear: { 
    type: String, 
    required: true
  },
  semester: { 
    type: Number, 
    enum: [1, 2], 
    required: true  
  },
  isActive: { 
    type: Boolean, 
    default: false  // Admin's current "viewing" state
  },
  isCurrent: {
    type: Boolean,
    default: false  // The REAL current semester (teachers/students use this)
  },
  enrollmentStatus: {
    type: String,
    enum: ["open", "closed"],
    default: "closed"
  }
}, { timestamps: true });

const SchoolYear = mongoose.model("SchoolYear", schoolYearSchema);
export default SchoolYear;