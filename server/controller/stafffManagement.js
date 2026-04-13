import Admin from "../model/admin.js";
import Staff from "../model/staff.js";
import Student from "../model/student.js";
import bcrypt from "bcrypt";

const validSuffixes = ['', 'Jr.', 'Sr.', 'II', 'III', 'IV', 'V', 'MD', 'PhD', 'Esq.', 'CPA'];

export const createFacultyMember = async (req, res) => {
    try {
        const { firstName, middleName, lastName, suffix, email, password } = req.body;
        

        // Validate suffix
        // if (suffix && !validSuffixes.includes(suffix.trim())) {
        //     return res.status(400).json({ message: "Invalid suffix. Accepted values: Jr., Sr., II, III, IV, V, MD, PhD, Esq., CPA" });
        // }

        const student = await Student.findOne({ email });
        const staff = await Staff.findOne({ email });
        const admin = await Admin.findOne({ email });

        if (admin || staff || student) {
            return res.status(409).json({ message: "Email already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await Staff.create({
            firstName,
            middleName,
            lastName,
            suffix: suffix || '',
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

        if (!firstName || !middleName || !lastName || !email) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        // Validate suffix
        // if (suffix && !validSuffixes.includes(suffix.trim())) {
        //     return res.status(400).json({ message: "Invalid suffix. Accepted values: Jr., Sr., II, III, IV, V, MD, PhD, Esq., CPA" });
        // }

        const updatedStaff = await Staff.findByIdAndUpdate(
            id,
            {
                firstName: firstName.trim(),
                middleName: middleName.trim(),
                lastName: lastName.trim(),
                suffix: suffix ? suffix.trim() : '',
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