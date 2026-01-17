import mongoose, { Types } from "mongoose";


const AccessCodeSchema = new mongoose.Schema({
    code: {
        type: Number,
        requred: true,
        unique: true
    },

    isUsed: {
        type: Boolean,
        default: false
    },

    expiresAt: {
        type: Date,
        requred: true,
        index: { expires: 0 } // TTL index      
    }
    
})

const AccessCode = mongoose.model("AccessCode", AccessCodeSchema);
export default AccessCode;