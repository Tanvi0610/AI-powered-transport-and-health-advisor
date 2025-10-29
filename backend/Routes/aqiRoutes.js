import express from "express";
import { getAqiPredictions } from "../Controllers/AqiController.js";
const router = express.Router();

router.get("/predictions", getAqiPredictions);

export default router;
