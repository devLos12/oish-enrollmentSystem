import Staff from "../model/staff.js";
import Student from "../model/student.js";
import AccessCode from "../model/accessCode.js"
import bcrypt from "bcrypt";



const validateAccessCode = async (res, code) => {
    try {
        const access = await AccessCode.findOne({ code });

        if (!access) return res.status(400).json({ message: "Invalid Verification Code" });
        if (access.isUsed) return res.status(400).json({ message: "Code already used" });
        if (access.expiresAt < new Date()) return res.status(400).json({ message: "Code expired" });
        return

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};



export const StaffRegistration = async (req, res) => {

    try {
        const { verificationCode, firstName,  lastName, email, password } = req.body;
        
        
        await validateAccessCode(res, verificationCode);
        const student = await Student.findOne({ email });
        const staff = await Staff.findOne({ email });
        
        if(staff || student ) {
            return res.status(409).json({ message: "Account already exists"});
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await Staff.create({
            firstName, lastName, email, 
            password: hashedPassword });
        
        await AccessCode.findOneAndUpdate( { code: verificationCode }, { isUsed: true }, { new: true });

        res.status(200).json({ message: "Registered successfully."});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}