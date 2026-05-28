import QRCode from 'qrcode';
import cloudinary from '../config/cloudinary.js';
import QrCodeModel from '../model/qr-code.js';



export const generateQRCode = async (req, res) => {
    try {
        const { targetUrl } = req.body;

        // 1. Generate QR buffer
        const qrBuffer = await QRCode.toBuffer(targetUrl);

        // 2. Upload to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { folder: 'qrcodes', resource_type: 'image' },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(qrBuffer);
        });

        // 3. Save to MongoDB
        const qrDoc = await QrCodeModel.create({
            targetUrl,
            cloudinaryUrl: uploadResult.secure_url,
            publicId: uploadResult.public_id,
        });

        res.status(200).json({
            success: true,
            message: 'QR Code generated successfully',
            data: qrDoc
        });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
};



export const getQRCodes = async (req, res) => {
    try {
        const qrCodes = await QrCodeModel.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: qrCodes
        });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
};




export const updateQRCode = async (req, res) => {
    try {
        const { id } = req.params;
        const { targetUrl } = req.body;



        if (!targetUrl) {
            return res.status(400).json({ success: false, message: 'targetUrl is required' });
        }

        // 1. Find existing doc
        const existing = await QrCodeModel.findById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'QR Code not found' });
        }

        // 2. Delete old image from Cloudinary
        if (existing.publicId) {
            await cloudinary.uploader.destroy(existing.publicId, { resource_type: 'image' });
        }

        // 3. Generate new QR buffer
        const qrBuffer = await QRCode.toBuffer(targetUrl);

        // 4. Upload new image to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { folder: 'qrcodes', resource_type: 'image' },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(qrBuffer);
        });

        // 5. Update MongoDB doc
        const updated = await QrCodeModel.findByIdAndUpdate(
            id,
            {
                targetUrl,
                cloudinaryUrl: uploadResult.secure_url,
                publicId: uploadResult.public_id,
            },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: 'QR Code updated successfully',
            data: updated
        });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
};






export const deleteQRCode = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Find existing doc
        const existing = await QrCodeModel.findById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'QR Code not found' });
        }

        // 2. Delete image from Cloudinary
        if (existing.publicId) {
            await cloudinary.uploader.destroy(existing.publicId, { resource_type: 'image' });
        }

        // 3. Delete from MongoDB
        await QrCodeModel.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'QR Code deleted successfully'
        });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
};