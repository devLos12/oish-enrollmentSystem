import { createLogs } from "./logs.js";
import Admin from "../model/admin.js";
import Staff from "../model/staff.js";

export const Logout = async (req, res) => {
    try {
        const { id, role } = req.account;

        let name = "Admin";
        if (role === "staff") {
            const staff = await Staff.findById(id);
            if (staff) name = `${staff.firstName} ${staff.lastName}`;
        } else if (role === "admin") {
            const admin = await Admin.findById(id);
            if (admin) name = admin.name || "Admin";
        }

        
        await createLogs(
            id,
            role,
            'LOGOUT',
            `${name} logged out successfully`,
            'Success'
        );

        res.clearCookie("accessToken", { path: "/" });
        res.status(200).json({ message: "Logout successfully" });
    } catch (error) {
        console.error(error);
        
        await createLogs(
            req.account?.id || null,
            req.account?.role || 'admin',
            'LOGOUT',
            `Logout failed due to an error`,
            'Failed'
        );
        
        res.status(500).json({ message: error.message });
    }
};

export const studentLogout = async (req, res) => {
    try {
        res.clearCookie("accessToken", { path: "/" });
        res.status(200).json({ message: "Logout successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};