import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import testPrepRoutes from "./routes/testPrepRoutes";
import transcribeRoutes from "./routes/transcribeRoutes";
import config from "./config/config";
dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/transcribe", (_req, res, next) => {
  if (!config.OPENAI_API_KEY || !config.LEMONFOX_API_KEY) {
    res.status(503).json({ success: false, error: "Add OPENAI_API_KEY and LEMONFOX_API_KEY to server/.env, then restart the server." });
    return;
  }
  next();
}, transcribeRoutes);
app.use("/test-prep", (_req, res, next) => {
  if (!config.OPENAI_API_KEY) {
    res.status(503).json({ error: "Add OPENAI_API_KEY to server/.env, then restart the server." });
    return;
  }
  next();
}, testPrepRoutes);

app.get("/health", (_req, res) => {
  res
    .status(200)
    .json({ status: "healthy", timestamp: new Date().toISOString() });
});

const PORT = config.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
