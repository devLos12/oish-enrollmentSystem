import mongoose from "mongoose";

const programSchema = new mongoose.Schema({

    trackName: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true 
    },
    
    strands: [
        {
            strandName: { 
                type: String, 
                required: true, 
                trim: true 
            },
            isActive: { 
                type: Boolean, 
                default: true 
            }
        }
    ],
    isActive: { type: Boolean, default: true }

}, { timestamps: true });

const Program = mongoose.model("Program", programSchema);
export default Program;