import Admin from "../model/admin.js";
import Staff from "../model/staff.js";
import Student from "../model/student.js";
import bcrypt from "bcrypt";
import Enrollment from "../model/enrollment.js";



const validSuffixes = ['', 'jr.', 'Jr.', 'Sr.', 'II', 'III', 'JR.', 'SR.'];


const normalizeName = (value) => {
    if (!value || value === 'N/A') return value;
    return value.trim().toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};



export const createFacultyMember = async (req, res) => {
    try {
        const { firstName, middleName, lastName, suffix, email, password } = req.body;
        

        // Validate suffix
        if (suffix && !validSuffixes.includes(suffix.trim())) {
            return res.status(400).json({ message: "Invalid suffix. Accepted values: Jr., Sr., II, III" });
        }


        const student = await Student.findOne({ email });
        const staff = await Staff.findOne({ email });
        const admin = await Admin.findOne({ email });


        if (admin || staff || student) {
            return res.status(409).json({ message: "Email already exists" });
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
        const existingStaffName = await Staff.findOne(staffQuery);
        if (existingStaffName) {
          return res.status(409).json({
            message: "Full name already exists."
          });
        }

        // ✅ VALIDATION: Same firstName + lastName + middleName not allowed in Enrollment
        const existingApplicant = await Enrollment.findOne({
          "learnerInfo.firstName":  normalizeName(firstName),
          "learnerInfo.lastName":   normalizeName(lastName),
          "learnerInfo.middleName": normalizeName(middleName?.trim() || 'N/A'),
        });
        if (existingApplicant) {
          return res.status(409).json({
            message: "Full name already exists."
          });
        }

        const existingApplicant2 = await Enrollment.findOne({
          "learnerInfo.firstName":  normalizeName(firstName),
          "learnerInfo.lastName":   normalizeName(lastName),
        });
        if (existingApplicant2) {
          return res.status(409).json({
            message: "Full name already exists."
          });
        }



        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await Staff.create({
            firstName: firstName.trim().toUpperCase(),
            middleName: middleName?.trim().toUpperCase() || 'N/A',
            lastName: lastName.trim().toUpperCase(),
            suffix: suffix.trim().toUpperCase() || '',
            email,
            password: hashedPassword
        });


        return res.status(200).json({ message: "Faculty member registered successfully." });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};




export const getStaffList = async (req, res) => {
    try {
        const staffList = await Staff.find({}).select('-password').sort({ createdAt: -1 });

        if (!staffList || staffList.length === 0) {
            return res.status(404).json({ message: "No staff members found" });
        }

        return res.status(200).json(staffList);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};





export const updateStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, middleName, lastName, suffix, email } = req.body;

        if (!firstName || !lastName || !email) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        

        // Validate suffix
        if (suffix && !validSuffixes.includes(suffix.trim())) {
            return res.status(400).json({ message: "Invalid suffix. Accepted values: Jr., Sr., II, III" });
        }

        // ✅ VALIDATION: Same firstName + lastName + middleName not allowed in Staff (exclude current)
        const staffQuery = {
          firstName: { $regex: new RegExp(`^${firstName.trim()}$`, 'i') },
          lastName:  { $regex: new RegExp(`^${lastName.trim()}$`, 'i') },
          _id: { $ne: id }
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
        const existingStaffName = await Staff.findOne(staffQuery);
        if (existingStaffName) {
          return res.status(409).json({
            message: "Full name already exists."
          });
        }

        // ✅ VALIDATION: Same firstName + lastName + middleName not allowed in Enrollment
        const existingApplicant = await Enrollment.findOne({
          "learnerInfo.firstName":  normalizeName(firstName),
          "learnerInfo.lastName":   normalizeName(lastName),
          "learnerInfo.middleName": normalizeName(middleName?.trim() || 'N/A'),
        });
        if (existingApplicant) {
          return res.status(409).json({
            message: "An applicant with the same full name already exists."
          });
        }



        const existingApplicant2 = await Enrollment.findOne({
          "learnerInfo.firstName":  normalizeName(firstName),
          "learnerInfo.lastName":   normalizeName(lastName),
        });
        if (existingApplicant2) {
          return res.status(409).json({
            message: "Full name already exists."
          });
        }

        


        const updatedStaff = await Staff.findByIdAndUpdate(
            id,
            {
                firstName: firstName.trim().toUpperCase(),
                middleName: middleName?.trim().toUpperCase() || 'N/A',
                lastName: lastName.trim().toUpperCase(),
                suffix: suffix ? suffix.trim().toUpperCase() : '',
                email: email.toLowerCase().trim()
            },
            { new: true, runValidators: true }
        ).select('-password');




        if (!updatedStaff) {
            return res.status(404).json({ message: "Staff member not found" });
        }

        return res.status(200).json({
            message: "Staff member updated successfully",
            staff: updatedStaff
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};





export const deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedStaff = await Staff.findByIdAndDelete(id);

        if (!deletedStaff) {
            return res.status(404).json({ message: "Staff member not found" });
        }

        return res.status(200).json({ message: "Staff member deleted successfully" });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};