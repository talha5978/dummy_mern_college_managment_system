import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const studentSchema = new Schema({
    _id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    classId: {
        type: Schema.Types.ObjectId,
        ref: "Classes",
        required: true
    },
    sectionId: {
        type: Schema.Types.ObjectId,
        ref: "Sections",
        required: true
    },
    program: {
        type: Schema.Types.ObjectId,
        ref: "Programs",
        required: true
    },
    rollNumber: {
        type: Number,
        required: true,
        index: true,
    },
    sessionYears: {
        type: String,
        required: true
    },  
    feeDetails: {
        scholorShip: {
            type: Number,
            required: true,
            validate: {
                validator: function (value) {
                    return value >= 0;
                },
                message: "Scholarship amount must be non-negative."
            }
        },
        totalFee: {
            type: Number,
            required: true
        },
        paidFee: {
            type: Number,
            default: 0,
            validate: {
                validator: function (value) {
                    return value >= 0;
                },
                message: "Paid Fee amount must be non-negative."
            }
        },
        dueFee: {
            type: Number,
            default: 0
        },
        semesterFees: [
            {
                semester: {
                    type: String,
                    required: true,
                    trim: true,
                    unique: true
                },
                isTutionFee: {
                    type: Boolean,
                    required: true
                },
                totalFee: {
                    type: Number,
                    required: true
                },
                dueDate: {
                    type: Date
                },
                status: {
                    type: String,
                    enum: ["Paid", "Unpaid", "InActive"],
                    default: "InActive"
                }
            }
        ]
    },
    status: {
        type: String,
        enum: ["Active", "Inactive", "Alumni"],
        default: "Active"
    }
}, { timestamps: true });

studentSchema.plugin(mongooseAggregatePaginate);

export const Student = mongoose.model("Student", studentSchema);