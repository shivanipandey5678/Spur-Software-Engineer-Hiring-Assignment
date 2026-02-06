import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import "./dbInit";
import chatRoutes from "./routes/chat";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.NODE_ENV === "production" ? process.env.FRONTEND_URL : "*",
}));
app.use(express.json({ limit: "10kb" }));

app.use("/chat", chatRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Spur AI Chat API", status: "running" });
});

app.use((req, res) => res.status(404).json({ error: "Route not found" }));

app.use((err: any, req: express.Request, res: express.Response) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
