import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const departmentsSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        index: true,
        required: [true, "Department Name is required"]
    },
    headOfDept: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher"
    },
}, { timestamps: true });

departmentsSchema.plugin(mongooseAggregatePaginate);

export const Departments = mongoose.model("Departments", departmentsSchema);