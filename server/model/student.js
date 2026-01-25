import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  studentNumber: {            
    type: String,
    required: true,
    unique: true
  },

  lrn: { 
    type: String,
    required: true,
    unique: true
  },
  profileImage: {  type: String, required: false },
  publicId:{
      type: String, 
      required: false,
  },

  firstName: { type: String, required: true },
  middleName: { type: String },
  lastName: { type: String, required: true },
  extensionName: { type: String }, 

  birthDate: { type: Date, required: true },
  sex: { type: String, enum: ["Male", "Female"], required: true },

  contactNumber: { type: String },
  email: { type: String, required: true, unique: true },

  address: {
      houseNo: { type: String },
      street: { type: String },
      barangay: { type: String },
      municipality: { type: String },
      province: { type: String },
      country: { type: String },
      zipCode: { type: String },
  },

  gradeLevel: {
    type: Number,
    enum: [11, 12],
    required: true
  },

  track: {
    type: String,
    required: false
  },

  strand: {
    type: String,
    required: false
  },
  semester: Number,
  // 🔹 Subjects assigned automatically after enrollment approval
  subjects: [
    {
      subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject"
      },
      subjectName: String,
      subjectTeacher: String,
      semester: Number
    }
  ],

  enrollmentYear: { type: String },  
  password: String,  
  section: String , 

  
  status: {
    type: String,
    enum: ["pending", "enrolled", "unenrolled", "dropped", "graduated"],
    default: "pending"
  },
  
  studentType: { type: String, enum: ["regular", "repeater", "graduated"], default: "regular"},
  
  
  registrationHistory: [
    {
      lrn: { type: String, required: true},
      studentNumber: { type: String, required: true},
      firstName: { type: String, required: true },
      lastName: {type: String, required: true},
      track: { type: String, required: true},
      semester: { type: Number, required: true },
      schoolYear: { type: String, required: true },  // e.g. "2025-2026"
      gradeLevel: { type: Number, required: true },
      section: { type: String },
      strand: { type: String },
      subjects: [
        {
          subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subject"
          },
          subjectName: String,
          subjectTeacher: String,
          semester: Number
        }
      ],
      dateCreated: { type: Date, default: Date.now }
    }
  ],
  repeatedSubjects: [
    { 
      subjectCode: String,
      subjectName: String,
      semester: { type: Number},
      status: { type: String, default: "pending"}
    }
  ],
  repeatedSection: { type: String},
  hasEnrollmentRequest: { type: Boolean, default: false},
  createdAt: { type: Date, default: Date.now }
});

const Student = mongoose.model("Student", studentSchema);
export default Student;
