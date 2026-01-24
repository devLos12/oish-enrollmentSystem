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
    
    const applicants = await Enrollment.find({ statusRegistration: "complete"});

    
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
  const allowedTypes = /jpeg|jpg|png/;
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
// export const EnrollmentRegistration = async (req, res) => {
//   try {

//     // Check if files were uploaded

//     // Parse JSON strings from form data
//     const learnerInfo = JSON.parse(req.body.learnerInfo || '{}');
//     const address = JSON.parse(req.body.address || '{}');
//     const parentGuardianInfo = JSON.parse(req.body.parentGuardianInfo || '{}');
//     const schoolHistory = JSON.parse(req.body.schoolHistory || '{}');
//     const preferredLearningModality = JSON.parse(req.body.preferredLearningModality || '{}');
//     const seniorHigh = JSON.parse(req.body.seniorHigh || '{}');
//     const certification = JSON.parse(req.body.certification || '{}');

//     // Build required documents object1
//     const requiredDocuments = {
//       psaBirthCert: {
//         filePath: req.files['psaBirthCertFile']?.[0]?.path || null,
//         uploadedAt: new Date()
//       },
//       reportCard: {
//         filePath: req.files['reportCardFile']?.[0]?.path || null,
//         uploadedAt: new Date()
//       },
//       goodMoral: {
//         filePath: req.files['goodMoralFile']?.[0]?.path || null,
//         uploadedAt: new Date()
//       },
//       idPicture: {
//         filePath: req.files['idPictureFile']?.[0]?.path || null,
//         uploadedAt: new Date()
//       },
//       // medicalCert: {
//       //   filePath: req.files['medicalCertFile']?.[0]?.path || null,
//       //   uploadedAt: new Date()
//       // },
      
//     };

//     // Validate that all required documents are uploaded
//     const missingDocs = [];
//     if (!requiredDocuments.psaBirthCert.filePath) missingDocs.push('PSA Birth Certificate');
//     if (!requiredDocuments.reportCard.filePath) missingDocs.push('Report Card');
//     if (!requiredDocuments.idPicture.filePath) missingDocs.push('ID Picture');




//     if (learnerInfo.email) {

//       const existingEmailEnrollment = await Enrollment.findOne({
//         "learnerInfo.email": learnerInfo.email
//       });

//       const existingEmailStudent = await Student.findOne({ email: learnerInfo.email });

//       const existingEmailStaff = await Staff.findOne({ email: learnerInfo.email });

//       if (existingEmailEnrollment || existingEmailStudent || existingEmailStaff) {
//         deleteUploadedFiles(req.files);
//         return res.status(409).json({ message: "Email already exists." });
//       }

//     }

//     if (learnerInfo.lrn) {
//       const existingLRN = await Enrollment.findOne({
//         "learnerInfo.lrn": learnerInfo.lrn
//       });

//       if (existingLRN) {
//         deleteUploadedFiles(req.files);
//         return res.status(409).json({ message: "LRN is already registered" });
//       }
//     }

//     if (missingDocs.length > 0) {
//       deleteUploadedFiles(req.files);
//       return res.status(400).json({ message: `Missing required documents: ${missingDocs.join(', ')}`});
//     }


//     // Build enrollment data
//     const enrollmentData = {

//       schoolYear: req.body.schoolYear,
//       gradeLevelToEnroll: req.body.gradeLevelToEnroll,
//       isReturning: req.body.isReturning,
//       withLRN: req.body.withLRN,

//       learnerInfo: {
//         email: learnerInfo.email,
//         lrn: learnerInfo.lrn,
//         psaNo: learnerInfo.psaNo,
//         lastName: learnerInfo.lastName,
//         firstName: learnerInfo.firstName,
//         middleName: learnerInfo.middleName,
//         extensionName: learnerInfo.extensionName,
//         birthDate: learnerInfo.birthDate,
//         age: learnerInfo.age,
//         sex: learnerInfo.sex,
//         placeOfBirth: learnerInfo.placeOfBirth,
//         motherTongue: learnerInfo.motherTongue,
//         learnerWithDisability: learnerInfo.learnerWithDisability,
//         indigenousCommunity: learnerInfo.indigenousCommunity,
//         fourPs: learnerInfo.fourPs
//       },

//       address: {
//         current: address.current,
//         permanent: address.permanent
//       },

//       parentGuardianInfo: {
//         father: parentGuardianInfo.father,
//         mother: parentGuardianInfo.mother,
//         guardian: parentGuardianInfo.guardian
//       },

