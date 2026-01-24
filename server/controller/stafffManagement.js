import Admin from "../model/admin.js";
import Staff from "../model/staff.js";
import Student from "../model/student.js";





export const createFacultyMember = async (req, res) => {
    try {
        const { firstName, middleName, lastName, email, password } = req.body;

        // Check if email already exists
        const student = await Student.findOne({ email });
        const staff = await Staff.findOne({ email });
        const admin = await Admin.findOne({ email });
        

        if(admin || staff || student) {
            return res.status(409).json({ message: "Email already exists"});
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create staff account
        await Staff.create({
            firstName, 
            middleName,
            lastName, 
            email, 
            password: hashedPassword 
        });

        return res.status(200).json({ message: "Faculty member registered successfully."});
        
    } catch (error) {
        return res.status(500).json({ message: error.message});
    }
}




export const getStaffList = async (req, res) => {
    try {
        // Fetch all staff, exclude password field
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
        const { firstName, middleName, lastName, email } = req.body;

        // Validate input
        if (!firstName || !middleName || !lastName || !email) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }


        // Update staff
        const updatedStaff = await Staff.findByIdAndUpdate(
            id,
            { 
                firstName: firstName.trim(),
                middleName: middleName.trim(),
                lastName: lastName.trim(),
                email: email.toLowerCase().trim()
            },
            { 
                new: true, // Return updated document
                runValidators: true // Run model validators
            }
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

        
        // Find and delete staff
        const deletedStaff = await Staff.findByIdAndDelete(id);

        if (!deletedStaff) {
            return res.status(404).json({ message: "Staff member not found" });
        }

        return res.status(200).json({ message: "Staff member deleted successfully" });
        
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
