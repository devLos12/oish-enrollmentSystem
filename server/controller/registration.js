import Staff from "../model/staff.js";
import Student from "../model/student.js";
import AccessCode from "../model/accessCode.js"
import bcrypt from "bcrypt";
import Admin from "../model/admin.js";



const validateAccessCode = async (code) => {
    const access = await AccessCode.findOne({ code });

    if (!access) throw new Error("Invalid Verification Code");
    if (access.isUsed) throw new Error("Code already used");
    if (access.expiresAt < new Date()) throw new Error("Code expired");
    
    return access; // return the access code if valid
};



export const StaffRegistration = async (req, res) => {
    try {
        const { verificationCode, firstName, middleName, lastName, suffix, email, password } = req.body;

        // Validate access code
        await validateAccessCode(verificationCode);


        // // Validate suffix
        // const validSuffixes = ['', 'Jr.', 'Sr.', 'II', 'III', 'IV', 'V', 'MD', 'PhD', 'Esq.', 'CPA'];
        // if (suffix && !validSuffixes.includes(suffix.trim())) {
        //     return res.status(400).json({ message: "Invalid suffix. Accepted values: Jr., Sr., II, III, IV, V, MD, PhD, Esq., CPA" });
        // }

        const student = await Student.findOne({ email });
        const staff = await Staff.findOne({ email });
        const admin = await Admin.findOne({ email });

        if(admin || staff || student) {
            return res.status(409).json({ message: "Account already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await Staff.create({
            firstName, 
            middleName,
            lastName,
            suffix: suffix || '',
            email, 
            password: hashedPassword 
        });
        
        await AccessCode.findOneAndUpdate(
            { code: verificationCode }, 
            { isUsed: true }, 
            { new: true }
        );

        return res.status(200).json({ message: "Registered successfully." });
        
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}
