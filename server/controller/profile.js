import Student from "../model/student.js";
import multer from "multer";
import bcrypt from "bcrypt";
import Section from "../model/section.js";
import Staff from "../model/staff.js";




const storage  = multer.diskStorage({
    destination : "./uploads/profile",
    filename :  (req, file, cb) =>{
        const uniqueName = `${Date.now()} - ${file.originalname}`;
        cb(null, uniqueName)
    }
})
export const updateProfile = multer({ storage : storage});




export const updateStudentProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            profileImage,
            firstName,
            middleName,
            lastName,
            extensionName,
            birthDate,
            sex,
            contactNumber,
            email,
            address
        } = req.body;

        const imageFile = req.file?.filename ?? "";

        const parsedAddress = typeof address === "string" ? JSON.parse(address) : address;



        // Validation
        if (!firstName || !lastName || !birthDate || !sex || !email) {
            return res.status(400).json({ message: "Please provide all required fields: firstName, lastName, birthDate, sex, email"});
        }

        // Validate sex enum
        if (!["Male", "Female"].includes(sex)) {
            return res.status(400).json({ message: "Sex must be either 'Male' or 'Female'"});
        }

        // Check if student exists
        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).json({ message: "Student not found"});
        }

        // Check if email is already taken by another student
        if (email !== student.email) {
            const existingEmail = await Student.findOne({ 
                email, 
                _id: { $ne: id } 
            });
            
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: "Email is already taken by another student"
                });
            }
        }

        // Update student profile
        await Student.findByIdAndUpdate(
            id,
            {
                profileImage: imageFile ? imageFile : profileImage,
                firstName,
                middleName,
                lastName,
                extensionName,
                birthDate,
                sex,
                contactNumber,
                email,
                address: {
                    houseNo: parsedAddress?.houseNo || "",
                    street: parsedAddress?.street || "",
                    barangay: parsedAddress?.barangay || "",
                    municipality: parsedAddress?.municipality || "",
                    province: parsedAddress?.province || "",
                    country: parsedAddress?.country || "",
                    zipCode: parsedAddress?.zipCode || ""
                }
            },
            { 
                new: true, 
                runValidators: true 
            }
        ).select('-password'); // Exclude password from response


        
        res.status(200).json({message: "Profile updated successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
};




export const UpdateProfile = async (req, res) => {
    try {
        const { id } = req.account;
        const {firstName, lastName, email } = req.body;
        const filename = req.file?.filename ?? null;

        
        // Find the student
        const staff = await Staff.findById(id);
        if (!staff) {
            return res.status(404).json({ message: "Student not found" });
        }

        // Update fields
        if (firstName) staff.firstName = firstName;
        if (lastName) staff.lastName = lastName;
        if (email) staff.email = email;

        if(filename) {
            staff.imageFile = filename
        }

        // Save updated student
        await staff.save();

        return res.status(200).json({ message: "Successfully Updated", data: staff});
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}





export const getStudentProfile = async (req, res) => {
    try {
        const { role, id } = req.account;

        // Kunin yung student
        const student = await Student.findOne({ _id: id }).lean();
        if(!student){
            return res.status(409).json({ message: "User not found." });
        }
        // Kunin yung section gamit yung reference sa student
        const section = await Section.findOne({ name: student.section })
        .select("isOpenEnrollment isEnrolled");

        // Merge section data sa response para sa frontend  
        const studentProfile = {
            ...student,
            currentSection: section 
        }

        res.status(200).json(studentProfile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


export const getProfile = async(req, res) => {
    try {
        const { id } = req.account;


        const profile = await Staff.findOne({ _id: id });
        if(!profile){
            return res.status(409).json({ message: "account not founnd."});
        }

        return res.status(200).json(profile);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}







export const changePassword = async (req, res) => {
    try {
        const { id } = req.account;
        const { currentPassword, newPassword } = req.body;

        let account = {};

        account = await Student.findById(id);
        
        if(!account) {
            account = await Staff.findById(id)
        }

        if (!account) {
            return res.status(404).json({ message: "Student not found" });
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, account.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await Student.findByIdAndUpdate(id, {
            password: hashedPassword
        });

        res.status(200).json({ message: "Password changed successfully" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


