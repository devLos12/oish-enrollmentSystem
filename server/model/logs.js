import mongoose from "mongoose";

const LogsSchema = new mongoose.Schema({
    participantId: { 
        type: mongoose.Schema.Types.ObjectId, 
        refPath: "role",
        required: false, 
    },
    participantName: { 
        type: String,
        required: true
    },
    role: { 
        type: String, 
        enum: ['admin', 'staff'],
        required: true
    },
    action: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    Date: {
        type: String,
        default: function() {
            return new Date().toLocaleDateString('en-CA', {  // ✅ en-US → en-CA
                timeZone: 'Asia/Manila'                       // ✅ dagdag para consistent sa PH time
            });
            // output: "2026-06-16" (YYYY-MM-DD)
        }
    },
    time: {
        type: String,
        default: function(){
            return new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: 'Asia/Manila'   // ✅ dagdag din dito para PH time
            })
        }
    },
    status: {
        type: String
    },
});

const Logs = mongoose.model("Log", LogsSchema);
export default Logs;