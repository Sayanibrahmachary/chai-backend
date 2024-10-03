import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";
import dotenv from "dotenv";//**It allows you to store configuration settings, like database connection strings, API keys, or environment-specific settings, in a .env file. This keeps sensitive information out of your codebase and makes it easier to change configurations without modifying your code. 

dotenv.config();

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB connection FAILED: ", error);
        process.exit(1)
    }
}

export default connectDB