import mongoose from "mongoose";
import { dbName } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${dbName}`);
        console.log(`MongoDB Connected Successfully | HOST | ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("MongoDB Connection Failed:", error);
        process.exit(1);
    }
};

export default connectDB;