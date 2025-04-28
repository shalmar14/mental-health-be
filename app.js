import express from "express";
import cors from "cors";
import router from "./src/routes/router.js";

const app = express();
app.use(express.json()); // HARUS ADA agar bisa membaca JSON dari body
app.use(cors({
    origin: "http://localhost:5173", // Sesuaikan dengan alamat frontend
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, 
}));
app.use("/api", router);



export default app;