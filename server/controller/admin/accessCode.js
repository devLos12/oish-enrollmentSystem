import AccessCode from "../../model/accessCode.js";
import Staff from "../../model/staff.js";
import nodemailer from "nodemailer";




const sendVerificationEmail = async (email, code ) => {
    
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
        subject: 'Code Registration',
        html: `
            <h2>Code Registration Request</h2>
            <p>Your code registraion is:</p>
            <h1 style="color: #28a745; font-size: 32px;">${code}</h1>
            <p>This code will expire in 1 hr.</p>
            <p>If you didn't request this, please ignore this email.</p>
        `
    };

    await transporter.sendMail(mailOptions);    
}



export const accessGeneratedCode = async(req, res)=> {
    
    try {   

        const code = Math.floor(100000 + Math.random() * 900000); // 6-digit numeric
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // expires in 1 hour

        await AccessCode.create({ code, expiresAt });

        const resData = {
            message: "code generated successfully",
            code: code,
            expiresAt
        }
        
        res.status(200).json(resData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

}



export const accessGmailCode = async (req, res) => {

    try {
        const { email } = req.body;
        
        const staff = await Staff.findOne({ email });

        if(!staff) return res.status(404).json({ message: "User not found!"});
        
        const code = Math.floor(100000 + Math.random() * 900000); // 6-digit numeric
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // expires in 1 hour

        await AccessCode.create({ code, expiresAt });
        await sendVerificationEmail(email, code);

        const resData = {
            message: "Verification code sent to your email!",
            code: code,
            expiresAt
        }

        res.status(200).json(resData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
    
}
