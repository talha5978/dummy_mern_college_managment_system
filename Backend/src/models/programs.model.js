import mongoose from "mongoose";

const programsSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        unique: true,
        required: true
    }
}, { timestamps: true });

export const Programs = mongoose.model("Programs", programsSchema);