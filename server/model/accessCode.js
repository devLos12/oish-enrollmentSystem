import mongoose from "mongoose";

const AccessCodeSchema = new mongoose.Schema({
    code: {
        type: Number,
        required: true,
        unique: true
    },
    isUsed: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    usedBy: {
        firstName:  { type: String, default: null },
        middleName: { type: String, default: null },
        lastName:   { type: String, default: null },
        email:      { type: String, default: null },
    },
    usedAt: { type: Date, default: null },

}, { timestamps: true }); // ← createdAt = "Generated At" sa logs


const AccessCode = mongoose.model("AccessCode", AccessCodeSchema);
export default AccessCode;