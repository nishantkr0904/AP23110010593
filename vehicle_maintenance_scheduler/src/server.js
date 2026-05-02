const express = require("express");
const { Log } = require("../../logging_middleware/index");
const { PORT } = require("./config");
const { router } = require("./routes/scheduleRoutes");

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use("/", router);

app.use((err, req, res, next) => {
  Log("backend", "error", "handler", "Unhandled server error");
  res.status(500).json({ error: "Unexpected server error" });
  next(err);
});

app.listen(PORT, () => {
  Log("backend", "info", "service", `Scheduler service listening on ${PORT}`);
});
