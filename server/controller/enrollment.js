import Enrollment from "../model/enrollment.js";
import multer from "multer";
import fs from "fs";
import path from "path";
import Student from "../model/student.js";
import Staff from "../model/staff.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import { error } from "console";





export const deleteApplicant = async (req, res) => {
  try {
    const id = req.params.id;

    await Enrollment.deleteOne({ _id: id});

    res.status(200).json({ message: "successfully deleted"});
  } catch (error) {
    res.status(500).json({ message: error.message});
  }
}



export const rejectApplicant = async (req, res) => {
  try {
    const enrollmentId = req.params.id;

    await Enrollment.findOneAndUpdate(
      {_id: enrollmentId,}, 
      { $set: { status: "rejected"}}, 
      { new: true}
    );
    

    res.status(200).json({ message: "Reject Applicant Succesfully."});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


export const GetAllEnrollments = async(req, res) => {
  try {
    
    const applicants = await Enrollment.find();

    if(!applicants || applicants.leng === 0) {
      return res.status(401).json({ message: "No Applicants available."});
    }

    res.status(200).json(applicants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


// Create uploads directory if it doesn't exist
const uploadDir = './uploads/enrollments';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

// File filter - accept only images and PDFs
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images (JPEG, JPG, PNG) and PDF files are allowed!'));
  }
};


// Multer instance
export const uploadDocuments = multer({ 
  storage: storage,
  fileFilter: fileFilter
});


// Upload fields configuration
export const enrollmentUpload = uploadDocuments.fields([
  { name: 'psaBirthCertFile', maxCount: 1 },
  { name: 'reportCardFile', maxCount: 1 },
  { name: 'goodMoralFile', maxCount: 1 },
  { name: 'idPictureFile', maxCount: 1 },
  // { name: 'medicalCertFile', maxCount: 1 },
  // { name: 'signatureFile', maxCount: 1 },

]);

// Helper function to delete uploaded files on error
const deleteUploadedFiles = (files) => {
  if (!files) return;
  
  Object.keys(files).forEach(key => {
    files[key].forEach(file => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });
  });
};




// CREATE ENROLLMENT
export const EnrollmentRegistration = async (req, res) => {
  try {

    // Check if files were uploaded

    // Parse JSON strings from form data
    const learnerInfo = JSON.parse(req.body.learnerInfo || '{}');
    const address = JSON.parse(req.body.address || '{}');
    const parentGuardianInfo = JSON.parse(req.body.parentGuardianInfo || '{}');
    const schoolHistory = JSON.parse(req.body.schoolHistory || '{}');
    const preferredLearningModality = JSON.parse(req.body.preferredLearningModality || '{}');
    const seniorHigh = JSON.parse(req.body.seniorHigh || '{}');
    const certification = JSON.parse(req.body.certification || '{}');



    // Build required documents object1
    const requiredDocuments = {
      psaBirthCert: {
        filePath: req.files['psaBirthCertFile']?.[0]?.path || null,
        uploadedAt: new Date()
      },
      reportCard: {
        filePath: req.files['reportCardFile']?.[0]?.path || null,
        uploadedAt: new Date()
      },
      goodMoral: {
        filePath: req.files['goodMoralFile']?.[0]?.path || null,
        uploadedAt: new Date()
      },
      idPicture: {
        filePath: req.files['idPictureFile']?.[0]?.path || null,
        uploadedAt: new Date()
      },
      // medicalCert: {
      //   filePath: req.files['medicalCertFile']?.[0]?.path || null,
      //   uploadedAt: new Date()
      // },
      
    };

    // Validate that all required documents are uploaded
    const missingDocs = [];
    if (!requiredDocuments.psaBirthCert.filePath) missingDocs.push('PSA Birth Certificate');
    if (!requiredDocuments.reportCard.filePath) missingDocs.push('Report Card');
    if (!requiredDocuments.idPicture.filePath) missingDocs.push('ID Picture');




    if (learnerInfo.email) {

      const existingEmailEnrollment = await Enrollment.findOne({
        "learnerInfo.email": learnerInfo.email
      });

      const existingEmailStudent = await Student.findOne({ email: learnerInfo.email });

      const existingEmailStaff = await Staff.findOne({ email: learnerInfo.email });

      if (existingEmailEnrollment || existingEmailStudent || existingEmailStaff) {
        deleteUploadedFiles(req.files);
        return res.status(409).json({ message: "Email already exists." });
      }

    }

    if (learnerInfo.lrn) {
      const existingLRN = await Enrollment.findOne({
        "learnerInfo.lrn": learnerInfo.lrn
      });

      if (existingLRN) {
        deleteUploadedFiles(req.files);
        return res.status(409).json({ message: "LRN is already registered" });
      }
    }

    if (missingDocs.length > 0) {
      deleteUploadedFiles(req.files);
      return res.status(400).json({ message: `Missing required documents: ${missingDocs.join(', ')}`});
    }


    // Build enrollment data
    const enrollmentData = {

      schoolYear: req.body.schoolYear,
      gradeLevelToEnroll: req.body.gradeLevelToEnroll,
      isReturning: req.body.isReturning,
      withLRN: req.body.withLRN,

      learnerInfo: {
        email: learnerInfo.email,
        lrn: learnerInfo.lrn,
        psaNo: learnerInfo.psaNo,
        lastName: learnerInfo.lastName,
        firstName: learnerInfo.firstName,
        middleName: learnerInfo.middleName,
        extensionName: learnerInfo.extensionName,
        birthDate: learnerInfo.birthDate,
        age: learnerInfo.age,
        sex: learnerInfo.sex,
        placeOfBirth: learnerInfo.placeOfBirth,
        motherTongue: learnerInfo.motherTongue,
        learnerWithDisability: learnerInfo.learnerWithDisability,
        indigenousCommunity: learnerInfo.indigenousCommunity,
        fourPs: learnerInfo.fourPs
      },

      address: {
        current: address.current,
        permanent: address.permanent
      },

      parentGuardianInfo: {
        father: parentGuardianInfo.father,
        mother: parentGuardianInfo.mother,
        guardian: parentGuardianInfo.guardian
      },

      schoolHistory: {
        returningLearner: schoolHistory.returningLearner,
        lastGradeLevelCompleted: schoolHistory.lastGradeLevelCompleted,
        lastSchoolYearCompleted: schoolHistory.lastSchoolYearCompleted,
        lastSchoolAttended: schoolHistory.lastSchoolAttended,
        schoolId: schoolHistory.schoolId
      },

      seniorHigh: {
        semester: seniorHigh.semester,
        track: seniorHigh.track,
        strand: seniorHigh.strand
      },

      // preferredLearningModality,
      requiredDocuments,
      signature: {
        // filePath: req.files['signatureFile']?.[0]?.path || null,
        dateSigned: certification.dateSigned
      },
      studentType: req.body.studentType || 'regular'
    };

    // Save to database
    const enrollment = await Enrollment.create(enrollmentData);

    res.status(201).json({
      success: true,
      message: "Enrollment created successfully",
      data: enrollment
    });

  } catch (error) {
    // Delete uploaded files if error occurs
    deleteUploadedFiles(req.files);
    
    console.error('Enrollment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Error creating enrollment"
    });
  }
};






const sendStudentAccount = async (email, studentNo, password) => {
    
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        })

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Application Status',
            html: `
                <h2>Student Account.</h2>
                <h1>Your enrollment application has been approved.</h1>
                <p>Your Student Number:</p>
                <p>${studentNo}</p>
                <p>Your Student password:</p>
                <p>${password}</p>
            `
        };

        await transporter.sendMail(mailOptions);  
        return { success: true }
        
    } catch (error) {
        console.error("Email sending failed:", error.message);
        return { success: false };
    }

}



