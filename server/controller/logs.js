import Logs from "../model/logs.js";
import Staff from "../model/staff.js";
import Admin from "../model/admin.js";

// Shared helper — caller always passes complete, final data
// createLogs(id, role, action, description)
// id          — ObjectId or null (failed login)
// role        — 'admin' | 'staff'
// action      — 'LOGIN' | 'LOGIN FAILED' | 'LOGOUT'
// description — complete final string, caller's responsibility
export const createLogs = async (id, role, action, description, status) => {
    let name = "Admin";

    if (role === "staff") {
        const staff = await Staff.findById(id);
        if (staff) name = `${staff.firstName} ${staff.lastName}`;
    } else if (role === "admin") {
        const admin = await Admin.findById(id);
        if (admin) name = admin.name || "Admin";
    }
    
    await Logs.create({
        participantId: id || null,
        participantName: name,
        role: role,
        action: action,
        description: description,
        status: status
    });
};



export const getLogs = async (req, res) => {
    try {
        const logs = await Logs.find();
        return res.status(200).json(logs); // ✅ Laging array, kahit empty []
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};