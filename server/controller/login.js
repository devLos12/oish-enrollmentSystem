import Admin from "../model/admin.js";
import Staff from "../model/staff.js";
import Student from "../model/student.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Logs from "../model/logs.js";

const CreateLogs = async(id, name, role) => {
    await Logs.create({
        participantId: id,
        participantName: name,
        role: role,
        status: "Logged In"
    });
}

const CreateCookie = (res, account, role) => {
    const accessToken = jwt.sign(
        { id: account?._id, role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_SECRET_EXPIRESIN }
    );

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false,
        path: "/",
    });
}

const LoginPortal = async(req, res) => {
    try {
        const { identifier, password } = req.body;

        // Validate input
        if (!identifier || !password) {
            return res.status(400).json({ 
                field: 'identifier',
                message: "Please provide email/student number and password" 
            });
        }

        let account = null;
        let role = '';

        // Check if identifier is email (contains @) or student number
        const isEmail = identifier.includes('@');

        if (isEmail) {
            // Try to find in Admin first
            account = await Admin.findOne({ email: identifier });
            if (account) {
                role = "admin";
            } else {
                // If not admin, try Staff
                account = await Staff.findOne({ email: identifier });
                if (account) {
                    role = "staff";
                } else {
                    // If not staff, try Student with email
                    account = await Student.findOne({ email: identifier });
                    if (account) {
                        role = "student";
                    }
                }
            }

            if (!account) {
                return res.status(401).json({ 
                    field: 'identifier',
                    message: "Invalid email. " 
                });
            }

        } else {
            // Identifier is student number
            account = await Student.findOne({ studentNumber: identifier });
            
            if (!account) {
                return res.status(401).json({ 
                    field: 'identifier',
                    message: "Invalid student number. " 
                });
            }
            
            role = "student";
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, account.password);
        
        if (!isMatch) {
            return res.status(401).json({ 
                field: 'password',
                message: "Invalid password. " 
            });
        }

        // Optional: Check if account needs verification (add this if you have verification logic)
        // if (account.verificationStatus === 'pending') {
        //     return res.status(403).json({ 
        //         showModal: true,
        //         message: "Your account is pending verification. Please wait for admin approval." 
        //     });
        // }

        // Create name for logs
        const name = account?.firstName 
            ? `${account.firstName} ${account.lastName}`
            : account?.name || "Admin";

        // Create logs (only for admin/staff, optional for students)
        if (role === "admin" || role === "staff") {
            await CreateLogs(account._id, name, role);
        }

        // Create cookie and send response
        CreateCookie(res, account, role);
        
        return res.status(200).json({ 
            message: "Successfully logged in!", 
            role 
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ 
            showModal: true,
            message: error.message || "Server error occurred. Please try again later." 
        });
    }
}

export default LoginPortal;