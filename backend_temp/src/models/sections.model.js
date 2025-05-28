import mongoose from "mongoose";

const sectionsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Classes",
        required: true
    }
}, { timestamps: true });

export const Sections = mongoose.model("Sections", sectionsSchema);