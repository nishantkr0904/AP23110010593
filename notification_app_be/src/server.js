require("dotenv").config();

const express = require("express");
const { Log } = require("../../logging_middleware/index");
const { getPriorityInbox } = require("./priorityInbox");

const PORT = Number(process.env.PORT || 4000);
const EVAL_ACCESS_TOKEN = process.env.EVAL_ACCESS_TOKEN || "";

const app = express();
// In-memory read tracking for evaluator flow (no DB in this stage).
const readIds = new Set();

app.use(express.json({ limit: "1mb" }));
app.use((req, res, next) => {
  Log("backend", "info", "route", `Incoming ${req.method} ${req.originalUrl}`);
  next();
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/notifications/priority", async (req, res) => {
  try {
    const limit = Number(req.query.limit || 10);
    if (!Number.isFinite(limit) || limit <= 0) {
      return res.status(400).json({ error: "Invalid limit" });
    }

    Log("backend", "info", "route", "Priority inbox request received");
    const items = await getPriorityInbox(EVAL_ACCESS_TOKEN, limit, readIds);
    const notifications = items.map((item) => ({
      id: item.id,
      type: item.type,
      priority_score: item.priorityScore,
      message: item.message,
    }));

    return res.status(200).json({ notifications });
  } catch (error) {
    Log("backend", "error", "route", "Priority inbox request failed");
    return res.status(500).json({ error: "Unable to compute priority inbox" });
  }
});

app.get("/priority-inbox", async (req, res) => {
  try {
    const limit = Number(req.query.limit || 10);
    if (!Number.isFinite(limit) || limit <= 0) {
      return res.status(400).json({ error: "Invalid limit" });
    }

    const items = await getPriorityInbox(EVAL_ACCESS_TOKEN, limit, readIds);
    return res.status(200).json({ items });
  } catch (error) {
    Log("backend", "error", "route", "Priority inbox request failed");
    return res.status(500).json({ error: "Unable to compute priority inbox" });
  }
});

app.patch("/notifications/:id/read", (req, res) => {
  const { id } = req.params;
  const { isRead } = req.body || {};

  if (!id) {
    return res.status(400).json({ error: "Missing notification id" });
  }

  if (isRead !== true) {
    return res.status(400).json({ error: "isRead must be true" });
  }

  readIds.add(id);
  return res.status(200).json({ status: "success", id, isRead: true });
});

app.post("/notifications/notify-all", (req, res) => {
  const { message, target } = req.body || {};

  if (typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({ error: "message is required" });
  }

  if (typeof target !== "string" || target.trim().length === 0) {
    return res.status(400).json({ error: "target is required" });
  }

  Log("backend", "info", "service", `Notify-all requested for ${target}`);
  return res.status(200).json({ status: "success" });
});

app.use((err, req, res, next) => {
  Log("backend", "error", "handler", "Unhandled server error");
  res.status(500).json({ error: "Unexpected server error" });
  next(err);
});

app.listen(PORT, () => {
  Log("backend", "info", "service", `Notification backend listening on ${PORT}`);
});
