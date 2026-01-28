import Student from "../model/student.js";
import multer from "multer";
import bcrypt from "bcrypt";
import Section from "../model/section.js";
import Staff from "../model/staff.js";
import cloudinary from "../config/cloudinary.js";

// Helper function to upload to Cloudinary
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

// Configure multer storage to memory
const storage = multer.memoryStorage();
// Configure and export multer instance
export const updateProfile = multer({ storage: storage });





export const updateStudentProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const {
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

        // Handle profile image upload
        let profileImageUrl = student.profileImage;
        let publicId = student.publicId;

        if (req.file) {
            // Delete old image from Cloudinary if exists
            if (student.publicId) {
                try {
                    await cloudinary.uploader.destroy(student.publicId);
                } catch (err) {
                    console.error("Error deleting old profile image from Cloudinary:", err);
                }
            }

            // Upload new image to Cloudinary
            try {
                const result = await uploadToCloudinary(
                    req.file.buffer, 
                    req.file.originalname, 
                    "profiles/students"
                );
                profileImageUrl = result.secure_url;
                publicId = result.public_id;
            } catch (uploadError) {
                console.error("Error uploading to Cloudinary:", uploadError);
                return res.status(500).json({ message: "Failed to upload profile image" });
            }
        }

        // Update student profile
        await Student.findByIdAndUpdate(
            id,
            {
                profileImage: profileImageUrl,
                publicId: publicId,
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
        ).select('-password');

        res.status(200).json({message: "Profile updated successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
};


















export const UpdateProfile = async (req, res) => {
    try {
        const { id } = req.account;
        const { firstName, lastName, email } = req.body;

        // Find the staff
        const staff = await Staff.findById(id);
        if (!staff) {
            return res.status(404).json({ message: "Staff not found" });
        }

        // Update fields
        if (firstName) staff.firstName = firstName;
        if (lastName) staff.lastName = lastName;
        if (email) staff.email = email;

        // Handle profile image upload
        if (req.file) {
            // Delete old image from Cloudinary if exists
            if (staff.publicId) {
                try {
                    await cloudinary.uploader.destroy(staff.publicId);
                } catch (err) {
                    console.error("Error deleting old profile image from Cloudinary:", err);
                }
            }

            // Upload new image to Cloudinary
            try {
                const result = await uploadToCloudinary(
                    req.file.buffer, 
                    req.file.originalname, 
                    "profiles/staff"
                );
                staff.imageFile = result.secure_url;
                staff.publicId = result.public_id;
            } catch (uploadError) {
                console.error("Error uploading to Cloudinary:", uploadError);
                return res.status(500).json({ message: "Failed to upload profile image" });
            }
        }

        // Save updated staff
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
            return res.status(409).json({ message: "account not found."});
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
            return res.status(404).json({ message: "Account not found" });
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, account.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password based on account type
        if (account instanceof Student || account.constructor.modelName === 'Student') {
            await Student.findByIdAndUpdate(id, {
                password: hashedPassword
            });
        } else {
            await Staff.findByIdAndUpdate(id, {
                password: hashedPassword
            });
        }

        res.status(200).json({ message: "Password changed successfully" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Optional: Delete profile image only (keep account)
export const deleteProfileImage = async (req, res) => {
    try {
        const { id } = req.params;
        const { userType } = req.body; // "student" or "staff"

        let user;
        if (userType === "student") {
            user = await Student.findById(id);
        } else if (userType === "staff") {
            user = await Staff.findById(id);
        }

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Delete from Cloudinary
        if (user.publicId) {
            try {
                await cloudinary.uploader.destroy(user.publicId);
            } catch (err) {
                console.error("Error deleting from Cloudinary:", err);
            }
        }

        // Remove from database
        user.profileImage = "";
        user.publicId = "";
        await user.save();

        res.status(200).json({ message: "Profile image deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};