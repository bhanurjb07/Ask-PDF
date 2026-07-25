import express from "express";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors());

// Test route
app.get("/", (_, res) => {
  res.send("API Working");
});

export default app;