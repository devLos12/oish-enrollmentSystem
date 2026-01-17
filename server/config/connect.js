import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDb = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        if(conn){
            return console.log("MongoDb Connected");
        }
    } catch (error) {
        console.log("Error Message: ", error.message );
    }
}

export default connectDb;