const express = require("express");
const { Log } = require("../../../logging_middleware/index");
const { buildSchedule } = require("../schedulerService");
const { EVAL_ACCESS_TOKEN } = require("../config");

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

async function handleSchedule(req, res) {
  try {
    Log("backend", "info", "route", "Schedule request received");
    const data = await buildSchedule(EVAL_ACCESS_TOKEN);
    return res.status(200).json({ status: "success", data });
  } catch (error) {
    Log("backend", "error", "route", "Schedule request failed");
    return res.status(500).json({ error: "Unable to compute schedule" });
  }
}

router.get("/get-optimized-schedule", handleSchedule);
router.get("/schedule", handleSchedule);

module.exports = {
  router,
};
