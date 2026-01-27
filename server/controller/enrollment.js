import Enrollment from "../model/enrollment.js";
import multer from "multer";
import fs from "fs";
import path from "path";
import Student from "../model/student.js";
import Staff from "../model/staff.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import { error } from "console";
import { Resend } from 'resend';
import cloudinary from "../config/cloudinary.js";





const uploadToCloudinary = (fileBuffer, originalname, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
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




const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`Deleted from Cloudinary: ${publicId}`);
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
  }
};



const resend = new Resend(process.env.RESEND_API_KEY);




export const deleteApplicant = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Find enrollment first to get publicIds
    const enrollment = await Enrollment.findById(id);
    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }
    
    // Delete files from Cloudinary
    const docs = enrollment.requiredDocuments;
    if (docs) {
      await deleteFromCloudinary(docs.psaBirthCert?.publicId);
      await deleteFromCloudinary(docs.reportCard?.publicId);
      await deleteFromCloudinary(docs.goodMoral?.publicId);
      await deleteFromCloudinary(docs.idPicture?.publicId);
    }
    
    // Delete from database
    await Enrollment.deleteOne({ _id: id });
    
    res.status(200).json({ message: "Successfully deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}





//resend api emails
const sendRejectionEmail = async (email, studentName, reason) => {
    try {
        const emailTemplate = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #f4f4f4;
                    }
                    .email-container {
                        background-color: white;
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
                        color: white;
                        padding: 40px 20px;
                        text-align: center;
                        position: relative;
                    }
                    .logo-wrapper {
                        display: inline-block;
                        width: 100px;
                        height: 100px;
                        background-color: white;
                        border-radius: 50%;
                        padding: 15px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                        margin-bottom: 20px;
                    }
                    .header-image {
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                        border-radius: 50%;
                    }
                    .header h2 {
                        margin: 0;
                        padding: 0;
                        font-size: 24px;
                        font-weight: 600;
                    }
                    .content {
                        background-color: #ffffff;
                        padding: 40px 30px;
                    }
                    .greeting {
                        font-size: 16px;
                        margin-bottom: 20px;
                    }
                    .info-box {
                        background-color: #fff5f5;
                        padding: 20px;
                        margin: 25px 0;
                        border-left: 4px solid #dc3545;
                        border-radius: 4px;
                        box-shadow: 0 2px 4px rgba(220,53,69,0.1);
                    }
                    .label {
                        font-weight: bold;
                        color: #dc3545;
                        text-transform: uppercase;
                        font-size: 12px;
                        margin-bottom: 10px;
                        letter-spacing: 0.5px;
                    }
                    .value {
                        font-size: 15px;
                        color: #333;
                        line-height: 1.8;
                        white-space: pre-line;
                    }
                    .message {
                        background-color: #fff3cd;
                        border: 1px solid #ffc107;
                        border-radius: 5px;
                        padding: 20px;
                        margin: 25px 0;
                    }
                    .message p {
                        margin: 8px 0;
                        color: #856404;
                        line-height: 1.6;
                    }
                    .message strong {
                        color: #664d03;
                    }
                    .contact-info {
                        margin-top: 30px;
                        padding: 20px;
                        background-color: #f8f9fa;
                        border-radius: 5px;
                    }
                    .footer {
                        text-align: center;
                        padding: 25px 30px;
                        background-color: #f8f9fa;
                        border-top: 1px solid #dee2e6;
                        font-size: 12px;
                        color: #6c757d;
                    }
                    .footer p {
                        margin: 5px 0;
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <div class="logo-wrapper">
                            <img src="${process.env.CLOUDINARY_STATIC_IMAGE}" 
                                 alt="School Logo" 
                                 class="header-image">
                        </div>
                        <h2>Fransisco Osorio Integrated Senior High School</h2>
                    </div>
                    
                    <div class="content">
                        <div class="greeting">
                            <p>Dear <strong>${studentName}</strong>,</p>
                        </div>
                        
                        <p>We regret to inform you that your enrollment application has not been approved at this time.</p>
                        
                        <div class="info-box">
                            <div class="label">Reason for Rejection</div>
                            <div class="value">${reason}</div>
                        </div>
                        
                        <div class="message">
                            <p><strong>Important Information:</strong></p>
                            <p>• You may reapply in the next enrollment period.</p>
                            <p>• For questions, please contact the school registrar.</p>
                            <p>• Address the concerns mentioned above before reapplying.</p>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>This is an automated message. Please do not reply to this email.</p>
                        <p>&copy; ${new Date().getFullYear()} School Management System. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const { data, error } = await resend.emails.send({
            from: `School Admissions <noreply${process.env.EMAIL_DOMAIN}>`, // Palitan ng actual domain mo
            to: email,
            subject: 'Enrollment Application - Status Update',
            html: emailTemplate,
        });

        if (error) {
            console.error("Rejection email sending failed:", error);
            return { success: false, error };
        }

        return { success: true, data };
        
    } catch (error) {
        console.error("Rejection email sending failed:", error.message);
        return { success: false, error: error.message };
    }
};

// const sendRejectionEmail = async (email, studentName, reason) => {
//     try {
//         const transporter = nodemailer.createTransport({
//             service: "gmail",
//             auth: {
//                 user: process.env.EMAIL_USER,
//                 pass: process.env.EMAIL_PASSWORD
//             }
//         });

//         const emailTemplate = `
//             <!DOCTYPE html>
//             <html>
//             <head>
//                 <style>
//                     body {
//                         font-family: Arial, sans-serif;
//                         line-height: 1.6;
//                         color: #333;
//                         max-width: 600px;
//                         margin: 0 auto;
//                         padding: 20px;
//                         background-color: #f4f4f4;
//                     }
//                     .email-container {
//                         background-color: white;
//                         border-radius: 8px;
//                         overflow: hidden;
//                         box-shadow: 0 4px 6px rgba(0,0,0,0.1);
//                     }
//                     .header {
//                         background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
//                         color: white;
//                         padding: 40px 20px;
//                         text-align: center;
//                         position: relative;
//                     }
//                     .logo-wrapper {
//                         display: inline-block;
//                         width: 100px;
//                         height: 100px;
//                         background-color: white;
//                         border-radius: 50%;
//                         padding: 15px;
//                         box-shadow: 0 4px 12px rgba(0,0,0,0.2);
//                         margin-bottom: 20px;
//                     }
//                     .header-image {
//                         width: 100%;
//                         height: 100%;
//                         object-fit: contain;
//                         border-radius: 50%;
//                     }
//                     .header h1 {
//                         margin: 0;
//                         padding: 0;
//                         font-size: 24px;
//                         font-weight: 600;
//                     }
//                     .content {
//                         background-color: #ffffff;
//                         padding: 40px 30px;
//                     }
//                     .greeting {
//                         font-size: 16px;
//                         margin-bottom: 20px;
//                     }
//                     .info-box {
//                         background-color: #fff5f5;
//                         padding: 20px;
//                         margin: 25px 0;
//                         border-left: 4px solid #dc3545;
//                         border-radius: 4px;
//                         box-shadow: 0 2px 4px rgba(220,53,69,0.1);
//                     }
//                     .label {
//                         font-weight: bold;
//                         color: #dc3545;
//                         text-transform: uppercase;
//                         font-size: 12px;
//                         margin-bottom: 10px;
//                         letter-spacing: 0.5px;
//                     }
//                     .value {
//                         font-size: 15px;
//                         color: #333;
//                         line-height: 1.8;
//                         white-space: pre-line;
//                     }
//                     .message {
//                         background-color: #fff3cd;
//                         border: 1px solid #ffc107;
//                         border-radius: 5px;
//                         padding: 20px;
//                         margin: 25px 0;
//                     }
//                     .message p {
//                         margin: 8px 0;
//                         color: #856404;
//                         line-height: 1.6;
//                     }
//                     .message strong {
//                         color: #664d03;
//                     }
//                     .contact-info {
//                         margin-top: 30px;
//                         padding: 20px;
//                         background-color: #f8f9fa;
//                         border-radius: 5px;
//                     }
//                     .footer {
//                         text-align: center;
//                         padding: 25px 30px;
//                         background-color: #f8f9fa;
//                         border-top: 1px solid #dee2e6;
//                         font-size: 12px;
//                         color: #6c757d;
//                     }
//                     .footer p {
//                         margin: 5px 0;
//                     }
//                 </style>
//             </head>
//             <body>
//                 <div class="email-container">
//                     <div class="header">
//                         <div class="logo-wrapper">
//                             <img src="${process.env.CLOUDINARY_STATIC_IMAGE}" 
//                                  alt="School Logo" 
//                                  class="header-image">
//                         </div>
//                         <h2>Fransisco Osorio Integrated Senior High School</h2>
//                     </div>
                    
//                     <div class="content">
//                         <div class="greeting">
//                             <p>Dear <strong>${studentName}</strong>,</p>
//                         </div>
                        
//                         <p>We regret to inform you that your enrollment application has not been approved at this time.</p>
                        
//                         <div class="info-box">
//                             <div class="label">Reason for Rejection</div>
//                             <div class="value">${reason}</div>
//                         </div>
                        
//                         <div class="message">
//                             <p><strong>Important Information:</strong></p>
//                             <p>• You may reapply in the next enrollment period.</p>
//                             <p>• For questions, please contact the school registrar.</p>
//                             <p>• Address the concerns mentioned above before reapplying.</p>
//                         </div>
//                     </div>
                    
//                     <div class="footer">
//                         <p>This is an automated message. Please do not reply to this email.</p>
//                         <p>&copy; ${new Date().getFullYear()} School Management System. All rights reserved.</p>
//                     </div>
//                 </div>
//             </body>
//             </html>
//         `;

//         const mailOptions = {
//             from: `"School Admissions" <${process.env.EMAIL_USER}>`,
//             to: email,
//             subject: 'Enrollment Application - Status Update',
//             html: emailTemplate
//         };

//         await transporter.sendMail(mailOptions);
//         return { success: true };
        
//     } catch (error) {
//         console.error("Rejection email sending failed:", error.message);
//         return { success: false, error: error.message };
//     }
// };





export const rejectApplicant = async (req, res) => {
  try {
    const enrollmentId = req.params.id;
    const { email, reason } = req.body;

    // ✅ Validate inputs
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    if (!email || email.trim() === '') {
      return res.status(400).json({ message: "Email is required" });
    }

    // ✅ Find the applicant first to get student name
    const applicant = await Enrollment.findById(enrollmentId);
    
    if (!applicant) {
      return res.status(404).json({ message: "Applicant not found" });
    }

    // ✅ Update enrollment status to rejected
    await Enrollment.findByIdAndUpdate(
      enrollmentId,
      { 
        $set: { 
          status: "rejected",
          rejectionReason: reason,
          rejectedAt: new Date()
        }
      }, 
      { new: true }
    );


    // ✅ Get student full name
    const studentName = `${applicant.learnerInfo.firstName} ${applicant.learnerInfo.lastName}`;

    // ✅ Send rejection email (don't wait for it, just fire and forget)
    sendRejectionEmail(email, studentName, reason)
      .then(result => {
        if (result.success) {
          console.log(`✅ Rejection email sent to ${email}`);
        } else {
          console.error(`❌ Failed to send rejection email: ${result.error}`);
        }
      })
      .catch(err => console.error("Email sending error:", err));

    res.status(200).json({ 
      message: "Applicant rejected successfully. Notification email has been sent." 
    });
    
  } catch (error) {
    console.error("Reject applicant error:", error);
    res.status(500).json({ message: error.message });
  }
};







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




// Multer storage configuration
const storage = multer.memoryStorage();


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



export const uploadDocuments = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max per file
  }
});