export const ApplicantApproval = async (req, res) => {
  try {
    const { enrollmentId } = req.body;


    // 1. Find the enrollment applicant
    const applicant = await Enrollment.findOne({ _id: enrollmentId });
    if (!applicant) {
      return res.status(404).json({ message: "Applicant not found." });
    }

      // 1. Define unique counter ID per grade + strand/track + year
    const gradeNumber = parseInt(applicant.gradeLevelToEnroll.replace(/\D/g, ""), 10);
    const year = new Date().getFullYear();

    // Bilangin lahat ng student
    const studentCount = await Student.countDocuments({}); // walang filter
    const nextNumber = studentCount + 1;
    const studentNumber = `${year}-${String(nextNumber).padStart(4, "0")}`;


     // 3. CHECK DUPLICATE: studentNumber
    const existingStudentNumber = await Student.findOne({ studentNumber });
    
    if (existingStudentNumber) {
      return res.status(409).json({
        message: "Student Number already exists. Please try again."
      });
    }

    // 4. CHECK DUPLICATE: LRN
    const existingLRN = await Student.findOne({ lrn: applicant.learnerInfo.lrn });
    
    if (existingLRN) {
      return res.status(409).json({
        message: "LRN already exists for another student."
      });
    }
    
    // Default password setup
    const defaultPass = Math.random().toString(36).slice(-6);
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(defaultPass, salt);


    await Student.create({
      studentNumber,
      lrn: applicant.learnerInfo.lrn,
      firstName: applicant.learnerInfo.firstName,
      middleName: applicant.learnerInfo.middleName,
      lastName: applicant.learnerInfo.lastName,
      extensionName: applicant.learnerInfo.extensionName,
      birthDate: applicant.learnerInfo.birthDate,
      sex: applicant.learnerInfo.sex,
      contactNumber: applicant.address.current.contactNumber,
      email: applicant.learnerInfo.email,
      address: applicant.address.current,
      gradeLevel: gradeNumber,
      track: applicant.seniorHigh.track,
      strand: applicant.seniorHigh.strand,
      semester: parseInt(applicant?.seniorHigh?.semester?.replace(/\D/g, ""), 10),
      password: hashedPass,
      enrollmentYear: applicant.schoolYear
    });

    applicant.status = "approved",
    await applicant.save();

    sendStudentAccount(applicant.learnerInfo.email, studentNumber, defaultPass)
    .catch(err => console.log("Email sending failed: ", err))

    
    res.status(200).json({ message: "Applicant approved successfully"});

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
