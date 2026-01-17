import mongoose from "mongoose";


const StaffSchema = new mongoose.Schema({
    imageFile: {
        type: String,
        required: false
    },

    firstName: {
        type: String,
        required: true
    },
     
    lastName: {
        type: String,
        required: true
    },
    
    email: {
        type: String,
        unique: true,
        required: true
    },

    password: {
        type: String,
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

})


const Staff = new mongoose.model("Staff", StaffSchema);
export default Staff;