// Upload fields configuration
export const enrollmentUpload = uploadDocuments.fields([
  { name: 'psaBirthCertFile', maxCount: 1 },
  { name: 'reportCardFile', maxCount: 1 },
  { name: 'goodMoralFile', maxCount: 1 },
  { name: 'idPictureFile', maxCount: 1 },
]);




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

        if (!/^\d{12}$/.test(learnerInfo.fourPs.householdId)) {
          return res.status(400).json({ 
              message: '4Ps Household ID must be exactly 12 digits' 
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
          "learnerInfo.email": learnerInfo.email,
          _id: { $ne: enrollmentId } 
        });

        const existingEmailStudent = await Student.findOne({ email: learnerInfo.email });
        const existingEmailStaff = await Staff.findOne({ email: learnerInfo.email });

        if (existingEmailEnrollment || existingEmailStudent || existingEmailStaff) {
          return res.status(409).json({ message: "Email already exists." });
        }
      }


      if (learnerInfo.lrn) {
        const existingLRN = await Enrollment.findOne({
          "learnerInfo.lrn": learnerInfo.lrn,
          _id: { $ne: enrollmentId } 
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


      
      // ✅ Prepare data object
      const enrollmentData = {
        schoolYear: autoSchoolYear,
        gradeLevelToEnroll: req.body.gradeLevelToEnroll,
        withLRN: req.body.withLRN === 'Yes',
        isReturning: req.body.isReturning === 'Yes',
        
        learnerInfo: {
          email: learnerInfo.email,
          lrn: lrn,
          psaNo: psaNo,
          lastName: learnerInfo.lastName,
          firstName: learnerInfo.firstName,
          middleName: learnerInfo.middleName,
          extensionName: extensionName,
          birthDate: learnerInfo.birthDate,
          age: learnerInfo.age,
          sex: learnerInfo.sex,
          placeOfBirth: learnerInfo.placeOfBirth,
          motherTongue: learnerInfo.motherTongue,
          
          learnerWithDisability: {
              isDisabled: learnerInfo.learnerWithDisability?.isDisabled === 'Yes',
              disabilityType: learnerInfo.learnerWithDisability?.disabilityType || []
          },
          
          indigenousCommunity: {
              isMember: learnerInfo.indigenousCommunity?.isMember === 'Yes',
              name: learnerInfo.indigenousCommunity?.name || ''
          },
          
          fourPs: {
              isBeneficiary: learnerInfo.fourPs?.isBeneficiary === 'Yes',
              householdId: learnerInfo.fourPs?.householdId || ''
          },
        },

        statusRegistration: "incomplete"
      };


      //udpate existing step1 record
      if(enrollmentId){

        const enrollment = await Enrollment.findByIdAndUpdate(
          enrollmentId,
          enrollmentData,
          { new: true, runValidators: true }
        );

        if (!enrollment) {
          return res.status(404).json({ message: "Enrollment record not found" });
        }

        return res.status(200).json({
          success: true,
          message: "Step 1 updated successfully",
          enrollmentId: enrollment._id,
          step1: true,
        });
      } 

      // Create new enrollment record
      const enrollment = await Enrollment.create(enrollmentData);
      
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
              return res.status(400).json({ 
                message: `${fieldName}: Only JPG and PNG files are allowed!`
              });
            }
          }
        }
      }

      // ✅ UPLOAD TO CLOUDINARY
      const requiredDocuments = {};

      // Upload PSA Birth Certificate
      if (req.files['psaBirthCertFile']?.[0]) {
        const result = await uploadToCloudinary(
          req.files['psaBirthCertFile'][0].buffer,
          req.files['psaBirthCertFile'][0].originalname,
          'enrollments/documents'
        );
        requiredDocuments.psaBirthCert = {
          filePath: result.secure_url,
          publicId: result.public_id,
          uploadedAt: new Date()
        };
      }

      // Upload Report Card
      if (req.files['reportCardFile']?.[0]) {
        const result = await uploadToCloudinary(
          req.files['reportCardFile'][0].buffer,
          req.files['reportCardFile'][0].originalname,
          'enrollments/documents'
        );
        requiredDocuments.reportCard = {
          filePath: result.secure_url,
          publicId: result.public_id,
          uploadedAt: new Date()
        };
      }

      // Upload Good Moral (optional)
      if (req.files['goodMoralFile']?.[0]) {
        const result = await uploadToCloudinary(
          req.files['goodMoralFile'][0].buffer,
          req.files['goodMoralFile'][0].originalname,
          'enrollments/documents'
        );
        requiredDocuments.goodMoral = {
          filePath: result.secure_url,
          publicId: result.public_id,
          uploadedAt: new Date()
        };
      }

      // Upload ID Picture
      if (req.files['idPictureFile']?.[0]) {
        const result = await uploadToCloudinary(
          req.files['idPictureFile'][0].buffer,
          req.files['idPictureFile'][0].originalname,
          'enrollments/documents'
        );
        requiredDocuments.idPicture = {
          filePath: result.secure_url,
          publicId: result.public_id,
          uploadedAt: new Date()
        };
      }

      // Validate required documents (3 required, goodMoral optional)
      const missingDocs = [];
      if (!requiredDocuments.psaBirthCert) missingDocs.push('PSA Birth Certificate');
      if (!requiredDocuments.reportCard) missingDocs.push('Report Card');
      if (!requiredDocuments.idPicture) missingDocs.push('ID Picture');

      if (missingDocs.length > 0) {
        // ✅ DELETE from Cloudinary if validation fails
        if (requiredDocuments.psaBirthCert?.publicId) 
          await deleteFromCloudinary(requiredDocuments.psaBirthCert.publicId);
        if (requiredDocuments.reportCard?.publicId) 
          await deleteFromCloudinary(requiredDocuments.reportCard.publicId);
        if (requiredDocuments.goodMoral?.publicId) 
          await deleteFromCloudinary(requiredDocuments.goodMoral.publicId);
        if (requiredDocuments.idPicture?.publicId) 
          await deleteFromCloudinary(requiredDocuments.idPicture.publicId);
          
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


      return res.status(200).json({
        success: true,
        message: "Enrollment submitted successfully! Please wait for approval."
      });
    }



    // If no valid step provided
    return res.status(400).json({ message: "Invalid step provided" });
  } catch (error) {

    console.error('Enrollment error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error processing enrollment"
    });
    }
};




