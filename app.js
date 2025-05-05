import express from "express";
import cors from "cors";
import router from "./src/routes/router.js";

const app = express();
app.use(express.json()); 
app.use(cors({
    origin: "http://localhost:5173",  
}));
app.use("/api", router);



export default app;