import mongoose from "mongoose";

const classesSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    }
}, { timestamps: true });

export const Classes = mongoose.model("Classes", classesSchema);