//resend email approve applicants
const sendStudentAccount = async (email, studentNo, password, studentName) => {
    
    try {
        const emailTemplate = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #f4f4f4;
                    }
                    .email-container {
                        background-color: white;
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
                        color: white;
                        padding: 40px 20px;
                        text-align: center;
                        position: relative;
                    }
                    .logo-wrapper {
                        display: inline-block;
                        width: 100px;
                        height: 100px;
                        background-color: white;
                        border-radius: 50%;
                        padding: 15px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                        margin-bottom: 20px;
                    }
                    .header-image {
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                        border-radius: 50%;
                    }
                    .header h2 {
                        margin: 0;
                        padding: 0;
                        font-size: 24px;
                        font-weight: 600;
                    }
                    .content {
                        background-color: #ffffff;
                        padding: 40px 30px;
                    }
                    .greeting {
                        font-size: 16px;
                        margin-bottom: 20px;
                    }
                    .congratulations {
                        background-color: #d4edda;
                        padding: 20px;
                        border-radius: 8px;
                        text-align: center;
                        margin: 25px 0;
                        border: 2px solid #28a745;
                    }
                    .congratulations h2 {
                        color: #155724;
                        margin: 0 0 10px 0;
                        font-size: 22px;
                    }
                    .congratulations p {
                        color: #155724;
                        margin: 5px 0;
                        font-size: 15px;
                    }
                    .info-box {
                        background-color: #fff5f5;
                        padding: 20px;
                        margin: 25px 0;
                        border-left: 4px solid #dc3545;
                        border-radius: 4px;
                        box-shadow: 0 2px 4px rgba(220,53,69,0.1);
                    }
                    .credential-item {
                        margin: 15px 0;
                        padding: 15px;
                        background-color: white;
                        border-radius: 6px;
                        border: 1px solid #dee2e6;
                    }
                    .label {
                        font-weight: bold;
                        color: #dc3545;
                        text-transform: uppercase;
                        font-size: 12px;
                        margin-bottom: 10px;
                        letter-spacing: 0.5px;
                        display: block;
                    }
                    .value {
                        font-size: 18px;
                        color: #333;
                        font-weight: 600;
                        font-family: 'Courier New', monospace;
                        background-color: #e9ecef;
                        padding: 10px 15px;
                        border-radius: 4px;
                        display: inline-block;
                        margin-top: 5px;
                    }
                    .message {
                        background-color: #fff3cd;
                        border: 1px solid #ffc107;
                        border-radius: 5px;
                        padding: 20px;
                        margin: 25px 0;
                    }
                    .message p {
                        margin: 8px 0;
                        color: #856404;
                        line-height: 1.6;
                    }
                    .message strong {
                        color: #664d03;
                    }
                    .contact-info {
                        margin-top: 30px;
                        padding: 20px;
                        background-color: #f8f9fa;
                        border-radius: 5px;
                    }
                    .footer {
                        text-align: center;
                        padding: 25px 30px;
                        background-color: #f8f9fa;
                        border-top: 1px solid #dee2e6;
                        font-size: 12px;
                        color: #6c757d;
                    }
                    .footer p {
                        margin: 5px 0;
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <div class="logo-wrapper">
                            <img src="${process.env.CLOUDINARY_STATIC_IMAGE}" 
                                 alt="School Logo" 
                                 class="header-image">
                        </div>
                        <h2>Fransisco Osorio Integrated Senior High School</h2>
                    </div>
                    
                    <div class="content">
                        <div class="greeting">
                            <p>Dear <strong>${studentName}</strong>,</p>
                        </div>
                        
                        <div class="congratulations">
                            <h2>Congratulations!</h2>
                            <p>Your enrollment application has been <strong>approved</strong>.</p>
                            <p>Welcome to our school community!</p>
                        </div>
                        
                        <p>We are pleased to inform you that you have been successfully enrolled. Below are your student account credentials:</p>
                        
                        <div class="info-box">
                            <div class="credential-item">
                                <span class="label">Student Number</span>
                                <div class="value">${studentNo}</div>
                            </div>
                            <div class="credential-item">
                                <span class="label">Temporary Password</span>
                                <div class="value">${password}</div>
                            </div>
                        </div>
                        
                        <div class="message">
                            <p><strong>Important Security Notice:</strong></p>
                            <p>• Please change your password upon first login.</p>
                            <p>• Do not share your credentials with anyone.</p>
                            <p>• Keep this email for your records.</p>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>This is an automated message. Please do not reply to this email.</p>
                        <p>&copy; ${new Date().getFullYear()} School Management System. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const { data, error } = await resend.emails.send({
            from: `School Admissions <noreply${process.env.EMAIL_DOMAIN}>`, 
            to: email,
            subject: 'Enrollment Application Approved - Welcome!',
            html: emailTemplate,
        });

        if (error) {
            console.error("Email sending failed:", error);
            return { success: false, error };
        }

        return { success: true, data };
        
    } catch (error) {
        console.error("Email sending failed:", error.message);
        return { success: false, error: error.message };
    }
}

