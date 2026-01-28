import mongoose from "mongoose";

const SubjectSchema = new mongoose.Schema({
  subjectName: { type: String, required: true },
  subjectCode: { type: String, required: true},
  gradeLevel: { type: Number, required: true },       // 11 or 12
  strand: { type: String, required: false },
  section: { type: String, required: false },
  track: { type: String, required: false },           
  semester: { type: Number, default: 1 },            // optional
  subjectType: { type: String, enum: ["core", "specialized", "applied"], default: "core" },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff'},
  teacher: { type: String, required: false},
  // ✅ ADD SCHEDULE FIELDS
  // scheduleDay: { type: String, required: false },
  // scheduleStartTime: { type: String, required: false },
  // scheduleEndTime: { type: String, required: false },
  // room: { type: String, required: false },
  
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student"}],

  sections: [{
    sectionId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Section"},
    sectionName: { type: String, required: true },
    // scheduleDay: { type: String },
    scheduleStartTime: { type: String },
    scheduleEndTime: { type: String },
    room: { type: String },
    // students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }]
  }]

}, { timestamps: true });

const Subject = new mongoose.model("Subject", SubjectSchema);
export default Subject;