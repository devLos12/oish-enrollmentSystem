import Staff from "../model/staff.js";
import Student from "../model/student.js";
import AccessCode from "../model/accessCode.js"
import bcrypt from "bcrypt";
import Admin from "../model/admin.js";
import Enrollment from '../model/enrollment.js';




const normalizeName = (value) => {
    if (!value || value === 'N/A') return value;
    return value.trim().toUpperCase();
};



const validateAccessCode = async (code) => {
    const access = await AccessCode.findOne({ code });

    if (!access) throw new Error("Invalid Verification Code");
    if (access.isUsed) throw new Error("Code already used");
    if (access.expiresAt < new Date()) throw new Error("Code expired");
    
    return access; // return the access code if valid
};



export const StaffRegistration = async (req, res) => {
    try {
        const { verificationCode, firstName, middleName, lastName, suffix, email, contact, password } = req.body;


        // Validate access code
        await validateAccessCode(verificationCode);


        // Validate suffix
        const validSuffixes = ['', 'jr.', 'Jr.', 'Sr.', 'II', 'III', 'JR', 'SR.'];
        if (suffix && !validSuffixes.includes(suffix.trim())) {
            return res.status(400).json({ message: "Invalid suffix. Accepted values: Jr., Sr., II, III" });
        }



        const student = await Student.findOne({ email });
        const staff = await Staff.findOne({ email });
        const admin = await Admin.findOne({ email });

        if(admin || staff || student) {
            return res.status(409).json({ message: "Account already exists" });
        }



        const existingStudentContact = await Student.findOne({ contactNumber: contact });
        const existingStaffContact = await Staff.findOne({ contact: contact });

        if (existingStudentContact || existingStaffContact) {
            return res.status(409).json({ message: "Contact number already in use." });
        }




        // ✅ VALIDATION: Same firstName + lastName + middleName not allowed in Enrollment
        const existingApplicant = await Enrollment.findOne({
          "learnerInfo.firstName": normalizeName(firstName),
          "learnerInfo.lastName":  normalizeName(lastName),
          "learnerInfo.middleName": normalizeName(middleName?.trim() || 'N/A'),
        });
        if (existingApplicant) {
          return res.status(409).json({
            message: "Full name already exists."
          });
        }


        const existingApplicant2 = await Enrollment.findOne({
          "learnerInfo.firstName": normalizeName(firstName),
          "learnerInfo.lastName":  normalizeName(lastName),
        });
        if (existingApplicant2) {
          return res.status(409).json({
            message: "Full name already exists."
          });
        }



        // ✅ VALIDATION: Same firstName + lastName + middleName not allowed in Staff
        const staffQuery = {
          firstName: { $regex: new RegExp(`^${firstName.trim()}$`, 'i') },
          lastName:  { $regex: new RegExp(`^${lastName.trim()}$`, 'i') },
        };
        const incomingMiddleName = middleName?.trim();
        if (incomingMiddleName) {
          staffQuery.middleName = { $regex: new RegExp(`^${incomingMiddleName}$`, 'i') };
        } else {
          staffQuery.$or = [
            { middleName: { $exists: false } },
            { middleName: null },
            { middleName: '' },
            { middleName: 'N/A' },
          ];
        }
        const existingStaff = await Staff.findOne(staffQuery);
        if (existingStaff) {
          return res.status(409).json({
            message: "Full name already exists."
          });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        
        await Staff.create({
            firstName: normalizeName(firstName),
            middleName: normalizeName(middleName?.trim() || 'N/A'),
            lastName: normalizeName(lastName),
            suffix: normalizeName(suffix) || '',
            email, 
            contact,
            password: hashedPassword 
        });
        

        await AccessCode.findOneAndUpdate(
            { code: verificationCode }, 
            { 
                isUsed: true,
                usedAt: new Date(),
                usedBy: {
                    firstName:  normalizeName(firstName),
                    middleName: normalizeName(middleName?.trim() || 'N/A'),
                    lastName:   normalizeName(lastName),
                    email:      email,
                }
            }, 
            { new: true }
        );


        return res.status(200).json({ message: "Registered successfully." });
        
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}