// const sendStudentAccount = async (email, studentNo, password, studentName) => {
    
//     try {
//         const transporter = nodemailer.createTransport({
//             service: "gmail",
//             auth: {
//                 user: process.env.EMAIL_USER,
//                 pass: process.env.EMAIL_PASSWORD
//             }
//         })

//         const emailTemplate = `
//             <!DOCTYPE html>
//             <html>
//             <head>
//                 <style>
//                     body {
//                         font-family: Arial, sans-serif;
//                         line-height: 1.6;
//                         color: #333;
//                         max-width: 600px;
//                         margin: 0 auto;
//                         padding: 20px;
//                         background-color: #f4f4f4;
//                     }
//                     .email-container {
//                         background-color: white;
//                         border-radius: 8px;
//                         overflow: hidden;
//                         box-shadow: 0 4px 6px rgba(0,0,0,0.1);
//                     }
//                     .header {
//                         background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
//                         color: white;
//                         padding: 40px 20px;
//                         text-align: center;
//                         position: relative;
//                     }
//                     .logo-wrapper {
//                         display: inline-block;
//                         width: 100px;
//                         height: 100px;
//                         background-color: white;
//                         border-radius: 50%;
//                         padding: 15px;
//                         box-shadow: 0 4px 12px rgba(0,0,0,0.2);
//                         margin-bottom: 20px;
//                     }
//                     .header-image {
//                         width: 100%;
//                         height: 100%;
//                         object-fit: contain;
//                         border-radius: 50%;
//                     }
//                     .header h2 {
//                         margin: 0;
//                         padding: 0;
//                         font-size: 24px;
//                         font-weight: 600;
//                     }
//                     .content {
//                         background-color: #ffffff;
//                         padding: 40px 30px;
//                     }
//                     .greeting {
//                         font-size: 16px;
//                         margin-bottom: 20px;
//                     }
//                     .congratulations {
//                         background-color: #d4edda;
//                         padding: 20px;
//                         border-radius: 8px;
//                         text-align: center;
//                         margin: 25px 0;
//                         border: 2px solid #28a745;
//                     }
//                     .congratulations h2 {
//                         color: #155724;
//                         margin: 0 0 10px 0;
//                         font-size: 22px;
//                     }
//                     .congratulations p {
//                         color: #155724;
//                         margin: 5px 0;
//                         font-size: 15px;
//                     }
//                     .info-box {
//                         background-color: #fff5f5;
//                         padding: 20px;
//                         margin: 25px 0;
//                         border-left: 4px solid #dc3545;
//                         border-radius: 4px;
//                         box-shadow: 0 2px 4px rgba(220,53,69,0.1);
//                     }
//                     .credential-item {
//                         margin: 15px 0;
//                         padding: 15px;
//                         background-color: white;
//                         border-radius: 6px;
//                         border: 1px solid #dee2e6;
//                     }
//                     .label {
//                         font-weight: bold;
//                         color: #dc3545;
//                         text-transform: uppercase;
//                         font-size: 12px;
//                         margin-bottom: 10px;
//                         letter-spacing: 0.5px;
//                         display: block;
//                     }
//                     .value {
//                         font-size: 18px;
//                         color: #333;
//                         font-weight: 600;
//                         font-family: 'Courier New', monospace;
//                         background-color: #e9ecef;
//                         padding: 10px 15px;
//                         border-radius: 4px;
//                         display: inline-block;
//                         margin-top: 5px;
//                     }
//                     .message {
//                         background-color: #fff3cd;
//                         border: 1px solid #ffc107;
//                         border-radius: 5px;
//                         padding: 20px;
//                         margin: 25px 0;
//                     }
//                     .message p {
//                         margin: 8px 0;
//                         color: #856404;
//                         line-height: 1.6;
//                     }
//                     .message strong {
//                         color: #664d03;
//                     }
//                     .contact-info {
//                         margin-top: 30px;
//                         padding: 20px;
//                         background-color: #f8f9fa;
//                         border-radius: 5px;
//                     }
//                     .footer {
//                         text-align: center;
//                         padding: 25px 30px;
//                         background-color: #f8f9fa;
//                         border-top: 1px solid #dee2e6;
//                         font-size: 12px;
//                         color: #6c757d;
//                     }
//                     .footer p {
//                         margin: 5px 0;
//                     }
//                 </style>
//             </head>
//             <body>
//                 <div class="email-container">
//                     <div class="header">
//                         <div class="logo-wrapper">
//                             <img src="${process.env.CLOUDINARY_STATIC_IMAGE}" 
//                                  alt="School Logo" 
//                                  class="header-image">
//                         </div>
//                         <h2>Fransisco Osorio Integrated Senior High School</h2>
//                     </div>
                    
