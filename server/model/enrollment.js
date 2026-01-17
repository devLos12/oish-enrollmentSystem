import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema({
  schoolYear: { type: String, required: true },
  gradeLevelToEnroll: { type: String, required: true },
  
  withLRN: { type: Boolean, required: true },
  isReturning: { type: Boolean, required: true },

  learnerInfo: {
    email: { type: String, unique: true},
    psaNo: { type: String},
    lrn: { type: String, unique: true },
    lastName: { type: String, required: true },
    firstName: { type: String, required: true },
    middleName: { type: String },
    extensionName: { type: String },
    birthDate: { type: Date, required: true },
    age: { type: Number },
    sex: { type: String, enum: ["Male", "Female"], required: true },
    placeOfBirth: { type: String },
    motherTongue: { type: String },
    learnerWithDisability: {
      isDisabled: { type: Boolean, default: false },
      disabilityType: { type: [String] } // e.g. ["Visual Impairment", "Autism Spectrum Disorder"]
    },
    indigenousCommunity: {  
      isMember: { type: Boolean, default: false },
      name: { type: String }
    },
    fourPs: {
      isBeneficiary: { type: Boolean, default: false },
      householdId: { type: String }
    }
  },

  address: {
    current: {
      houseNo: { type: String },
      street: { type: String },
      barangay: { type: String },
      municipality: { type: String },
      province: { type: String },
      country: { type: String },
      zipCode: { type: String },
      contactNumber: { type: String }
    },
    permanent: {
      sameAsCurrent: { type: Boolean, default: false },
      houseNo: { type: String },
      street: { type: String },
      barangay: { type: String },
      municipality: { type: String },
      province: { type: String },
      country: { type: String },
      zipCode: { type: String }
    }
  },

  parentGuardianInfo: {
    father: {
      lastName: { type: String },
      firstName: { type: String },
      middleName: { type: String },
      contactNumber: { type: String }
    },
    mother: {
      lastName: { type: String },
      firstName: { type: String },
      middleName: { type: String },
      contactNumber: { type: String }
    },
    guardian: {
      lastName: { type: String },
      firstName: { type: String },
      middleName: { type: String },
      contactNumber: { type: String }
    }
  },

  //For Returning Learner (Balik-Aral) and Those Who will Transfer/Move In
  schoolHistory: {
    returningLearner: { type: Boolean, default: false },
    lastGradeLevelCompleted: { type: String },
    lastSchoolYearCompleted: { type: String },
    lastSchoolAttended: { type: String },
    schoolId: { type: String }
  },


  //For Learners in Senior High Schoo
  seniorHigh: {
    semester: { type: String, enum: ["1st", "2nd"] },
    track: { type: String },
    strand: { type: String }
  },

  

   // Required Documents - File paths
  requiredDocuments: {
    psaBirthCert: {
      filePath: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now }
    },
    reportCard: {
      filePath: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now }
    },
    goodMoral: {
      filePath: { type: String, required: false },
      uploadedAt: { type: Date, default: Date.now }
    },
    idPicture: {
      filePath: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now }
    },
 
  },
  signature: {
    dateSigned: { type: Date }
  },

  status: { type: String, default: "pending"},
  
  studentType: { 
    type: String, 
    enum:["regular", "returnee", "transferee"], 
    default: "regular"
  },
  createdAt: { type: Date, default: Date.now }
});

const Enrollment = new mongoose.model("Enrollment", enrollmentSchema);
export default Enrollment;