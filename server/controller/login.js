import Admin from "../model/admin.js";
import Staff from "../model/staff.js";
import Student from "../model/student.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createLogs } from "./logs.js"; // shared helper na



const CreateCookie = (res, account, role) => {
    const accessToken = jwt.sign(
        { id: account?._id, role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_SECRET_EXPIRESIN }
    );

    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];
    const isLocal = allowedOrigins.some(origin => 
        origin.includes('localhost') || origin.startsWith('http://')
    );

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: !isLocal,
        sameSite: 'lax',
        path: "/",
    });
}

const LoginPortal = async(req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ 
                field: 'identifier',
                message: "Please provide email/student number and password" 
            });
        }

        let account = null;
        let role = '';
        const isEmail = identifier.includes('@');

        if (isEmail) {
            account = await Admin.findOne({ email: identifier });
            if (account) {
                role = "admin";
            } else {
                account = await Staff.findOne({ email: identifier });
                if (account) role = "staff";
                else {
                    account = await Student.findOne({ email: identifier });
                    if (account) role = "student";
                }
            }

            if (!account) {
                // ✅ Log failed — email not found (admin default kasi di pa alam kung sino)
                await createLogs(
                    null,
                    'admin',
                    'LOGIN FAILED',
                    `Failed login attempt: ${identifier} (email not found)`,
                    'Failed' 
                    
                );
                return res.status(401).json({ 
                    field: 'identifier',
                    message: "Invalid email." 
                });
            }

        } else {
            account = await Student.findOne({ studentNumber: identifier });
            if (!account) {
                return res.status(401).json({ 
                    field: 'identifier',
                    message: "Invalid student number." 
                });
            }
            role = "student";
        }

        const isMatch = await bcrypt.compare(password, account.password);

        if (!isMatch) {
            // ✅ Log failed — wrong password (may account na, alam na ang role)
            if (role === "admin" || role === "staff") {
                const name = account?.firstName
                    ? `${account.firstName} ${account.lastName}`
                    : account?.name || "Admin";

                await createLogs(
                    account._id,
                    role,
                    'LOGIN FAILED',
                    `${name} (${identifier}) entered wrong password`,
                    'Failed' 
                );
            }
            return res.status(401).json({ 
                field: 'password',
                message: "Invalid password." 
            });
        }

        const name = account?.firstName 
            ? `${account.firstName} ${account.lastName}`
            : account?.name || "Admin";

        // ✅ Log successful login
        if (role === "admin" || role === "staff") {
            await createLogs(
                account._id,
                role,
                'LOGIN',
                `${name} (${identifier}) logged in successfully`,
                'Success'
            );
        }

        CreateCookie(res, account, role);
        
        return res.status(200).json({ 
            message: "Successfully logged in!", 
            role,
            isFirstLogin: role === 'student' ? account.isFirstLogin : false 
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