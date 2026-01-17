import Staff from "../model/staff.js";


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
        const { firstName, lastName, email } = req.body;

        // Validate input
        if (!firstName || !lastName || !email) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        // Update staff
        const updatedStaff = await Staff.findByIdAndUpdate(
            id,
            { 
                firstName: firstName.trim(),
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
