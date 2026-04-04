import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

import app from "./app.js";


const PORT = process.env.PORT || 3001;
const db = process.env.MONGO_LOCAL_URI;

mongoose.connect(db)
    .then(() => {
        console.log("MongoDB connected");
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err);
    });