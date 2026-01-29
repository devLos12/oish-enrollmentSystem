import express from "express";
import connectDb from "./config/connect.js";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import HomeRouter from "./routes/homeRoute.js";
import SharedRouter from "./routes/sharedRoutes.js";
import StaffRouter from "./routes/staffRoute.js";
import StudentRouter from "./routes/studentRoute.js";
import { Server } from "socket.io";






// ✅ SIMPLE VERSION - walang trust proxy
const startServer = async () => {


    try {
        await connectDb();
        const app = express();
        const port = process.env.PORT || 3000;
        
        const corsOption = {
            origin: process.env.ALLOWED_ORIGINS?.split(",") || true,
            credentials: true
        };

        app.use(cors(corsOption));
        app.use(express.json());
        app.use(cookieParser());
        
        app.use('/api/Uploads', express.static(path.join(process.cwd(), 'uploads')));
        app.use("/api", HomeRouter);
        app.use("/api", SharedRouter);
        app.use("/api", StaffRouter);
        app.use('/api', StudentRouter);

        const server = app.listen(port, "0.0.0.0", () => {
            console.log(`Server running on http://localhost:${port}`);
        });

        // ✅ Socket.IO setup lang
        const io = new Server(server, {
            cors: {
                origin: process.env.ALLOWED_ORIGINS?.split(",") || true,
                methods: ["GET", "POST", "DELETE"],
                credentials: true
            }
        });

        global.io = io;

    } catch (error) {
        console.log("Failed to start server: ", error.message);
    }
};



startServer();