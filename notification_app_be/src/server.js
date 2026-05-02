require("dotenv").config();

const express = require("express");
const { Log } = require("../../logging_middleware/index");
const { getPriorityInbox } = require("./priorityInbox");

const PORT = Number(process.env.PORT || 4000);
const EVAL_ACCESS_TOKEN = process.env.EVAL_ACCESS_TOKEN || "";

const app = express();

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/priority-inbox", async (req, res) => {
  try {
    const limit = Number(req.query.limit || 10);
    Log("backend", "info", "route", "Priority inbox request received");
    const items = await getPriorityInbox(EVAL_ACCESS_TOKEN, limit);
    res.status(200).json({ items });
  } catch (error) {
    Log("backend", "error", "route", "Priority inbox request failed");
    res.status(500).json({ error: "Unable to compute priority inbox" });
  }
});

app.use((err, req, res, next) => {
  Log("backend", "error", "handler", "Unhandled server error");
  res.status(500).json({ error: "Unexpected server error" });
  next(err);
});

app.listen(PORT, () => {
  Log("backend", "info", "service", `Notification backend listening on ${PORT}`);
});
