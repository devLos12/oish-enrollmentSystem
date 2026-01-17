import mongoose from "mongoose";


const LogsSchema = new mongoose.Schema({
    participantId: { 
        type: mongoose.Schema.Types.ObjectId, 
        refPath: "role",
        requried: true, 
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
    time: {
        type: String,
        default: function(){
            return new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            })
        }
    },
   
    Date: {
        type: String,
        default: function() {
            return new Date().toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric'
            }).replace(/\//g, '-');
        }
    },
     status: {
        type: String
    },

})

const Logs = mongoose.model("Log", LogsSchema);
export default Logs;