import mongoose from "mongoose";


const emailHistorySchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    scheduledDate: { 
        type: Date, 
        required: true 
    },
    scheduledTime: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        required: true 
    },
    participantCount: { 
        type: Number, 
        required: true 
    },
    studentIds: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Student' 
    }],
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

const EmailHistory = mongoose.model('Email', emailHistorySchema);
export default EmailHistory;