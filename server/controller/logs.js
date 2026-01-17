import Logs from "../model/logs.js";



export const getLogs = async (req, res) => {
    try {
        

        const logs = await Logs.find().sort({ createdAt: -1 });
        if(!logs || logs.length === 0){
            return res.status(200).json({ message: "Empty logs."});
        }

        return res.status(200).json(logs);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
    
}