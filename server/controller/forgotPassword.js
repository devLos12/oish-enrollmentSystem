import Student from "../model/student.js";
import Staff from "../model/staff.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";





const verificationCodes = new Map();



const sendVerificationEmail = async (email, code ) => {
    
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        })

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Verification Code',
            html: `
                <h2>Password Reset Request</h2>
                <p>Your verification code is:</p>
                <h1 style="color: red; font-size: 32px;">${code}</h1>
                <p>This code will expire in 5 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        };

        await transporter.sendMail(mailOptions);  
        return { success: true }
        
    } catch (error) {
        console.error("Email sending failed:", error.message);
        return { success: false };
    }

}


export const requestCode = async (req, res) => {
    try {
        const { email } = req.body;


        let account = '';

        account = await Student.findOne({ email });

        if(!account) {
            account = await Staff.findOne({ email });
        }

        if(!account) return res.status(404).json({ message: "User not found!"});

         // 2. Generate 6-digit verification code
        const verificationCode = crypto.randomInt(100000, 999999).toString();
        const setOption = {
            code: verificationCode,
            expiresAt: Date.now() + 1 * 60 * 1000 
        }
        
        verificationCodes.set(email, setOption);
        const sendEmail = await sendVerificationEmail(email, verificationCode);
        if(!sendEmail.success) return res.status(404).json({ message: "Gmail Account is not existed." });

        
        const resData = {   
            message: "Verification code sent to your email!",
            cooldown: setOption?.expiresAt
        }
        

        res.status(200).json(resData);
    } catch (error) {
        res.status(500).json({ message:  error.message});
    }
}




export const verifyCode = async(req, res) => {

    try {

        const { email, verifyCode } = req.body;


        const stored = verificationCodes.get(email);

        if(!stored){
            return res.status(400).json({message: "No verification code found."})
        }

        if (Date.now() > stored.expiresAt) {
            verificationCodes.delete(email);
            return res.status(400).json({ message: "Verification code expired" });
        }

        if (stored.code !== verifyCode ) {
            return res.status(400).json({ message: "Invalid verification code" });
        }


        res.status(200).json({ message: "Code Verified Successfully."});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}




export const changePassword = async(req, res) => {
    try {
        const {email,  newPassword, confirmPassword} = req.body;

        let account = {};

        account = await Student.findOne({ email });
        
        if(!account){
            account = await Staff.findOne({ email });
        }
        
        if(newPassword !== confirmPassword){
            return res.status(400).json({ message: "Passwords do not match" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        account.password = hashedPassword;
        await account.save();
        
        res.status(200).json({ message: "password changed successfully."});
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}