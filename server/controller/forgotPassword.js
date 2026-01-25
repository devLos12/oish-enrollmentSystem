import Student from "../model/student.js";
import Staff from "../model/staff.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { Resend } from 'resend';

const verificationCodes = new Map();
const resend = new Resend(process.env.RESEND_API_KEY);

const sendVerificationEmail = async (email, code) => {
    try {
        const emailTemplate = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #f4f4f4;
                    }
                    .email-container {
                        background-color: white;
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
                        color: white;
                        padding: 40px 20px;
                        text-align: center;
                        position: relative;
                    }
                    .logo-wrapper {
                        display: inline-block;
                        width: 100px;
                        height: 100px;
                        background-color: white;
                        border-radius: 50%;
                        padding: 15px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                        margin-bottom: 20px;
                    }
                    .header-image {
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                        border-radius: 50%;
                    }
                    .header h2 {
                        margin: 0;
                        padding: 0;
                        font-size: 24px;
                        font-weight: 600;
                    }
                    .content {
                        background-color: #ffffff;
                        padding: 40px 30px;
                    }
                    .title {
                        font-size: 22px;
                        color: #dc3545;
                        margin-bottom: 20px;
                        font-weight: 600;
                    }
                    .code-box {
                        background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
                        padding: 30px 20px;
                        margin: 30px 0;
                        border-radius: 12px;
                        text-align: center;
                        border: 2px solid #28a745;
                        box-shadow: 0 4px 12px rgba(40,167,69,0.15);
                    }
                    .code-label {
                        font-size: 14px;
                        color: #155724;
                        margin-bottom: 15px;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        font-weight: 600;
                    }
                    .code {
                        font-size: 36px;
                        font-weight: 700;
                        color: #28a745;
                        letter-spacing: 5px;
                        font-family: 'Courier New', monospace;
                        background-color: white;
                        padding: 15px 25px;
                        border-radius: 8px;
                        display: inline-block;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    }
                    .expiry-notice {
                        background-color: #fff3cd;
                        border-left: 4px solid #ffc107;
                        padding: 15px 20px;
                        margin: 25px 0;
                        border-radius: 4px;
                    }
                    .expiry-notice p {
                        margin: 5px 0;
                        color: #856404;
                        font-size: 14px;
                    }
                    .expiry-notice strong {
                        color: #664d03;
                    }
                    .security-note {
                        background-color: #f8f9fa;
                        padding: 20px;
                        margin: 25px 0;
                        border-radius: 5px;
                        border: 1px solid #dee2e6;
                    }
                    .security-note p {
                        margin: 8px 0;
                        color: #495057;
                        font-size: 14px;
                        line-height: 1.6;
                    }
                    .security-note strong {
                        color: #212529;
                    }
                    .footer {
                        text-align: center;
                        padding: 25px 30px;
                        background-color: #f8f9fa;
                        border-top: 1px solid #dee2e6;
                        font-size: 12px;
                        color: #6c757d;
                    }
                    .footer p {
                        margin: 5px 0;
                    }
                    
                    /* Mobile Responsive */
                    @media only screen and (max-width: 600px) {
                        body {
                            padding: 10px;
                        }
                        .content {
                            padding: 30px 20px;
                        }
                        .header h2 {
                            font-size: 20px;
                        }
                        .title {
                            font-size: 20px;
                        }
                        .code {
                            font-size: 28px;
                            letter-spacing: 3px;
                            padding: 12px 20px;
                        }
                        .code-box {
                            padding: 25px 15px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <div class="logo-wrapper">
                            <img src="${process.env.CLOUDINARY_STATIC_IMAGE}" 
                                 alt="School Logo" 
                                 class="header-image">
                        </div>
                        <h2>Francisco Osorio Integrated Senior High School</h2>
                    </div>
                    
                    <div class="content">
                        <h1 class="title">Password Reset Request</h1>
                        
                        <p>We received a request to reset your password. Use the verification code below to proceed:</p>
                        
                        <div class="code-box">
                            <div class="code-label">Your Verification Code</div>
                            <div class="code">${code}</div>
                        </div>
                        
                        <div class="expiry-notice">
                            <p><strong>⏱️ Important:</strong> This code will expire in <strong>5 minutes</strong>.</p>
                        </div>
                        
                        <div class="security-note">
                            <p><strong>🔒 Security Reminder:</strong></p>
                            <p>• Never share this code with anyone</p>
                            <p>• If you didn't request this password reset, please ignore this email</p>
                            <p>• Your password will remain unchanged unless you use this code</p>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>This is an automated message. Please do not reply to this email.</p>
                        <p>&copy; ${new Date().getFullYear()} School Management System. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const { data, error } = await resend.emails.send({
            from: `Francisco Osorio SHS <security${process.env.EMAIL_DOMAIN}>`,
            to: email,
            subject: 'Password Reset Verification Code',
            html: emailTemplate,
        });

        if (error) {
            console.error("Verification email sending failed:", error);
            return { success: false, error };
        }

        return { success: true, data };
        
    } catch (error) {
        console.error("Verification email sending failed:", error.message);
        return { success: false, error: error.message };
    }
};












export const requestCode = async (req, res) => {
    try {
        const { email } = req.body;

        let account = await Student.findOne({ email });

        if (!account) {
            account = await Staff.findOne({ email });
        }

        if (!account) {
            return res.status(404).json({ message: "User not found!" });
        }

        // Generate 6-digit verification code
        const verificationCode = crypto.randomInt(100000, 999999).toString();
        const setOption = {
            code: verificationCode,
            expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
        };
        
        verificationCodes.set(email, setOption);
        
        const sendEmail = await sendVerificationEmail(email, verificationCode);
        
        if (!sendEmail.success) {
            return res.status(500).json({ message: "Failed to send verification email." });
        }

        const resData = {   
            message: "Verification code sent to your email!",
            cooldown: setOption.expiresAt
        };

        res.status(200).json(resData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const verifyCode = async (req, res) => {
    try {
        const { email, verifyCode } = req.body;

        const stored = verificationCodes.get(email);

        if (!stored) {
            return res.status(400).json({ message: "No verification code found." });
        }

        if (Date.now() > stored.expiresAt) {
            verificationCodes.delete(email);
            return res.status(400).json({ message: "Verification code expired" });
        }

        if (stored.code !== verifyCode) {
            return res.status(400).json({ message: "Invalid verification code" });
        }

        res.status(200).json({ message: "Code verified successfully." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;

        let account = await Student.findOne({ email });
        
        if (!account) {
            account = await Staff.findOne({ email });
        }

        if (!account) {
            return res.status(404).json({ message: "User not found!" });
        }
        
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        account.password = hashedPassword;
        await account.save();
        
        // Clean up verification code after successful password change
        verificationCodes.delete(email);
        
        res.status(200).json({ message: "Password changed successfully." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};