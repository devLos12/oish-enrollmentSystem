import mongoose from "mongoose";


const StaffSchema = new mongoose.Schema({
    imageFile: {
        type: String,
        required: false
    },
    publicId:{
        type: String, 
        required: false,
    },

    firstName: {
        type: String,
        required: true
    },
     
    middleName:{
        type: String,
        required: false
    },

    lastName: {
        type: String,
        required: true
    },

    suffix: {
        type: String,
        required: false
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