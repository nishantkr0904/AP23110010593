const express = require("express");
const { Log } = require("../../../logging_middleware/index");
const { buildSchedule } = require("../schedulerService");
const { EVAL_ACCESS_TOKEN } = require("../config");

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

router.get("/schedule", async (req, res) => {
  try {
    Log("backend", "info", "route", "Schedule request received");
    const payload = await buildSchedule(EVAL_ACCESS_TOKEN);
    res.status(200).json(payload);
  } catch (error) {
    Log("backend", "error", "route", "Schedule request failed");
    res.status(500).json({ error: "Unable to compute schedule" });
  }
});

module.exports = {
  router,
};
