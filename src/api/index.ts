import express from "express";
import { API_CONFIG } from "../config/constants";
import leaveRoutes from "./routes/leave.routes";
import { errorHandler } from "./middleware/error-handler";

const app = express();
app.use(express.json());

app.use("/leaves", leaveRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use(errorHandler);

const PORT = process.env.PORT ?? API_CONFIG.DEFAULT_PORT;

app.listen(PORT, () => {
  console.log(`🌐 API server running on http://localhost:${PORT}`);
  console.log(`📋 Endpoints:`);
  console.log(`   POST /leaves - Apply for leave`);
  console.log(`   POST /leaves/:requestId/approve - Approve/reject leave`);
  console.log(`   GET /leaves/:requestId - Get leave request status`);
  console.log(`   GET /health - Health check`);
});

export default app;

