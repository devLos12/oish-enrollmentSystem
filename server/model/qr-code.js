import mongoose from "mongoose";


const qrCodeSchema = new mongoose.Schema({
    targetUrl: { 
        type: String,
        required: true
    },
    cloudinaryUrl: {
        type: String,
        required: true
    },
    publicId: { 
        type: String,
        required: true
    } 

}, { timestamps: true });

const QrCodeModel = mongoose.model('qrcodemodel', qrCodeSchema);
export default QrCodeModel;