//       schoolHistory: {
//         returningLearner: schoolHistory.returningLearner,
//         lastGradeLevelCompleted: schoolHistory.lastGradeLevelCompleted,
//         lastSchoolYearCompleted: schoolHistory.lastSchoolYearCompleted,
//         lastSchoolAttended: schoolHistory.lastSchoolAttended,
//         schoolId: schoolHistory.schoolId
//       },

//       seniorHigh: {
//         semester: seniorHigh.semester,
//         track: seniorHigh.track,
//         strand: seniorHigh.strand
//       },

//       // preferredLearningModality,
//       requiredDocuments,
//       signature: {
//         // filePath: req.files['signatureFile']?.[0]?.path || null,
//         dateSigned: certification.dateSigned
//       },
//       studentType: req.body.studentType || 'regular'
//     };

//     // Save to database
//     const enrollment = await Enrollment.create(enrollmentData);

//     res.status(201).json({
//       success: true,
//       message: "Enrollment created successfully",
//       data: enrollment
//     });

//   } catch (error) {
//     // Delete uploaded files if error occurs
//     deleteUploadedFiles(req.files);
    
//     console.error('Enrollment error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message || "Error creating enrollment"
//     });
//   }
// };



// SINGLE ENDPOINT: /api/enrollment

export const EnrollmentRegistration = async (req, res) => {
  try {
    const { step, enrollmentId } = req.body; // step: "step1" | "step2" | "step3"
    

    // ==========================================
    // STEP 1: CREATE NEW ENROLLMENT
    // ==========================================
    if (step === "step1") {
      const learnerInfo = JSON.parse(req.body.learnerInfo || '{}');



      if (learnerInfo.psaNo && learnerInfo.psaNo !== 'N/A') {
        if (!/^\d{12}$/.test(learnerInfo.psaNo)) {
            return res.status(400).json({ message: 'PSA Birth Certificate No. must be exactly 12 digits' });
        }
      }

      // ✅ VALIDATION: LRN must be exactly 12 digits if provided
      if (learnerInfo.lrn && learnerInfo.lrn !== 'N/A') {
          if (!/^\d{12}$/.test(learnerInfo.lrn)) {
              return res.status(400).json({ message: 'LRN must be exactly 12 digits' });
          }
      }

      // ✅ VALIDATION: Check required fields
      const requiredFields = [
          { field: 'gradeLevelToEnroll', message: 'Grade Level to Enroll is required' },
          { field: 'withLRN', message: 'Please answer "With LRN?" question' },
          { field: 'isReturning', message: 'Please answer "Returning (Balik-Aral)?" question' },
      ];

        // Check top-level required fields
      for (const { field, message } of requiredFields) {
          if (!req.body[field]) {
              return res.status(400).json({ message });
          }
      }


      const learnerRequiredFields = [
        { field: 'email', message: 'Email is required' },
        { field: 'lastName', message: 'Last Name is required' },
        { field: 'firstName', message: 'First Name is required' },
        { field: 'middleName', message: 'Middle Name is required' },
        { field: 'birthDate', message: 'Birth Date is required' },
        { field: 'age', message: 'Age is required' },
        { field: 'sex', message: 'Sex is required' },
        { field: 'placeOfBirth', message: 'Place of Birth is required' },
        { field: 'motherTongue', message: 'Mother Tongue is required' },
      ];


      for (const { field, message } of learnerRequiredFields) {
        if (!learnerInfo[field] || learnerInfo[field].trim() === '') {
            return res.status(400).json({ message });
        }
      } 

      // ✅ VALIDATION: Sex is required
      if (!learnerInfo.sex || learnerInfo.sex.trim() === '') {
        return res.status(400).json({ message: 'Sex is required' });
      }

      // ✅ VALIDATION: Learner with disability question must be answered
      if (!learnerInfo.learnerWithDisability?.isDisabled || 
          learnerInfo.learnerWithDisability.isDisabled.trim() === '') {
        return res.status(400).json({ 
          message: 'Please answer if learner has disability' 
        });
      }

      // ✅ VALIDATION: If learner has disability, disability type is required
      if (learnerInfo.learnerWithDisability?.isDisabled === 'Yes') {
        if (!learnerInfo.learnerWithDisability?.disabilityType || 
            learnerInfo.learnerWithDisability.disabilityType.length === 0) {
          return res.status(400).json({ 
            message: 'Please select at least one disability type' 
          });
        }
      }

      // ✅ VALIDATION: If member of indigenous community, name is required
      if (learnerInfo.indigenousCommunity?.isMember === 'Yes') {
        if (!learnerInfo.indigenousCommunity?.name || 
            learnerInfo.indigenousCommunity.name.trim() === '') {
          return res.status(400).json({ 
            message: 'Indigenous Community name is required' 
          });
        }
      }

      // ✅ VALIDATION: If 4Ps beneficiary, household ID is required
      if (learnerInfo.fourPs?.isBeneficiary === 'Yes') {
        if (!learnerInfo.fourPs?.householdId || 
            learnerInfo.fourPs.householdId.trim() === '') {
          return res.status(400).json({ 
            message: '4Ps Household ID is required' 
          });
        }
      }

      // ✅ VALIDATION: LRN is required if "With LRN?" is "Yes"
      if (req.body.withLRN === 'Yes' && (!learnerInfo.lrn || learnerInfo.lrn.trim() === '')) {
          return res.status(400).json({ message: 'LRN is required when "With LRN?" is Yes' });
      }

      // ✅ VALIDATION: Email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(learnerInfo.email)) {
          return res.status(400).json({ message: 'Invalid email format' });
      }

      // Validation checks
      if (learnerInfo.email) {
        const existingEmailEnrollment = await Enrollment.findOne({
          "learnerInfo.email": learnerInfo.email
        });
        const existingEmailStudent = await Student.findOne({ email: learnerInfo.email });
        const existingEmailStaff = await Staff.findOne({ email: learnerInfo.email });

        if (existingEmailEnrollment || existingEmailStudent || existingEmailStaff) {
          return res.status(409).json({ message: "Email already exists." });
        }
      }


      if (learnerInfo.lrn) {
        const existingLRN = await Enrollment.findOne({
          "learnerInfo.lrn": learnerInfo.lrn
        });

        if (existingLRN) {
          return res.status(409).json({ message: "LRN is already registered" });
        }
      }





      //  Auto-generate school year
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;
      const autoSchoolYear = `${currentYear}-${nextYear}`;

      //  Handle optional fields - set to "N/A" if empty
      const psaNo = learnerInfo.psaNo?.trim() || 'N/A';
      const extensionName = learnerInfo.extensionName?.trim() || 'N/A';

      //  Handle LRN - if "With LRN?" is "No", set to "N/A"
      const lrn = req.body.withLRN === 'No' ? 'N/A' : (learnerInfo.lrn?.trim() || 'N/A');


      // Create new enrollment record
      const enrollment = await Enrollment.create({


        schoolYear: autoSchoolYear,  //  Auto-generated
        gradeLevelToEnroll: req.body.gradeLevelToEnroll,
        
        // Top-level boolean conversions
        withLRN: req.body.withLRN === 'Yes',
        isReturning: req.body.isReturning === 'Yes',
        
        learnerInfo: {
          // Basic fields (direct pass-through)
          email: learnerInfo.email,
          lrn: lrn,  // ✅ "N/A" if withLRN is "No" or empty
          psaNo: psaNo,  // ✅ "N/A" if empty
          lastName: learnerInfo.lastName,
          firstName: learnerInfo.firstName,
          middleName: learnerInfo.middleName,
          extensionName: extensionName,  // ✅ "N/A" if empty
          birthDate: learnerInfo.birthDate,
          age: learnerInfo.age,
          sex: learnerInfo.sex,
          placeOfBirth: learnerInfo.placeOfBirth,
          motherTongue: learnerInfo.motherTongue,
          
          // ✅ Nested object 1: learnerWithDisability
          learnerWithDisability: {
              isDisabled: learnerInfo.learnerWithDisability?.isDisabled === 'Yes',  // "Yes" → true, "No" → false
              disabilityType: learnerInfo.learnerWithDisability?.disabilityType || []
          },
          
          // ✅ Nested object 2: indigenousCommunity
          indigenousCommunity: {
              isMember: learnerInfo.indigenousCommunity?.isMember === 'Yes',  // "Yes" → true, "No" → false
              name: learnerInfo.indigenousCommunity?.name || ''
          },
          
          // ✅ Nested object 3: fourPs
          fourPs: {
              isBeneficiary: learnerInfo.fourPs?.isBeneficiary === 'Yes',  // "Yes" → true, "No" → false
              householdId: learnerInfo.fourPs?.householdId || ''
          },

        },

        statusRegistration: "incomplete"
      });

      return res.status(201).json({
        success: true,
        message: "Step 1 saved successfully",
        enrollmentId: enrollment._id, 
        step1: true,
      });
    }

    // ==========================================
    // STEP 2: UPDATE ADDRESS & PARENTS INFO
    // ==========================================
    if (step === "step2") {
      if (!enrollmentId) {
        return res.status(400).json({ message: "Enrollment ID is required" });
      }

      const address = JSON.parse(req.body.address || '{}');
      const parentGuardianInfo = JSON.parse(req.body.parentGuardianInfo || '{}');
      const schoolHistory = JSON.parse(req.body.schoolHistory || '{}');
      const seniorHigh = JSON.parse(req.body.seniorHigh || '{}');

      // ✅ VALIDATION: Current Address - ALL REQUIRED
      const requiredCurrentFields = [
        { field: 'street', message: 'Current Address: Street is required' },
        { field: 'barangay', message: 'Current Address: Barangay is required' },
        { field: 'municipality', message: 'Current Address: Municipality is required' },
        { field: 'province', message: 'Current Address: Province is required' },
        { field: 'country', message: 'Current Address: Country is required' },
        { field: 'zipCode', message: 'Current Address: Zip Code is required' },
        { field: 'contactNumber', message: 'Current Address: Contact Number is required' }
      ];

      for (const { field, message } of requiredCurrentFields) {
        if (!address.current?.[field] || address.current[field].trim() === '') {
          return res.status(400).json({ message });
        }
      }

      // ✅ VALIDATION: Permanent Address (if NOT same as current)
      if (!address.permanent?.sameAsCurrent) {
        const requiredPermFields = [
          { field: 'street', message: 'Permanent Address: Street is required' },
          { field: 'barangay', message: 'Permanent Address: Barangay is required' },
          { field: 'municipality', message: 'Permanent Address: Municipality is required' },
          { field: 'province', message: 'Permanent Address: Province is required' },
          { field: 'country', message: 'Permanent Address: Country is required' },
          { field: 'zipCode', message: 'Permanent Address: Zip Code is required' }
        ];

        for (const { field, message } of requiredPermFields) {
          if (!address.permanent?.[field] || address.permanent[field].trim() === '') {
            return res.status(400).json({ message });
          }
        }
      }

      // ✅ VALIDATION: Guardian is REQUIRED (Father & Mother are OPTIONAL)
      const requiredGuardianFields = [
        { field: 'lastName', message: 'Guardian Last Name is required' },
        { field: 'firstName', message: 'Guardian First Name is required' }
      ];



      for (const { field, message } of requiredGuardianFields) {
        if (!parentGuardianInfo.guardian?.[field] || parentGuardianInfo.guardian[field].trim() === '') {
          return res.status(400).json({ message });
        }
      }

      // ✅ VALIDATION: School History (ONLY if returningLearner is checked)
      if (schoolHistory.returningLearner) {
        // Must select either transferee or returnee
        if (!req.body.studentType || (req.body.studentType !== 'transferee' && req.body.studentType !== 'returnee')) {
          return res.status(400).json({ message: 'Please select either Transferee or Returning Learner' });
        }

        const requiredSchoolFields = [
          { field: 'lastGradeLevelCompleted', message: 'Last Grade Level Completed is required' },
          { field: 'lastSchoolYearCompleted', message: 'Last School Year Completed is required' },
          { field: 'lastSchoolAttended', message: 'Last School Attended is required' },
          { field: 'schoolId', message: 'School ID is required' }
        ];

        for (const { field, message } of requiredSchoolFields) {
          if (!schoolHistory[field] || schoolHistory[field].trim() === '') {
            return res.status(400).json({ message });
          }
        }
      }

      // ✅ VALIDATION: Senior High - ALL REQUIRED
      const requiredSeniorHighFields = [
        { field: 'semester', message: 'Semester is required' },
        { field: 'track', message: 'Track is required' },
        { field: 'strand', message: 'Strand is required' }
      ];

      for (const { field, message } of requiredSeniorHighFields) {
        if (!seniorHigh[field] || seniorHigh[field].trim() === '') {
          return res.status(400).json({ message });
        }
      }



      if (!address.current.houseNo || address.current.houseNo.trim() === '') {
        address.current.houseNo = 'N/A';
      }

      if (!address.permanent?.sameAsCurrent) {
        if (!address.permanent.houseNo || address.permanent.houseNo.trim() === '') {
          address.permanent.houseNo = 'N/A';
        }
      }


      if (!address.current.houseNo || address.current.houseNo.trim() === '') {
        address.current.houseNo = 'N/A';
      }

      if (!address.permanent?.sameAsCurrent) {
        if (!address.permanent.houseNo || address.permanent.houseNo.trim() === '') {
          address.permanent.houseNo = 'N/A';
        }
      }

      // ✅ Set N/A for Father's empty fields
      const parentTypes = ['father', 'mother'];
      const parentFields = ['lastName', 'firstName', 'middleName', 'contactNumber'];

      parentTypes.forEach(parentType => {
        if (!parentGuardianInfo[parentType]) {
          parentGuardianInfo[parentType] = {};
        }
        
        parentFields.forEach(field => {
          if (!parentGuardianInfo[parentType][field] || parentGuardianInfo[parentType][field].trim() === '') {
            parentGuardianInfo[parentType][field] = 'N/A';
          }
        });
      });


      // ✅ Set N/A for Guardian's OPTIONAL fields (middleName, contactNumber)
      const guardianOptionalFields = ['middleName', 'contactNumber'];
      guardianOptionalFields.forEach(field => {
        if (!parentGuardianInfo.guardian[field] || parentGuardianInfo.guardian[field].trim() === '') {
          parentGuardianInfo.guardian[field] = 'N/A';
        }
      });


      // ✅ Proceed with update
      const enrollment = await Enrollment.findByIdAndUpdate(
        enrollmentId,
        {
          $set: {
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
            studentType: req.body.studentType || 'regular'
          }
        },
        { new: true }
      );

      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }

      return res.status(200).json({
        success: true,
        message: "Step 2 saved successfully",
        step2: true,
        
      });
    }

    // ==========================================
    // STEP 3: UPLOAD DOCUMENTS & FINALIZE
    // ==========================================
    // STEP 3: UPLOAD DOCUMENTS & FINALIZE
    if (step === "step3") {
      if (!enrollmentId) {
        return res.status(400).json({ message: "Enrollment ID is required" });
      }

      // ✅ Additional validation - check file types
      const uploadedFiles = req.files;
      if (uploadedFiles) {
        const fileFields = ['psaBirthCertFile', 'reportCardFile', 'idPictureFile', 'goodMoralFile'];
        
        for (const fieldName of fileFields) {
          const file = uploadedFiles[fieldName]?.[0];
          if (file) {
            const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            const allowedExtensions = ['.jpg', '.jpeg', '.png'];
            
            const ext = path.extname(file.originalname).toLowerCase();
            const mimeType = file.mimetype;
            
            if (!allowedMimeTypes.includes(mimeType) || !allowedExtensions.includes(ext)) {
              deleteUploadedFiles(req.files);
              return res.status(400).json({ 
                message: `${fieldName}: Only JPG and PNG files are allowed!`
              });
            }
          }
        }
      }

      // Build required documents object
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
        }
      };

      // Validate required documents (3 required, goodMoral optional)
      const missingDocs = [];
      if (!requiredDocuments.psaBirthCert.filePath) missingDocs.push('PSA Birth Certificate');
      if (!requiredDocuments.reportCard.filePath) missingDocs.push('Report Card');
      if (!requiredDocuments.idPicture.filePath) missingDocs.push('ID Picture');

      if (missingDocs.length > 0) {
        deleteUploadedFiles(req.files);
        return res.status(400).json({ 
          message: `Missing required documents: ${missingDocs.join(', ')}`
        });
      }

      // Update enrollment with documents and change status
      const enrollment = await Enrollment.findByIdAndUpdate(
        enrollmentId,
        {
          $set: {
            requiredDocuments,
            status: 'pending',
            statusRegistration: 'complete'
          }
        },
        { new: true }
      );

      if (!enrollment) {
        deleteUploadedFiles(req.files);
        return res.status(404).json({ message: "Enrollment not found" });
      }

      return res.status(200).json({
        success: true,
        message: "Enrollment submitted successfully! Please wait for approval."
      });
    }


    // If no valid step provided
    return res.status(400).json({ message: "Invalid step provided" });
  } catch (error) {
    // Delete uploaded files if error occurs in Step 3
    if (req.body.step === "step3") {
      deleteUploadedFiles(req.files);
    }
    
    console.error('Enrollment error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error processing enrollment"
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
