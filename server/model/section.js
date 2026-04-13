import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema({
  schoolYear: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "SchoolYear", 
    required: false 
  }, 
  name: String, // e.g. STEM-A, HUMSS-B
  gradeLevel: Number,
  track: String,
  strand: String,
  semester: Number,
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
  maxCapacity: { type: Number, default: 35 },
  isOpenEnrollment: { type: Boolean},
  isEnrolled: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student"}]
});

const Section  = mongoose.model("Section", sectionSchema);
export default Section