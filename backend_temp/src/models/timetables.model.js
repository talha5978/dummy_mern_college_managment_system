import mongoose, { Schema } from "mongoose";

const timetablesSchema = new Schema({
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher",
        required: true,
        index: true
    },
    subject: {
        type: String,
        trim: true,
        required: true
    },
    day: {
        type: String,
        required: true,
        enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        index: true
    },
    timeslot: {
        start: {
            type: String, // CHANGED FROM DATE TO STRING
            required: true
        },
        end: {
            type: String, // CHANGED FROM DATE TO STRING
            required: true
        }
    },
    section: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Sections",
        required: true
    }
}, { timestamps: true });

export const TimeTabels = mongoose.model("TimeTabels", timetablesSchema);