// backend/models/GradeTemplate.js
import mongoose from "mongoose";

const GradeTemplateSchema = new mongoose.Schema({
  gradeLevel: { type: Number, required: true },
  strand: { type: String, required: true },
  subjects: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Subject" }  // link sa Subject collection
  ]
}, { timestamps: true });

export default mongoose.model("GradeTemplate", GradeTemplateSchema);
