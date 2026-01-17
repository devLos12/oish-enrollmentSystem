import Logs from "../model/logs.js";
import Staff from "../model/staff.js";



const createLogs = async (id, role) => {

    let name = "Admin";

    // Fetch staff only if role is "Staff"
    if (role === "staff") {
        const staff = await Staff.findById(id);
        if (staff) {
            name = `${staff.firstName} ${staff.lastName}`;
        }
    }
    await Logs.create({
        participantId: id,
        participantName: name,
        role: role,
        status: "Logged Out"
    });
};


export const Logout = async (req, res) => {
    try {
        const { id, role } = req.account;

        await createLogs(id, role);

        res.clearCookie("accessToken", { path: "/" });
        res.status(200).json({ message: "Logout successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

export const studentLogout = async(req, res) => {
    try {
        res.clearCookie("accessToken", { path: "/" });
        res.status(200).json({ message: "Logout successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
} 