
import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import { decryptPassword, encryptPassword } from "../utils/helpers.js";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const userSchema = new Schema({
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    role: {
        type: Schema.Types.ObjectId,
        ref: "Roles",
        required: true,
        index: true
    },
    contactNumber: {
        type: String,
        required: [true, "Contact number is required"],
        trim: true
    },
    gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
        required: true,
    },    
    dob: {
        type: Date,
        required: [true, "Date of birth is required"]
    },
    address: {
        type: String,  
        required: true
    },
    refreshToken: {
        type: String
    }
}, { timestamps: true });

userSchema.pre("save", function(next) {
    if (!this.isModified("password")) return next();
    this.password = encryptPassword(this.password);
    next();
});

userSchema.methods.isPasswordCorrect = function(password) {
    const decryptedPassword = decryptPassword(this.password);
    return decryptedPassword === password;
}

userSchema.methods.generateAccessToken = function() {
    const token = jwt.sign({
        _id: this._id, 
        email: this.email,
        role: this.role.name
    }, 
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
    return token;
}
userSchema.methods.generateRefreshToken = async function() {
    const token = jwt.sign({ _id: this._id }, 
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
    return token;
}

userSchema.plugin(mongooseAggregatePaginate);

export const User = mongoose.model("User", userSchema);