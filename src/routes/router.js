import express from "express";
import { register, login } from "../controllers/authContoller.js"
import { forgotPassword, resetPassword, checkEmail } from "../controllers/passwordController.js"
import { submitAnswersPHQ, submitAnswersCART } from "../controllers/questionnaireController.js"; 
import authenticateUser from "../middleware/authMiddleware.js"; 
import { predictAnswersPHQ, predictAnswersCART, getPredictionPHQByUser } from "../controllers/predictController.js";


const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/check-email", checkEmail);
router.post("/submit-answers-phq", authenticateUser, submitAnswersPHQ);
router.post("/submit-answers-cart", authenticateUser, submitAnswersCART);
router.post("/predict-answers-phq", authenticateUser, predictAnswersPHQ);
router.post("/predict-answers-cart", authenticateUser, predictAnswersCART);
router.get("/get-prediction-phq", authenticateUser, getPredictionPHQByUser);


export default router;