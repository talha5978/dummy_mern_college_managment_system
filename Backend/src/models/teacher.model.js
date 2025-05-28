import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const teacherSchema = new Schema({
    _id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    departments: [
        {
            type: Schema.Types.ObjectId,
            ref: "Departments",
            required: true
        }
    ],
    subjectSpecialization: {
        type: String,
        required: true,
    },
    salaryDetails: {
        baseSalary: {
            type: Number,
            required: true,
        },
        bonuses: {
            type: [
                {
                    amount: {
                        type: Number,
                        required: true,
                    },
                    reason: {
                        type: String,
                        required: true,
                    },
                    date: {
                        type: Date,
                        required: true,
                    },
                }
            ],
            default: [],
        },
        deductions: {
            type: [
                {
                    amount: {
                        type: Number,
                        required: true,
                    },
                    reason: {
                        type: String,
                        required: true,
                    },
                    date: {
                        type: Date,
                        required: true,
                    },
                }
            ],
            default: [],
        },
    },
    status: {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Active"
    }
}, { timestamps: true });

teacherSchema.plugin(mongooseAggregatePaginate);

export const Teacher = mongoose.model("Teacher", teacherSchema);