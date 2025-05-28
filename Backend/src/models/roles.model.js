import mongoose from "mongoose";

const rolesSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        index: true,
        required: [true, "Name is required"]
    }
}, { timestamps: true });

export const Roles = mongoose.model("Roles", rolesSchema);