import mongoose from "mongoose";
import moment from "moment";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const attendenceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    role: {
        type: String,
        enum: ["student", "teacher", "staff"],
        required: true,
        index: true
    },
    section: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Sections",
        required: function () {
            return this.role.name === "student";
        },
        index: true
    },
    lecture: {
        type: String,
        required: function () {
            return this.role.name === "student";
        },
        index: true
    },
    status:{
        type: String,
        enum: ["P", "A", "L", "H"],
        default: "A",
        index: true,
        required: true,
    },
    date: {
        type: Date,
        required: true,
        index: true,
        default: () => moment().startOf("day").toDate(),
        immutable: true
    }
}, { timestamps: true });

attendenceSchema.plugin(mongooseAggregatePaginate);

export const Attendence = mongoose.model("Attendence", attendenceSchema);