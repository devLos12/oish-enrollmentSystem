import Enrollment from "../model/enrollment.js";
import multer from "multer";
import path from "path";
import Student from "../model/student.js";
import Staff from "../model/staff.js";
import bcrypt from "bcrypt";
import { Resend } from 'resend';
import cloudinary from "../config/cloudinary.js";
import Admin from "../model/admin.js";
import SchoolYear from "../model/schoolYear.js";
import Program from "../model/program.js";
import crypto from "crypto";

import { createLogs } from "./logs.js";



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



export const getAllEmails = async (req, res) => {
  try {
    
    const [enrollmentEmails, adminEmails, staffEmails] = await Promise.all([
      Enrollment.find().select('learnerInfo.email -_id'),
      Admin.find().select('email -_id'),
      Staff.find().select('email -_id'),
    ]);

    const emails = [
      ...enrollmentEmails,
      ...adminEmails.map(a => ({ learnerInfo: { email: a.email } })),
      ...staffEmails.map(s => ({ learnerInfo: { email: s.email } })),
    ];

    
    return res.status(200).json({ 
      success: true,
      emails
    });

  } catch(error) {
    return res.status(500).json({ message: error.message });
  }
}




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

    const { id: accountId, role } = req.account;
    const studentName = `${enrollment.learnerInfo?.firstName} ${enrollment.learnerInfo?.lastName}`;

    await createLogs(
      accountId,
      role,
      'REMOVE APPLICANT',
      `Removed applicant: ${studentName} (${enrollment.gradeLevelToEnroll})`,
      'Success'
    );
        

    res.status(200).json({ message: "Successfully deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}






// ✅ Dagdag lang ng updateLink parameter
const sendRejectionEmail = async (email, studentName, reason, updateLink) => {
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

                    /* ✅ BAGO — update button styles */
                    .update-box {
                        background-color: #f0f7ff;
                        border: 1px solid #b6d4fe;
                        border-radius: 6px;
                        padding: 24px;
                        margin: 25px 0;
                        text-align: center;
                    }
                    .update-btn {
                        display: inline-block;
                        background-color: #dc3545;
                        color: white !important;
                        padding: 12px 32px;
                        border-radius: 6px;
                        text-decoration: none;
                        font-weight: bold;
                        font-size: 15px;
                        margin-top: 10px;
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
                        <h2>Francisco Osorio Integrated Senior High School</h2>
                    </div>
                    
                    <div class="content">
                        <div class="greeting">
                            <p>Dear <strong>${studentName}</strong>,</p>
                        </div>
                        
                        <p>We regret to inform you that your enrollment application has not been approved at this time.</p>
                        
                        <!-- Existing rejection reason — hindi binago -->
                        <div class="info-box">
                            <div class="label">Reason for Rejection</div>
                            <div class="value">${reason}</div>
                        </div>

                        <!-- ✅ BAGO — update link section -->
                        <div class="update-box">
                            <p style="margin: 0 0 8px; font-weight: bold; color: #0d6efd;">
                                Want to correct and resubmit your application?
                            </p>
                            <p style="margin: 0 0 16px; font-size: 13px; color: #555;">
                                Click the button below to update your enrollment form.<br/>
                                <strong>This link is valid for 1 hour only.</strong>
                            </p>
                            <a href="${updateLink}" class="update-btn">
                                Update My Enrollment Form
                            </a>
                            <p style="margin: 16px 0 0; font-size: 11px; color: #999; word-break: break-all;">
                                Or copy this link:<br/>${updateLink}
                            </p>
                        </div>
                        
                        <!-- Existing message — hindi binago -->
                        <div class="message">
                            <p><strong>Important Information:</strong></p>
                            <p>• Address the concerns mentioned above before resubmitting.</p>
                            <p>• The update link expires in <strong>1 hour</strong>.</p>
                            <p>• For questions, please contact the school registrar.</p>
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
            subject: 'Enrollment Application - Action Required', // ✅ Updated subject
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


    const updateToken = crypto.randomBytes(32).toString('hex');
    const updateTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);


    //✅ Update enrollment status to rejected
    await Enrollment.findByIdAndUpdate(
      enrollmentId,
      { 
        $set: { 
          status: "rejected",
          rejectionReason: reason,
          rejectedAt: new Date(),
          updateToken,
          updateTokenExpiry
        }
      }, 
      { new: true }
    );
    


    // ✅ Get student full name
    const studentName = `${applicant.learnerInfo.firstName} ${applicant.learnerInfo.lastName}`;
    const updateLink = `${req.headers['origin']}/enrollment/update?token=${updateToken}`;

    
    const { id: accountId, role } = req.account;
    await createLogs(
      accountId,
      role,
      'REJECT APPLICANT',
      `Rejected applicant: ${studentName} — Reason: ${reason}`,
      'Success'
    );


    //Send rejection email (don't wait for it, just fire and forget)
    sendRejectionEmail(email, studentName, reason, updateLink)
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
    const { schoolYearId } = req.query;

    let targetSchoolYear;

    if (schoolYearId) {
      targetSchoolYear = await SchoolYear.findById(schoolYearId);
      if (!targetSchoolYear) {
        return res.status(404).json({ success: false, data: [], message: "School year not found." });
      }
    } else {
      targetSchoolYear = await SchoolYear.findOne({ isActive: true });
      if (!targetSchoolYear) {
        return res.status(400).json({ success: false, data: [], message: "No active school year." });
      }
    }
    
    // ✅ IMPROVED: Fetch only from ACTIVE school year (works for 1st & 2nd sem - same schoolYearId)
    const applicants = await Enrollment.find({ 
      statusRegistration: "complete",
      schoolYear: targetSchoolYear.schoolYear,
      'seniorHigh.semester': targetSchoolYear.semester 
    });
    
    
    return res.status(200).json({
      success: true,
      data: applicants || [],
      currentSchoolYear: targetSchoolYear.label,
      total: applicants?.length || 0,
      message: applicants?.length === 0 ? "No applicants available" : "Success"
    });
  } catch (error) {
    console.error("GetAllEnrollments error:", error);
    return res.status(500).json({ 
      success: false, 
      data: [],
      message: error.message || "Error fetching applicants" 
    });
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



const normalizeName = (value) => {
    if (!value || value === 'N/A') return value;
    return value.trim().toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};


const normalizeParent = (parent) => {
    if (!parent) return parent;
    return {
        ...parent,
        lastName: normalizeName(parent.lastName),
        firstName: normalizeName(parent.firstName),
        middleName: normalizeName(parent.middleName),
    };
};



export const EnrollmentRegistration = async (req, res) => {
  try {
    const { step, enrollmentId } = req.body; // step: "step1" | "step2" | "step3"


    // ==========================================
    // STEP 1: CREATE NEW ENROLLMENT
    // ==========================================
    if (step === "step1") {
      const learnerInfo = JSON.parse(req.body.learnerInfo || '{}');

      // ✅ VALIDATION: LRN must be exactly 12 digits if provided
      if (learnerInfo.lrn && learnerInfo.lrn !== 'N/A') {

          if (!/^\d{12}$/.test(learnerInfo.lrn)) {
              return res.status(400).json({ message: 'LRN must be exactly 12 digits' });
          }
      }

      
      // ✅ VALIDATION: Extension Name (if provided)  <-- DITO ILAGAY
      const validExtensionNames = ['', 'jr.', 'Jr.', 'Sr.', 'II', 'III'];
      const extensionNameInput = learnerInfo.extensionName?.trim() || '';

      if (extensionNameInput && extensionNameInput !== 'N/A' && !validExtensionNames.includes(extensionNameInput)) {
          return res.status(400).json({ 
              message: 'Invalid extension name. Accepted values: jr. Jr., Sr., II, III' 
          });
      }

      

      // ✅ VALIDATION: Check required fields
      const requiredFields = [
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
        { field: 'lrn', message: 'LRN is required' },
        { field: 'lastName', message: 'Last Name is required' },
        { field: 'firstName', message: 'First Name is required' },
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

      const existingApplicant = await Enrollment.findOne({
        "learnerInfo.firstName": normalizeName(learnerInfo.firstName),
        "learnerInfo.birthDate": learnerInfo.birthDate,
        _id: { $ne: enrollmentId }
      });

      if (existingApplicant) {
        return res.status(409).json({ 
          message: "An applicant with the same name and birth date already exists." 
        });
      }


      const existingFullName = await Enrollment.findOne({
        "learnerInfo.firstName": normalizeName(learnerInfo.firstName),
        "learnerInfo.lastName": normalizeName(learnerInfo.lastName),
        "learnerInfo.middleName": normalizeName(learnerInfo.middleName?.trim() || 'N/A'),
        _id: { $ne: enrollmentId }
      });

      if (existingFullName) {
        return res.status(409).json({ 
          message: "Full name already exists." 
        });
      }


      const existingFullName2 = await Enrollment.findOne({
        "learnerInfo.firstName": normalizeName(learnerInfo.firstName),
        "learnerInfo.lastName": normalizeName(learnerInfo.lastName),
        _id: { $ne: enrollmentId }
      });

      if (existingFullName2) {
        return res.status(409).json({ 
          message: "Full name already exists." 
        });
      }



      const existingStaffName = await Staff.findOne({
        firstName: normalizeName(learnerInfo.firstName),
        lastName: normalizeName(learnerInfo.lastName),
        middleName: normalizeName(learnerInfo.middleName?.trim() || 'N/A'),
      });

      if (existingStaffName) {
        return res.status(409).json({ 
          message: "Full name already exists." 
        });
      }


      const existingStaffName2 = await Staff.findOne({
        firstName: normalizeName(learnerInfo.firstName),
        lastName: normalizeName(learnerInfo.lastName),
      });

      if (existingStaffName2) {
        return res.status(409).json({ 
          message: "Full name already exists." 
        });
      }

      






      const activeSchoolYear = await SchoolYear.findOne({ isCurrent: true });

      if (!activeSchoolYear) {
        return res.status(400).json({ 
          message: "No active school year." 
        });
      }

      //  Handle optional fields - set to "N/A" if empty
      const extensionName = learnerInfo.extensionName?.trim() || 'N/A';
      const lrn = learnerInfo.lrn?.trim() || 'N/A';


      
      const isUpdateFlow = enrollmentId 
      ? await Enrollment.findOne({ 
        _id: enrollmentId,
        updateToken: { $ne: null } 
      })
      : null;

      
      // ✅ Prepare data object
      const enrollmentData = {
        schoolYear: activeSchoolYear.schoolYear,
        schoolYearId: activeSchoolYear._id,
        
        isReturning: req.body.isReturning === 'Yes',
        
        learnerInfo: {
          email: learnerInfo.email,
          lrn: lrn,
          lastName: normalizeName(learnerInfo.lastName),
          firstName: normalizeName(learnerInfo.firstName),
          middleName: normalizeName(learnerInfo.middleName?.trim() || 'N/A'),
          extensionName: extensionName,
          birthDate: learnerInfo.birthDate,
          age: learnerInfo.age,
          sex: learnerInfo.sex,

          placeOfBirth: normalizeName(learnerInfo.placeOfBirth),
          motherTongue: normalizeName(learnerInfo.motherTongue),
          

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
        ...(!isUpdateFlow && {
          statusRegistration: "incomplete",
          expiresAt: new Date(Date.now() + 60 * 60 * 1000)
        })
        
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
        { field: 'region', message: 'Current Address: Region is required' },
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

      // ✅ VALIDATION: Current Address Contact Number Format
      if (address.current?.contactNumber) {
        const cleanedNumber = address.current.contactNumber.replace(/\s/g, '');
        
        if (!/^\d{11}$/.test(cleanedNumber)) {
          return res.status(400).json({ 
            message: 'Current Address: Contact Number must be exactly 11 digits' 
          });
        }
        
        if (!cleanedNumber.startsWith('09')) {
          return res.status(400).json({ 
            message: 'Current Address: Contact Number must start with 09' 
          });
        }
      }


      // ✅ VALIDATION: Permanent Address (if NOT same as current)
      if (!address.permanent?.sameAsCurrent) {
        const requiredPermFields = [
          { field: 'street', message: 'Permanent Address: Street is required' },
          { field: 'region', message: 'Permanent Address: Region is required' }, 
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


      // ✅ VALIDATION: Parent/Guardian Contact Numbers (if provided)
      const parentsToValidate = ['father', 'mother', 'guardian'];

      for (const parentType of parentsToValidate) {
        const contactNumber = parentGuardianInfo[parentType]?.contactNumber;
        
        // Skip if empty (will be set to N/A later for optional fields)
        if (!contactNumber || contactNumber.trim() === '' || contactNumber.trim() === 'N/A') {
            continue;
        }
        
        const cleanedNumber = contactNumber.replace(/\s/g, '');
        
        if (!/^\d{11}$/.test(cleanedNumber)) {
          const parentName = parentType.charAt(0).toUpperCase() + parentType.slice(1);
          return res.status(400).json({ 
            message: `${parentName}: Contact Number must be exactly 11 digits` 
          });
        }
        
        if (!cleanedNumber.startsWith('09')) {
          const parentName = parentType.charAt(0).toUpperCase() + parentType.slice(1);
          return res.status(400).json({ 
            message: `${parentName}: Contact Number must start with 09` 
          });
        }
      }




      // ✅ VALIDATION: School History (ONLY if returningLearner is checked)
      if (schoolHistory.returningLearner) {
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
      // const requiredSeniorHighFields = [
      //   { field: 'semester', message: 'Semester is required' },
      //   { field: 'track', message: 'Track is required' },
      //   { field: 'strand', message: 'Strand is required' }
      // ];

      // for (const { field, message } of requiredSeniorHighFields) {
      //   if (!seniorHigh[field] || seniorHigh[field].trim() === '') {
      //     return res.status(400).json({ message });
      //   }
      // }

      const gradeLevelToEnroll = req.body.gradeLevelToEnroll;
      
      if (!gradeLevelToEnroll || !['Grade 11', 'Grade 12'].includes(gradeLevelToEnroll)) {
          return res.status(400).json({ message: 'Grade Level to Enroll is required' });
      }

      if (!seniorHigh.track || seniorHigh.track.trim() === '') {
          return res.status(400).json({ message: 'Track is required' });
      }
      if (!seniorHigh.strand || seniorHigh.strand.trim() === '') {
          return res.status(400).json({ message: 'Strand is required' });
      }


      const programExists = await Program.findOne({
          trackName: seniorHigh.track,
          isActive: true,
          strands: {
              $elemMatch: {
                  strandName: seniorHigh.strand,
                  isActive: true
              }
          }
      });



      if (!programExists) {
          return res.status(400).json({ 
              message: 'Invalid track or strand selected. Please select a valid option.' 
          });
      }

      

      // ✅ Set N/A for empty houseNo (ONCE only)
      if (!address.current.houseNo || address.current.houseNo.trim() === '') {
        address.current.houseNo = 'N/A';
      }

      if (!address.permanent?.sameAsCurrent) {
        if (!address.permanent.houseNo || address.permanent.houseNo.trim() === '') {
          address.permanent.houseNo = 'N/A';
        }
      }

      // ✅ Set N/A for Father's & Mother's empty fields
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



      const activeSchoolYear = await SchoolYear.findOne({ isCurrent: true });

      if (!activeSchoolYear) {
        return res.status(400).json({ message: "No active school year." });
      }
            
      
      // ✅ Proceed with update
      const enrollment = await Enrollment.findByIdAndUpdate(
        enrollmentId,
        {
          $set: {
            gradeLevelToEnroll: gradeLevelToEnroll,
            address: {
              current: address.current,
              permanent: address.permanent
            },
              parentGuardianInfo: {
                father: normalizeParent(parentGuardianInfo.father),
                mother: normalizeParent(parentGuardianInfo.mother),
                guardian: normalizeParent(parentGuardianInfo.guardian)
            },
            schoolHistory: {
              returningLearner: schoolHistory.returningLearner,
              lastGradeLevelCompleted: schoolHistory.lastGradeLevelCompleted,
              lastSchoolYearCompleted: schoolHistory.lastSchoolYearCompleted,
              lastSchoolAttended: normalizeName(schoolHistory.lastSchoolAttended),
              schoolId: schoolHistory.schoolId
            },
            seniorHigh: {
              semester: activeSchoolYear.semester,
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

      // ✅ Parse PSA No. from Step 3
      const psaNo = req.body.psaNo?.trim() || '';

      // ✅ VALIDATION: PSA No. (allows alphanumeric + hyphens, must have 12 digits)
      if (psaNo && psaNo !== 'N/A') {
        const validFormat = /^[a-zA-Z0-9\-]{1,13}$/.test(psaNo);
        
        if (!validFormat) {
          return res.status(400).json({ 
            message: 'PSA Birth Certificate No. must not exceed 13 characters. Only letters, numbers, and hyphens are allowed.' 
          });
        }
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

      // ✅ Fetch existing enrollment
      const existingEnrollment = await Enrollment.findById(enrollmentId);
      if (!existingEnrollment) {
          return res.status(404).json({ message: "Enrollment not found" });
      }



      // ✅ UPLOAD TO CLOUDINARY

      const isUpdateFlow = existingEnrollment.requiredDocuments?.psaBirthCert?.filePath;

      const requiredDocuments = isUpdateFlow ? {
          psaBirthCert: existingEnrollment.requiredDocuments?.psaBirthCert || null,
          reportCard: existingEnrollment.requiredDocuments?.reportCard || null,
          goodMoral: existingEnrollment.requiredDocuments?.goodMoral || null,
          idPicture: existingEnrollment.requiredDocuments?.idPicture || null,
      } : {};



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
      if (!requiredDocuments.psaBirthCert?.filePath) missingDocs.push('PSA Birth Certificate');
      if (!requiredDocuments.reportCard?.filePath) missingDocs.push('Report Card');
      if (!requiredDocuments.idPicture?.filePath) missingDocs.push('ID Picture');



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
                  psaNo: psaNo || null,
                  signature: {
                      dateSigned: new Date()
                  },
                  status: 'pending',
                  statusRegistration: 'complete',
                  expiresAt: null,
                  updateToken: null,        // ✅ clear token
                  updateTokenExpiry: null   // ✅ clear expiry
              }
          },
          { new: true }
      );


      io.emit("new-enrollment", { message: "" });

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




export const Add_Applicants = async (req, res) => {
  try {
    // ==========================================
    // PARSE ALL PAYLOADS
    // ==========================================
    const learnerInfo       = JSON.parse(req.body.learnerInfo       || '{}');
    const address           = JSON.parse(req.body.address           || '{}');
    const parentGuardianInfo= JSON.parse(req.body.parentGuardianInfo|| '{}');
    const schoolHistory     = JSON.parse(req.body.schoolHistory     || '{}');
    const seniorHigh        = JSON.parse(req.body.seniorHigh        || '{}');
    const psaNo             = req.body.psaNo?.trim() || '';
    const gradeLevelToEnroll= req.body.gradeLevelToEnroll;
    const studentType       = req.body.studentType || 'regular';
    const isReturning       = req.body.isReturning;

    // ==========================================
    // VALIDATIONS — STEP 1 (Learner Info)
    // ==========================================

    // Required top-level
    if (!isReturning) {
      return res.status(400).json({ message: 'Please answer "Returning (Balik-Aral)?" question' });
    }

    // Required learner fields
    const learnerRequiredFields = [
      { field: 'email',       message: 'Email is required' },
      { field: 'lrn',         message: 'LRN is required' },
      { field: 'lastName',    message: 'Last Name is required' },
      { field: 'firstName',   message: 'First Name is required' },
      { field: 'birthDate',   message: 'Birth Date is required' },
      { field: 'age',         message: 'Age is required' },
      { field: 'sex',         message: 'Sex is required' },
      { field: 'placeOfBirth',message: 'Place of Birth is required' },
      { field: 'motherTongue',message: 'Mother Tongue is required' },
    ];
    for (const { field, message } of learnerRequiredFields) {
      if (!learnerInfo[field] || learnerInfo[field].toString().trim() === '') {
        return res.status(400).json({ message });
      }
    }

    // LRN — exactly 12 digits
    if (learnerInfo.lrn && learnerInfo.lrn !== 'N/A') {
      if (!/^\d{12}$/.test(learnerInfo.lrn)) {
        return res.status(400).json({ message: 'LRN must be exactly 12 digits' });
      }
    }

    // Extension Name
    const validExtensionNames = ['', 'jr.', 'Jr.', 'Sr.', 'II', 'III'];
    const extensionNameInput = learnerInfo.extensionName?.trim() || '';
    if (extensionNameInput && extensionNameInput !== 'N/A' && !validExtensionNames.includes(extensionNameInput)) {
      return res.status(400).json({
        message: 'Invalid extension name. Accepted values: Jr., Sr., II, III'
      });
    }

    // Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(learnerInfo.email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Disability
    if (!learnerInfo.learnerWithDisability?.isDisabled ||
        learnerInfo.learnerWithDisability.isDisabled.trim() === '') {
      return res.status(400).json({ message: 'Please answer if learner has disability' });
    }
    if (learnerInfo.learnerWithDisability?.isDisabled === 'Yes') {
      if (!learnerInfo.learnerWithDisability?.disabilityType ||
          learnerInfo.learnerWithDisability.disabilityType.length === 0) {
        return res.status(400).json({ message: 'Please select at least one disability type' });
      }
    }

    // Indigenous Community
    if (learnerInfo.indigenousCommunity?.isMember === 'Yes') {
      if (!learnerInfo.indigenousCommunity?.name ||
          learnerInfo.indigenousCommunity.name.trim() === '') {
        return res.status(400).json({ message: 'Indigenous Community name is required' });
      }
    }

    // 4Ps
    if (learnerInfo.fourPs?.isBeneficiary === 'Yes') {
      if (!learnerInfo.fourPs?.householdId || learnerInfo.fourPs.householdId.trim() === '') {
        return res.status(400).json({ message: '4Ps Household ID is required' });
      }
      if (!/^\d{12}$/.test(learnerInfo.fourPs.householdId)) {
        return res.status(400).json({ message: '4Ps Household ID must be exactly 12 digits' });
      }
    }

    // Duplicate email check
    const [existingEmailEnrollment, existingEmailStudent, existingEmailStaff] = await Promise.all([
      Enrollment.findOne({ "learnerInfo.email": learnerInfo.email }),
      Student.findOne({ email: learnerInfo.email }),
      Staff.findOne({ email: learnerInfo.email }),
    ]);
    if (existingEmailEnrollment || existingEmailStudent || existingEmailStaff) {
      return res.status(409).json({ message: "Email already exists." });
    }

    // Duplicate LRN check
    if (learnerInfo.lrn && learnerInfo.lrn !== 'N/A') {
      const existingLRN = await Enrollment.findOne({ "learnerInfo.lrn": learnerInfo.lrn });
      if (existingLRN) {
        return res.status(409).json({ message: "LRN is already registered" });
      }
    }

    // ✅ VALIDATION: Same firstName + lastName + birthDate = duplicate applicant
    const existingApplicant = await Enrollment.findOne({
      "learnerInfo.firstName": normalizeName(learnerInfo.firstName),
      "learnerInfo.birthDate": learnerInfo.birthDate,
    });
    if (existingApplicant) {
      return res.status(409).json({
        message: "An applicant with the same name and birth date already exists."
      });
    }

    // ✅ VALIDATION: Same firstName + lastName + middleName = duplicate applicant
    const existingFullName = await Enrollment.findOne({
      "learnerInfo.firstName":  normalizeName(learnerInfo.firstName),
      "learnerInfo.lastName":   normalizeName(learnerInfo.lastName),
      "learnerInfo.middleName": normalizeName(learnerInfo.middleName?.trim() || 'N/A'),
    });
    if (existingFullName) {
      return res.status(409).json({
        message: "Full name already exists."
      });
    }
    

    const existingFullName2 = await Enrollment.findOne({
      "learnerInfo.firstName":  normalizeName(learnerInfo.firstName),
      "learnerInfo.lastName":   normalizeName(learnerInfo.lastName),
    });
    if (existingFullName2) {
      return res.status(409).json({
        message: "Full name already exists."
      });
    }



    // ✅ VALIDATION: Same full name not allowed in Staff
    const existingStaffName = await Staff.findOne({
      firstName:  { $regex: new RegExp(`^${learnerInfo.firstName.trim()}$`, 'i') },
      lastName:   { $regex: new RegExp(`^${learnerInfo.lastName.trim()}$`, 'i') },
      middleName: { $regex: new RegExp(`^${(learnerInfo.middleName?.trim() || 'N/A')}$`, 'i') },
    });
    if (existingStaffName) {
      return res.status(409).json({
        message: "Full name already exists."
      });
    }


    const existingStaffName2 = await Staff.findOne({
      firstName:  { $regex: new RegExp(`^${learnerInfo.firstName.trim()}$`, 'i') },
      lastName:   { $regex: new RegExp(`^${learnerInfo.lastName.trim()}$`, 'i') },
    });
    if (existingStaffName2) {
      return res.status(409).json({
        message: "Full name already exists."
      });
    }




    // ==========================================
    // VALIDATIONS — STEP 2 (Address & Parents)
    // ==========================================

    // Current address required fields
    const requiredCurrentFields = [
      { field: 'street',        message: 'Current Address: Street is required' },
      { field: 'region',        message: 'Current Address: Region is required' },
      { field: 'barangay',      message: 'Current Address: Barangay is required' },
      { field: 'municipality',  message: 'Current Address: Municipality is required' },
      { field: 'province',      message: 'Current Address: Province is required' },
      { field: 'country',       message: 'Current Address: Country is required' },
      { field: 'zipCode',       message: 'Current Address: Zip Code is required' },
      { field: 'contactNumber', message: 'Current Address: Contact Number is required' },
    ];
    for (const { field, message } of requiredCurrentFields) {
      if (!address.current?.[field] || address.current[field].trim() === '') {
        return res.status(400).json({ message });
      }
    }

    // Contact number format
    const cleanedContactNumber = address.current.contactNumber.replace(/\s/g, '');
    if (!/^\d{11}$/.test(cleanedContactNumber)) {
      return res.status(400).json({ message: 'Current Address: Contact Number must be exactly 11 digits' });
    }
    if (!cleanedContactNumber.startsWith('09')) {
      return res.status(400).json({ message: 'Current Address: Contact Number must start with 09' });
    }

    // Permanent address (if not same as current)
    if (!address.permanent?.sameAsCurrent) {
      const requiredPermFields = [
        { field: 'street',       message: 'Permanent Address: Street is required' },
        { field: 'region',       message: 'Permanent Address: Region is required' },
        { field: 'barangay',     message: 'Permanent Address: Barangay is required' },
        { field: 'municipality', message: 'Permanent Address: Municipality is required' },
        { field: 'province',     message: 'Permanent Address: Province is required' },
        { field: 'country',      message: 'Permanent Address: Country is required' },
        { field: 'zipCode',      message: 'Permanent Address: Zip Code is required' },
      ];
      for (const { field, message } of requiredPermFields) {
        if (!address.permanent?.[field] || address.permanent[field].trim() === '') {
          return res.status(400).json({ message });
        }
      }
    }

    // Guardian required
    const requiredGuardianFields = [
      { field: 'lastName',  message: 'Guardian Last Name is required' },
      { field: 'firstName', message: 'Guardian First Name is required' },
    ];
    for (const { field, message } of requiredGuardianFields) {
      if (!parentGuardianInfo.guardian?.[field] || parentGuardianInfo.guardian[field].trim() === '') {
        return res.status(400).json({ message });
      }
    }

    // Parent/Guardian contact numbers format (if provided)
    for (const parentType of ['father', 'mother', 'guardian']) {
      const contactNumber = parentGuardianInfo[parentType]?.contactNumber;
      if (!contactNumber || contactNumber.trim() === '' || contactNumber.trim() === 'N/A') continue;
      const cleaned = contactNumber.replace(/\s/g, '');
      if (!/^\d{11}$/.test(cleaned)) {
        return res.status(400).json({
          message: `${parentType.charAt(0).toUpperCase() + parentType.slice(1)}: Contact Number must be exactly 11 digits`
        });
      }
      if (!cleaned.startsWith('09')) {
        return res.status(400).json({
          message: `${parentType.charAt(0).toUpperCase() + parentType.slice(1)}: Contact Number must start with 09`
        });
      }
    }

    // School history (if returning learner)
    if (schoolHistory.returningLearner) {
      if (!studentType || (studentType !== 'transferee' && studentType !== 'returnee')) {
        return res.status(400).json({ message: 'Please select either Transferee or Returning Learner' });
      }
      const requiredSchoolFields = [
        { field: 'lastGradeLevelCompleted', message: 'Last Grade Level Completed is required' },
        { field: 'lastSchoolYearCompleted', message: 'Last School Year Completed is required' },
        { field: 'lastSchoolAttended',      message: 'Last School Attended is required' },
        { field: 'schoolId',                message: 'School ID is required' },
      ];
      for (const { field, message } of requiredSchoolFields) {
        if (!schoolHistory[field] || schoolHistory[field].trim() === '') {
          return res.status(400).json({ message });
        }
      }
    }

    // Grade level, track, strand
    if (!gradeLevelToEnroll || !['Grade 11', 'Grade 12'].includes(gradeLevelToEnroll)) {
      return res.status(400).json({ message: 'Grade Level to Enroll is required' });
    }
    if (!seniorHigh.track || seniorHigh.track.trim() === '') {
      return res.status(400).json({ message: 'Track is required' });
    }
    if (!seniorHigh.strand || seniorHigh.strand.trim() === '') {
      return res.status(400).json({ message: 'Strand is required' });
    }
    const programExists = await Program.findOne({
      trackName: seniorHigh.track,
      isActive: true,
      strands: { $elemMatch: { strandName: seniorHigh.strand, isActive: true } }
    });
    if (!programExists) {
      return res.status(400).json({ message: 'Invalid track or strand selected.' });
    }

    // ==========================================
    // VALIDATIONS — STEP 3 (Documents)
    // ==========================================

    // PSA No. format (optional)
    if (psaNo && psaNo !== 'N/A') {
      if (!/^[a-zA-Z0-9\-]{1,13}$/.test(psaNo)) {
        return res.status(400).json({
          message: 'PSA Certificate No. must not exceed 13 characters. Only letters, numbers, and hyphens allowed.'
        });
      }
    }

    // File type validation
    if (req.files) {
      for (const fieldName of ['psaBirthCertFile', 'reportCardFile', 'idPictureFile', 'goodMoralFile']) {
        const file = req.files[fieldName]?.[0];
        if (file) {
          const ext = path.extname(file.originalname).toLowerCase();
          if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.mimetype) ||
              !['.jpg', '.jpeg', '.png'].includes(ext)) {
            return res.status(400).json({ message: `${fieldName}: Only JPG and PNG files are allowed!` });
          }
        }
      }
    }

    // ==========================================
    // ACTIVE SCHOOL YEAR CHECK
    // ==========================================
    const activeSchoolYear = await SchoolYear.findOne({ isCurrent: true });
    if (!activeSchoolYear) {
      return res.status(400).json({ message: "No active school year." });
    }

    // ==========================================
    // NORMALIZE & SET N/A DEFAULTS
    // ==========================================
    const extensionName = learnerInfo.extensionName?.trim() || 'N/A';
    const lrn           = learnerInfo.lrn?.trim()           || 'N/A';

    if (!address.current.houseNo || address.current.houseNo.trim() === '') {
      address.current.houseNo = 'N/A';
    }
    if (!address.permanent?.sameAsCurrent) {
      if (!address.permanent?.houseNo || address.permanent.houseNo.trim() === '') {
        address.permanent.houseNo = 'N/A';
      }
    }

    for (const parentType of ['father', 'mother']) {
      if (!parentGuardianInfo[parentType]) parentGuardianInfo[parentType] = {};
      for (const field of ['lastName', 'firstName', 'middleName', 'contactNumber']) {
        if (!parentGuardianInfo[parentType][field] || parentGuardianInfo[parentType][field].trim() === '') {
          parentGuardianInfo[parentType][field] = 'N/A';
        }
      }
    }
    for (const field of ['middleName', 'contactNumber']) {
      if (!parentGuardianInfo.guardian[field] || parentGuardianInfo.guardian[field].trim() === '') {
        parentGuardianInfo.guardian[field] = 'N/A';
      }
    }

    // ==========================================
    // UPLOAD DOCUMENTS TO CLOUDINARY
    // ==========================================
    const requiredDocuments = {};

    if (req.files['psaBirthCertFile']?.[0]) {
      const result = await uploadToCloudinary(
        req.files['psaBirthCertFile'][0].buffer,
        req.files['psaBirthCertFile'][0].originalname,
        'enrollments/documents'
      );
      requiredDocuments.psaBirthCert = { filePath: result.secure_url, publicId: result.public_id, uploadedAt: new Date() };
    }
    if (req.files['reportCardFile']?.[0]) {
      const result = await uploadToCloudinary(
        req.files['reportCardFile'][0].buffer,
        req.files['reportCardFile'][0].originalname,
        'enrollments/documents'
      );
      requiredDocuments.reportCard = { filePath: result.secure_url, publicId: result.public_id, uploadedAt: new Date() };
    }
    if (req.files['goodMoralFile']?.[0]) {
      const result = await uploadToCloudinary(
        req.files['goodMoralFile'][0].buffer,
        req.files['goodMoralFile'][0].originalname,
        'enrollments/documents'
      );
      requiredDocuments.goodMoral = { filePath: result.secure_url, publicId: result.public_id, uploadedAt: new Date() };
    }
    if (req.files['idPictureFile']?.[0]) {
      const result = await uploadToCloudinary(
        req.files['idPictureFile'][0].buffer,
        req.files['idPictureFile'][0].originalname,
        'enrollments/documents'
      );
      requiredDocuments.idPicture = { filePath: result.secure_url, publicId: result.public_id, uploadedAt: new Date() };
    }

    // Check required docs
    const missingDocs = [];
    if (!requiredDocuments.psaBirthCert?.filePath) missingDocs.push('PSA Birth Certificate');
    if (!requiredDocuments.reportCard?.filePath)   missingDocs.push('Report Card');
    if (!requiredDocuments.idPicture?.filePath)    missingDocs.push('ID Picture');

    if (missingDocs.length > 0) {
      // Cleanup uploaded files
      for (const doc of Object.values(requiredDocuments)) {
        if (doc?.publicId) await deleteFromCloudinary(doc.publicId);
      }
      return res.status(400).json({ message: `Missing required documents: ${missingDocs.join(', ')}` });
    }

    // ==========================================
    // CREATE ENROLLMENT — SINGLE INSERT
    // ==========================================
    const enrollment = await Enrollment.create({
      schoolYear:        activeSchoolYear.schoolYear,
      schoolYearId:      activeSchoolYear._id,
      isReturning:       isReturning === 'Yes',
      gradeLevelToEnroll,
      studentType,

      learnerInfo: {
        email:       learnerInfo.email,
        lrn,
        lastName:    normalizeName(learnerInfo.lastName),
        firstName:   normalizeName(learnerInfo.firstName),
        middleName:  normalizeName(learnerInfo.middleName?.trim() || 'N/A'),
        extensionName,
        birthDate:   learnerInfo.birthDate,
        age:         learnerInfo.age,
        sex:         learnerInfo.sex,
        placeOfBirth: normalizeName(learnerInfo.placeOfBirth),
        motherTongue: normalizeName(learnerInfo.motherTongue),
        learnerWithDisability: {
          isDisabled:     learnerInfo.learnerWithDisability?.isDisabled === 'Yes',
          disabilityType: learnerInfo.learnerWithDisability?.disabilityType || []
        },
        indigenousCommunity: {
          isMember: learnerInfo.indigenousCommunity?.isMember === 'Yes',
          name:     learnerInfo.indigenousCommunity?.name || ''
        },
        fourPs: {
          isBeneficiary: learnerInfo.fourPs?.isBeneficiary === 'Yes',
          householdId:   learnerInfo.fourPs?.householdId || ''
        },
      },

      address: {
        current:   address.current,
        permanent: address.permanent
      },

      parentGuardianInfo: {
        father:   normalizeParent(parentGuardianInfo.father),
        mother:   normalizeParent(parentGuardianInfo.mother),
        guardian: normalizeParent(parentGuardianInfo.guardian)
      },

      schoolHistory: {
        returningLearner:        schoolHistory.returningLearner,
        lastGradeLevelCompleted: schoolHistory.lastGradeLevelCompleted,
        lastSchoolYearCompleted: schoolHistory.lastSchoolYearCompleted,
        lastSchoolAttended:      normalizeName(schoolHistory.lastSchoolAttended),
        schoolId:                schoolHistory.schoolId
      },

      seniorHigh: {
        semester: activeSchoolYear.semester,
        track:    seniorHigh.track,
        strand:   seniorHigh.strand
      },

      requiredDocuments,
      psaNo: psaNo || null,

      signature: { dateSigned: new Date() },
      status:               'pending',
      statusRegistration:   'complete',
    });





    const { id, role } = req.account;
    const studentName = `${normalizeName(learnerInfo.firstName)} ${normalizeName(learnerInfo.lastName)}`;

    await createLogs(
      id,
      role,
      'ADD APPLICANT',
      `Added applicant: ${studentName} (${gradeLevelToEnroll})`,
      'Success'
    );



    io.emit("new-enrollment", { message: "" });

    return res.status(201).json({
      success: true,
      message: 'Applicant added successfully.'
    });

  } catch (error) {
    console.error('Add_Applicants error:', error);
    return res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};



export const Update_Applicant = async (req, res) => {
  try {
    const { id } = req.params;

    // ==========================================
    // FIND EXISTING ENROLLMENT
    // ==========================================
    const existingEnrollment = await Enrollment.findById(id);
    if (!existingEnrollment) {
      return res.status(404).json({ message: "Applicant not found." });
    }

    // ==========================================
    // PARSE ALL PAYLOADS
    // ==========================================
    const learnerInfo        = JSON.parse(req.body.learnerInfo        || '{}');
    const address            = JSON.parse(req.body.address            || '{}');
    const parentGuardianInfo = JSON.parse(req.body.parentGuardianInfo || '{}');
    const schoolHistory      = JSON.parse(req.body.schoolHistory      || '{}');
    const seniorHigh         = JSON.parse(req.body.seniorHigh         || '{}');
    const psaNo              = req.body.psaNo?.trim() || '';
    const gradeLevelToEnroll = req.body.gradeLevelToEnroll;
    const studentType        = req.body.studentType || 'regular';
    const isReturning        = req.body.isReturning;

    // ==========================================
    // VALIDATIONS — STEP 1 (Learner Info)
    // ==========================================
    if (!isReturning) {
      return res.status(400).json({ message: 'Please answer "Returning (Balik-Aral)?" question' });
    }

    const learnerRequiredFields = [
      { field: 'email',        message: 'Email is required' },
      { field: 'lrn',          message: 'LRN is required' },
      { field: 'lastName',     message: 'Last Name is required' },
      { field: 'firstName',    message: 'First Name is required' },
      { field: 'birthDate',    message: 'Birth Date is required' },
      { field: 'age',          message: 'Age is required' },
      { field: 'sex',          message: 'Sex is required' },
      { field: 'placeOfBirth', message: 'Place of Birth is required' },
      { field: 'motherTongue', message: 'Mother Tongue is required' },
    ];
    for (const { field, message } of learnerRequiredFields) {
      if (!learnerInfo[field] || learnerInfo[field].toString().trim() === '') {
        return res.status(400).json({ message });
      }
    }

    // LRN format
    if (learnerInfo.lrn && learnerInfo.lrn !== 'N/A') {
      if (!/^\d{12}$/.test(learnerInfo.lrn)) {
        return res.status(400).json({ message: 'LRN must be exactly 12 digits' });
      }
    }

    // Extension Name
    const validExtensionNames = ['', 'jr.', 'Jr.', 'Sr.', 'II', 'III'];
    const extensionNameInput = learnerInfo.extensionName?.trim() || '';
    if (extensionNameInput && extensionNameInput !== 'N/A' && !validExtensionNames.includes(extensionNameInput)) {
      return res.status(400).json({
        message: 'Invalid extension name. Accepted values: Jr., Sr., II, III'
      });
    }

    // Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(learnerInfo.email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Disability
    if (!learnerInfo.learnerWithDisability?.isDisabled ||
        learnerInfo.learnerWithDisability.isDisabled.trim() === '') {
      return res.status(400).json({ message: 'Please answer if learner has disability' });
    }
    if (learnerInfo.learnerWithDisability?.isDisabled === 'Yes') {
      if (!learnerInfo.learnerWithDisability?.disabilityType ||
          learnerInfo.learnerWithDisability.disabilityType.length === 0) {
        return res.status(400).json({ message: 'Please select at least one disability type' });
      }
    }

    // Indigenous Community
    if (learnerInfo.indigenousCommunity?.isMember === 'Yes') {
      if (!learnerInfo.indigenousCommunity?.name ||
          learnerInfo.indigenousCommunity.name.trim() === '') {
        return res.status(400).json({ message: 'Indigenous Community name is required' });
      }
    }

    // 4Ps
    if (learnerInfo.fourPs?.isBeneficiary === 'Yes') {
      if (!learnerInfo.fourPs?.householdId || learnerInfo.fourPs.householdId.trim() === '') {
        return res.status(400).json({ message: '4Ps Household ID is required' });
      }
      if (!/^\d{12}$/.test(learnerInfo.fourPs.householdId)) {
        return res.status(400).json({ message: '4Ps Household ID must be exactly 12 digits' });
      }
    }

    // ==========================================
    // DUPLICATE CHECKS — SKIP IF SAME RECORD
    // ==========================================
    const currentEmail = existingEnrollment.learnerInfo?.email?.toLowerCase();
    const incomingEmail = learnerInfo.email?.toLowerCase();

    if (incomingEmail !== currentEmail) {
      // Email changed — check duplicates
      const [dupEnrollment, dupStudent, dupStaff] = await Promise.all([
        Enrollment.findOne({ "learnerInfo.email": learnerInfo.email, _id: { $ne: id } }),
        Student.findOne({ email: learnerInfo.email }),
        Staff.findOne({ email: learnerInfo.email }),
      ]);
      if (dupEnrollment || dupStudent || dupStaff) {
        return res.status(409).json({ message: "Email already exists." });
      }
    }

    const currentLRN = existingEnrollment.learnerInfo?.lrn?.trim();
    const incomingLRN = learnerInfo.lrn?.trim();

    if (incomingLRN !== currentLRN && incomingLRN && incomingLRN !== 'N/A') {
      const dupLRN = await Enrollment.findOne({
        "learnerInfo.lrn": incomingLRN,
        _id: { $ne: id }
      });
      if (dupLRN) {
        return res.status(409).json({ message: "LRN is already registered." });
      }
    }

    // ✅ VALIDATION: Same firstName + lastName + birthDate = duplicate (exclude current record)
    const existingApplicant = await Enrollment.findOne({
      "learnerInfo.firstName": normalizeName(learnerInfo.firstName),
      "learnerInfo.lastName":  normalizeName(learnerInfo.lastName),
      "learnerInfo.birthDate": learnerInfo.birthDate,
      _id: { $ne: id }
    });
    if (existingApplicant) {
      return res.status(409).json({
        message: "An applicant with the same name and birth date already exists."
      });
    }

    // ✅ VALIDATION: Same firstName + lastName + middleName = duplicate (exclude current record)
    const existingFullName = await Enrollment.findOne({
      "learnerInfo.firstName":  normalizeName(learnerInfo.firstName),
      "learnerInfo.lastName":   normalizeName(learnerInfo.lastName),
      "learnerInfo.middleName": normalizeName(learnerInfo.middleName?.trim() || 'N/A'),
      _id: { $ne: id }
    });

    if (existingFullName) {
      return res.status(409).json({
        message: "Full name already exists."
      });
    }

    const existingFullName2 = await Enrollment.findOne({
      "learnerInfo.firstName":  normalizeName(learnerInfo.firstName),
      "learnerInfo.lastName":   normalizeName(learnerInfo.lastName),
      _id: { $ne: id }
    });

    if (existingFullName2) {
      return res.status(409).json({
        message: "Full name already exists."
      });
    }

    // ✅ VALIDATION: Same full name not allowed in Staff
    const staffQuery = {
      firstName: { $regex: new RegExp(`^${learnerInfo.firstName.trim()}$`, 'i') },
      lastName:  { $regex: new RegExp(`^${learnerInfo.lastName.trim()}$`, 'i') },
    };
    const middleName = learnerInfo.middleName?.trim();
    if (middleName) {
      staffQuery.middleName = { $regex: new RegExp(`^${middleName}$`, 'i') };
    } else {
      staffQuery.$or = [
        { middleName: { $exists: false } },
        { middleName: null },
        { middleName: '' },
        { middleName: 'N/A' },
      ];
    }
    const existingStaffName = await Staff.findOne(staffQuery);
    if (existingStaffName) {
      return res.status(409).json({
        message: "Full name already exists."
      });
    }

    // ==========================================
    // VALIDATIONS — STEP 2 (Address & Parents)
    // ==========================================
    const requiredCurrentFields = [
      { field: 'street',        message: 'Current Address: Street is required' },
      { field: 'region',        message: 'Current Address: Region is required' },
      { field: 'barangay',      message: 'Current Address: Barangay is required' },
      { field: 'municipality',  message: 'Current Address: Municipality is required' },
      { field: 'province',      message: 'Current Address: Province is required' },
      { field: 'country',       message: 'Current Address: Country is required' },
      { field: 'zipCode',       message: 'Current Address: Zip Code is required' },
      { field: 'contactNumber', message: 'Current Address: Contact Number is required' },
    ];
    for (const { field, message } of requiredCurrentFields) {
      if (!address.current?.[field] || address.current[field].trim() === '') {
        return res.status(400).json({ message });
      }
    }

    const cleanedContactNumber = address.current.contactNumber.replace(/\s/g, '');
    if (!/^\d{11}$/.test(cleanedContactNumber)) {
      return res.status(400).json({ message: 'Current Address: Contact Number must be exactly 11 digits' });
    }
    if (!cleanedContactNumber.startsWith('09')) {
      return res.status(400).json({ message: 'Current Address: Contact Number must start with 09' });
    }

    if (!address.permanent?.sameAsCurrent) {
      const requiredPermFields = [
        { field: 'street',       message: 'Permanent Address: Street is required' },
        { field: 'region',       message: 'Permanent Address: Region is required' },
        { field: 'barangay',     message: 'Permanent Address: Barangay is required' },
        { field: 'municipality', message: 'Permanent Address: Municipality is required' },
        { field: 'province',     message: 'Permanent Address: Province is required' },
        { field: 'country',      message: 'Permanent Address: Country is required' },
        { field: 'zipCode',      message: 'Permanent Address: Zip Code is required' },
      ];
      for (const { field, message } of requiredPermFields) {
        if (!address.permanent?.[field] || address.permanent[field].trim() === '') {
          return res.status(400).json({ message });
        }
      }
    }

    const requiredGuardianFields = [
      { field: 'lastName',  message: 'Guardian Last Name is required' },
      { field: 'firstName', message: 'Guardian First Name is required' },
    ];
    for (const { field, message } of requiredGuardianFields) {
      if (!parentGuardianInfo.guardian?.[field] || parentGuardianInfo.guardian[field].trim() === '') {
        return res.status(400).json({ message });
      }
    }

    for (const parentType of ['father', 'mother', 'guardian']) {
      const contactNumber = parentGuardianInfo[parentType]?.contactNumber;
      if (!contactNumber || contactNumber.trim() === '' || contactNumber.trim() === 'N/A') continue;
      const cleaned = contactNumber.replace(/\s/g, '');
      if (!/^\d{11}$/.test(cleaned)) {
        return res.status(400).json({
          message: `${parentType.charAt(0).toUpperCase() + parentType.slice(1)}: Contact Number must be exactly 11 digits`
        });
      }
      if (!cleaned.startsWith('09')) {
        return res.status(400).json({
          message: `${parentType.charAt(0).toUpperCase() + parentType.slice(1)}: Contact Number must start with 09`
        });
      }
    }

    if (schoolHistory.returningLearner) {
      if (!studentType || (studentType !== 'transferee' && studentType !== 'returnee')) {
        return res.status(400).json({ message: 'Please select either Transferee or Returning Learner' });
      }
      const requiredSchoolFields = [
        { field: 'lastGradeLevelCompleted', message: 'Last Grade Level Completed is required' },
        { field: 'lastSchoolYearCompleted', message: 'Last School Year Completed is required' },
        { field: 'lastSchoolAttended',      message: 'Last School Attended is required' },
        { field: 'schoolId',                message: 'School ID is required' },
      ];
      for (const { field, message } of requiredSchoolFields) {
        if (!schoolHistory[field] || schoolHistory[field].trim() === '') {
          return res.status(400).json({ message });
        }
      }
    }

    if (!gradeLevelToEnroll || !['Grade 11', 'Grade 12'].includes(gradeLevelToEnroll)) {
      return res.status(400).json({ message: 'Grade Level to Enroll is required' });
    }
    if (!seniorHigh.track || seniorHigh.track.trim() === '') {
      return res.status(400).json({ message: 'Track is required' });
    }
    if (!seniorHigh.strand || seniorHigh.strand.trim() === '') {
      return res.status(400).json({ message: 'Strand is required' });
    }

    const programExists = await Program.findOne({
      trackName: seniorHigh.track,
      isActive: true,
      strands: { $elemMatch: { strandName: seniorHigh.strand, isActive: true } }
    });
    if (!programExists) {
      return res.status(400).json({ message: 'Invalid track or strand selected.' });
    }

    // ==========================================
    // VALIDATIONS — STEP 3 (Documents)
    // ==========================================
    if (psaNo && psaNo !== 'N/A') {
      if (!/^[a-zA-Z0-9\-]{1,13}$/.test(psaNo)) {
        return res.status(400).json({
          message: 'PSA Certificate No. must not exceed 13 characters. Only letters, numbers, and hyphens allowed.'
        });
      }
    }

    if (req.files) {
      for (const fieldName of ['psaBirthCertFile', 'reportCardFile', 'idPictureFile', 'goodMoralFile']) {
        const file = req.files[fieldName]?.[0];
        if (file) {
          const ext = path.extname(file.originalname).toLowerCase();
          if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.mimetype) ||
              !['.jpg', '.jpeg', '.png'].includes(ext)) {
            return res.status(400).json({ message: `${fieldName}: Only JPG and PNG files are allowed!` });
          }
        }
      }
    }

    // ==========================================
    // NORMALIZE & SET N/A DEFAULTS
    // ==========================================
    const extensionName = learnerInfo.extensionName?.trim() || 'N/A';
    const lrn           = learnerInfo.lrn?.trim()           || 'N/A';

    if (!address.current.houseNo || address.current.houseNo.trim() === '') {
      address.current.houseNo = 'N/A';
    }
    if (!address.permanent?.sameAsCurrent) {
      if (!address.permanent?.houseNo || address.permanent.houseNo.trim() === '') {
        address.permanent.houseNo = 'N/A';
      }
    }

    for (const parentType of ['father', 'mother']) {
      if (!parentGuardianInfo[parentType]) parentGuardianInfo[parentType] = {};
      for (const field of ['lastName', 'firstName', 'middleName', 'contactNumber']) {
        if (!parentGuardianInfo[parentType][field] || parentGuardianInfo[parentType][field].trim() === '') {
          parentGuardianInfo[parentType][field] = 'N/A';
        }
      }
    }
    for (const field of ['middleName', 'contactNumber']) {
      if (!parentGuardianInfo.guardian[field] || parentGuardianInfo.guardian[field].trim() === '') {
        parentGuardianInfo.guardian[field] = 'N/A';
      }
    }

    // ==========================================
    // HANDLE DOCUMENTS — KEEP OLD OR REPLACE
    // ==========================================
    // Start with existing docs from DB
    const requiredDocuments = {
      psaBirthCert: existingEnrollment.requiredDocuments?.psaBirthCert || null,
      reportCard:   existingEnrollment.requiredDocuments?.reportCard   || null,
      goodMoral:    existingEnrollment.requiredDocuments?.goodMoral    || null,
      idPicture:    existingEnrollment.requiredDocuments?.idPicture    || null,
    };

    // Map: formField → docKey
    const docFields = [
      { fileField: 'psaBirthCertFile', docKey: 'psaBirthCert' },
      { fileField: 'reportCardFile',   docKey: 'reportCard'   },
      { fileField: 'goodMoralFile',    docKey: 'goodMoral'    },
      { fileField: 'idPictureFile',    docKey: 'idPicture'    },
    ];

    for (const { fileField, docKey } of docFields) {
      const newFile = req.files?.[fileField]?.[0];
      if (!newFile) continue;

      // Delete old file from Cloudinary if exists
      const oldPublicId = existingEnrollment.requiredDocuments?.[docKey]?.publicId;
      if (oldPublicId) await deleteFromCloudinary(oldPublicId);

      // Upload new file
      const result = await uploadToCloudinary(
        newFile.buffer,
        newFile.originalname,
        'enrollments/documents'
      );
      requiredDocuments[docKey] = {
        filePath:   result.secure_url,
        publicId:   result.public_id,
        uploadedAt: new Date()
      };
    }

    // Required docs must still exist (either old or newly uploaded)
    const missingDocs = [];
    if (!requiredDocuments.psaBirthCert?.filePath) missingDocs.push('PSA Birth Certificate');
    if (!requiredDocuments.reportCard?.filePath)   missingDocs.push('Report Card');
    if (!requiredDocuments.idPicture?.filePath)    missingDocs.push('ID Picture');

    if (missingDocs.length > 0) {
      return res.status(400).json({ message: `Missing required documents: ${missingDocs.join(', ')}` });
    }

    // ==========================================
    // UPDATE ENROLLMENT
    // ==========================================
    const activeSchoolYear = await SchoolYear.findOne({ isCurrent: true });
    if (!activeSchoolYear) {
      return res.status(400).json({ message: "No active school year." });
    }

    await Enrollment.findByIdAndUpdate(
      id,
      {
        $set: {
          isReturning:       isReturning === 'Yes',
          gradeLevelToEnroll,
          studentType,

          learnerInfo: {
            email:        learnerInfo.email,
            lrn,
            lastName:     normalizeName(learnerInfo.lastName),
            firstName:    normalizeName(learnerInfo.firstName),
            middleName:   normalizeName(learnerInfo.middleName?.trim() || 'N/A'),
            extensionName,
            birthDate:    learnerInfo.birthDate,
            age:          learnerInfo.age,
            sex:          learnerInfo.sex,
            placeOfBirth: normalizeName(learnerInfo.placeOfBirth),
            motherTongue: normalizeName(learnerInfo.motherTongue),
            learnerWithDisability: {
              isDisabled:     learnerInfo.learnerWithDisability?.isDisabled === 'Yes',
              disabilityType: learnerInfo.learnerWithDisability?.disabilityType || []
            },
            indigenousCommunity: {
              isMember: learnerInfo.indigenousCommunity?.isMember === 'Yes',
              name:     learnerInfo.indigenousCommunity?.name || ''
            },
            fourPs: {
              isBeneficiary: learnerInfo.fourPs?.isBeneficiary === 'Yes',
              householdId:   learnerInfo.fourPs?.householdId || ''
            },
          },

          address: {
            current:   address.current,
            permanent: address.permanent
          },

          parentGuardianInfo: {
            father:   normalizeParent(parentGuardianInfo.father),
            mother:   normalizeParent(parentGuardianInfo.mother),
            guardian: normalizeParent(parentGuardianInfo.guardian)
          },

          schoolHistory: {
            returningLearner:        schoolHistory.returningLearner,
            lastGradeLevelCompleted: schoolHistory.lastGradeLevelCompleted,
            lastSchoolYearCompleted: schoolHistory.lastSchoolYearCompleted,
            lastSchoolAttended:      normalizeName(schoolHistory.lastSchoolAttended),
            schoolId:                schoolHistory.schoolId
          },

          seniorHigh: {
            semester: activeSchoolYear.semester,
            track:    seniorHigh.track,
            strand:   seniorHigh.strand
          },

          requiredDocuments,
          psaNo: psaNo || null,
        }
      },
      { new: true }
    );



    const { id: accountId, role } = req.account;
    const studentName = `${normalizeName(learnerInfo.firstName)} ${normalizeName(learnerInfo.lastName)}`;
    
    await createLogs(
      accountId,
      role,
      'UPDATE APPLICANT',
      `Updated applicant: ${studentName} (${gradeLevelToEnroll})`,
      'Success'
    );

    return res.status(200).json({
      success: true,
      message: 'Applicant updated successfully.'
    });

  } catch (error) {
    console.error('Update_Applicant error:', error);
    return res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
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
                        <h2>Francisco Osorio Integrated Senior High School</h2>
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




export const ApplicantApproval = async (req, res) => {
  try {
    const { enrollmentId } = req.body;
    
    
    const activeSchoolYear = await SchoolYear.findOne({ isCurrent: true });
    
    if (!activeSchoolYear) {
      return res.status(400).json({ message: "No active school year." });
    }

    // 1. Find the enrollment applicant
    const applicant = await Enrollment.findOne({ _id: enrollmentId });
    


    if (!applicant) {
      return res.status(404).json({ message: "Applicant not found." });
    }

    // 2. Generate student number (SEQUENTIAL, hindi na ma-duplicate)
    const gradeNumber = parseInt(applicant.gradeLevelToEnroll.replace(/\D/g, ""), 10);
    const year = new Date().getFullYear();

    // ✅ UPDATED: Kumuha ng last student number
    const lastStudent = await Student.findOne({ 
      studentNumber: new RegExp(`^${year}-`) 
    })
      .sort({ studentNumber: -1 })
      .select('studentNumber');

    let nextNumber = 1;

    if (lastStudent) {
      const lastNumber = parseInt(lastStudent.studentNumber.split('-')[1]);
      nextNumber = lastNumber + 1;
    }

    const studentNumber = `${year}-${String(nextNumber).padStart(4, "0")}`;

    // 3. CHECK DUPLICATE: studentNumber
    const existingStudentNumber = await Student.findOne({ studentNumber });
    
    if (existingStudentNumber) {
      return res.status(409).json({
        message: "Student Number already exists. Please try again."
      });
    }

    // 4. CHECK DUPLICATE: LRN
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

    // Default password setup
    const defaultPass = Math.random().toString(36).slice(-6);
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(defaultPass, salt);

    await Student.create({
      schoolYear: activeSchoolYear._id,

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
      semester: applicant.seniorHigh.semester,
      password: hashedPass,
      enrollmentYear: applicant.schoolYear,
      isFirstLogin: true
    });
        

    applicant.status = "approved";
    await applicant.save();
    
    const studentName = `${applicant.learnerInfo?.firstName} ${applicant.learnerInfo?.lastName}`;



    const { id: accountId, role } = req.account;
    await createLogs(
      accountId,
      role,
      'APPROVE APPLICANT',
      `Approved applicant: ${studentName} — Student No: ${studentNumber} (${applicant.gradeLevelToEnroll})`,
      'Success'
    );

    sendStudentAccount(applicant.learnerInfo.email, studentNumber, defaultPass, studentName)
      .catch(err => console.log("Email sending failed: ", err));

    io.emit("new-approve", { message: "new approve applicant." });
    res.status(200).json({ message: "Applicant approved successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




export const revertToPending = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Find enrollment muna para makuha yung email/lrn ng applicant
    const enrollment = await Enrollment.findById(id);
    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found." });
    }

    // ✅ Delete matching student record (match by email — unique identifier)
    const email = enrollment.learnerInfo?.email;
    const lrn = enrollment.learnerInfo?.lrn;


    if (email) {
      await Student.findOneAndDelete({ email });
    } else if (lrn && lrn !== 'N/A') {
      // Fallback — LRN kung walang email match
      await Student.findOneAndDelete({ lrn });
    }

    // ✅ Revert enrollment status back to pending
    await Enrollment.findByIdAndUpdate(
      id,
      { $set: { status: "pending" } }
    );

    const { id: accountId, role } = req.account;
    const studentName = `${enrollment.learnerInfo?.firstName} ${enrollment.learnerInfo?.lastName}`;

    await createLogs(
      accountId,
      role,
      'REVERT APPLICANT',
      `Reverted to pending: ${studentName} (${enrollment.gradeLevelToEnroll})`,
      'Success'
    );

    io.emit("student-reverted", { email });
    

    return res.status(200).json({ message: "Reverted to pending successfully." });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};




export const getEnrollmentByToken = async (req, res) => {
  try {
    const { token } = req.params;

    // ✅ Find enrollment by token
    const enrollment = await Enrollment.findOne({ 
      updateToken: token 
    });

    // ✅ Token not found
    if (!enrollment) {
      return res.status(404).json({ 
        message: "Invalid or expired link. Please contact the school registrar." 
      });
    }

    // ✅ Check if token is expired
    if (new Date() > new Date(enrollment.updateTokenExpiry)) {
      return res.status(400).json({ 
        message: "This link has already expired. Please contact the school registrar." 
      });
    }

    // ✅ Return enrollment data para sa prefill
    return res.status(200).json({
      success: true,
      data: enrollment
    });

  } catch (error) {
    console.error("getEnrollmentByToken error:", error);
    return res.status(500).json({ message: error.message });
  }
};




export const bulkApproveApplicants = async (req, res) => {
  try {
    const { enrollmentIds } = req.body;

    if (!enrollmentIds || !Array.isArray(enrollmentIds) || enrollmentIds.length === 0) {
      return res.status(400).json({ message: "No applicants selected." });
    }

    const activeSchoolYear = await SchoolYear.findOne({ isCurrent: true });
    if (!activeSchoolYear) {
      return res.status(400).json({ message: "No active school year." });
    }

    const results = { success: [], failed: [] };

    for (const enrollmentId of enrollmentIds) {
      try {
        const applicant = await Enrollment.findById(enrollmentId);
        if (!applicant) {
          results.failed.push({ enrollmentId, reason: "Applicant not found." });
          continue;
        }

        // Generate student number
        const year = new Date().getFullYear();
        const lastStudent = await Student.findOne({
          studentNumber: new RegExp(`^${year}-`)
        }).sort({ studentNumber: -1 }).select('studentNumber');

        let nextNumber = 1;
        if (lastStudent) {
          const lastNumber = parseInt(lastStudent.studentNumber.split('-')[1]);
          nextNumber = lastNumber + 1;
        }

        const studentNumber = `${year}-${String(nextNumber).padStart(4, "0")}`;

        // Duplicate checks
        const existingStudentNumber = await Student.findOne({ studentNumber });
        if (existingStudentNumber) {
          results.failed.push({ enrollmentId, reason: "Duplicate student number." });
          continue;
        }

        const lrnValue = applicant.learnerInfo.lrn?.trim();
        const isValidLRN = lrnValue && lrnValue !== '' &&
          lrnValue.toLowerCase() !== 'n/a' &&
          lrnValue !== 'null' && lrnValue !== 'undefined';

        if (isValidLRN) {
          const existingLRN = await Student.findOne({ lrn: lrnValue });
          if (existingLRN) {
            results.failed.push({ enrollmentId, reason: "LRN already exists." });
            continue;
          }
        }

        // Create student
        const defaultPass = Math.random().toString(36).slice(-6);
        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(defaultPass, salt);

        const gradeNumber = parseInt(applicant.gradeLevelToEnroll.replace(/\D/g, ""), 10);

        await Student.create({
          schoolYear: activeSchoolYear._id,
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
          semester: applicant.seniorHigh.semester,
          password: hashedPass,
          enrollmentYear: applicant.schoolYear,
          isFirstLogin: true
        });

        // Update status
        applicant.status = "approved";
        await applicant.save();

        // Send email (fire and forget)
        const studentName = `${applicant.learnerInfo.firstName} ${applicant.learnerInfo.lastName}`;
        sendStudentAccount(applicant.learnerInfo.email, studentNumber, defaultPass, studentName)
          .catch(err => console.error("Email failed:", err));

        results.success.push(enrollmentId);

      } catch (err) {
        console.error(`Error approving ${enrollmentId}:`, err.message);
        results.failed.push({ enrollmentId, reason: err.message });
      }
    }


    const { id: accountId, role } = req.account;
    await createLogs(
      accountId,
      role,
      'BULK APPROVE APPLICANT',
      `Bulk approved ${results.success.length} applicant(s), ${results.failed.length} failed`,
      'Success'
    );
    

    io.emit("new-approve", { message: "bulk approve done." });

    return res.status(200).json({
      message: `${results.success.length} approved, ${results.failed.length} failed.`,
      ...results
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};





