import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const cloudinaryFileUpload = async (localFilePath) => {
    try {
        if (!localFilePath) {
            throw new Error("Could Not Find the File Path");
        }
        //Uploading Files to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        throw new ApiError("Error Uploading File on Cloudinary", error.message);
    }
}

const getPublicId = (imageURL) => imageURL.split("/").pop().split(".")[0];

const cloudinaryFileDelete = async (filePath, resource_type) => {
    try {
        if (!filePath) {
            throw new Error("Could Not Find the File Path");
        }
    
        const publicId = getPublicId(filePath);
        
        return await cloudinary.uploader.destroy(publicId, {
            resource_type: resource_type
        });
    } catch (error) {
        throw new Error("Error Deleting File on Cloudinary", error.message);   
    }
}

export { cloudinaryFileUpload, cloudinaryFileDelete };