//                     <div class="content">
//                         <div class="greeting">
//                             <p>Dear <strong>${studentName}</strong>,</p>
//                         </div>
                        
//                         <div class="congratulations">
//                             <h2>Congratulations!</h2>
//                             <p>Your enrollment application has been <strong>approved</strong>.</p>
//                             <p>Welcome to our school community!</p>
//                         </div>
                        
//                         <p>We are pleased to inform you that you have been successfully enrolled. Below are your student account credentials:</p>
                        
//                         <div class="info-box">
//                             <div class="credential-item">
//                                 <span class="label">Student Number</span>
//                                 <div class="value">${studentNo}</div>
//                             </div>
//                             <div class="credential-item">
//                                 <span class="label">Temporary Password</span>
//                                 <div class="value">${password}</div>
//                             </div>
//                         </div>
                        
//                         <div class="message">
//                             <p><strong>Important Security Notice:</strong></p>
//                             <p>• Please change your password upon first login.</p>
//                             <p>• Do not share your credentials with anyone.</p>
//                             <p>• Keep this email for your records.</p>
//                         </div>
//                     </div>
                    
//                     <div class="footer">
//                         <p>This is an automated message. Please do not reply to this email.</p>
//                         <p>&copy; ${new Date().getFullYear()} School Management System. All rights reserved.</p>
//                     </div>
//                 </div>
//             </body>
//             </html>
//         `;

//         const mailOptions = {
//             from: `"School Admissions" <${process.env.EMAIL_USER}>`,
//             to: email,
//             subject: 'Enrollment Application Approved - Welcome!',
//             html: emailTemplate
//         };

//         await transporter.sendMail(mailOptions);  
//         return { success: true }
        
//     } catch (error) {
//         console.error("Email sending failed:", error.message);
//         return { success: false };
//     }

// }



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


     // 4. CHECK DUPLICATE: LRN (✅ Only check if LRN is valid, not "N/A" or empty)
    const lrnValue = applicant.learnerInfo.lrn?.trim();
    const isValidLRN = lrnValue && 
                       lrnValue !== '' && 
                       lrnValue.toLowerCase() !== 'n/a' && 
                       lrnValue !== 'null' && 
                       lrnValue !== 'undefined';
    
    if (isValidLRN) {
      const existingLRN = await Student.findOne({ lrn: lrnValue });
      
      if (existingLRN) {
        return res.status(409).json({
          message: "LRN already exists for another student."
        });
      }
    }

    console.log(isValidLRN);
    



    
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
