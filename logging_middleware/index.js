const LOG_ENDPOINT = "http://20.207.122.201/evaluation-service/logs";

const BACKEND_PACKAGES = new Set([
  "cache",
  "controller",
  "cron_job",
  "db",
  "domain",
  "handler",
  "repository",
  "route",
  "service",
]);

const FRONTEND_PACKAGES = new Set(["api", "component", "hook", "page", "state"]);

const LEVELS = new Set(["debug", "info", "warn", "error", "fatal"]);
const STACKS = new Set(["backend", "frontend"]);

function resolveToken() {
  if (typeof process !== "undefined" && process.env && process.env.LOG_AUTH_TOKEN) {
    return process.env.LOG_AUTH_TOKEN;
  }

  if (typeof globalThis !== "undefined" && globalThis.LOG_AUTH_TOKEN) {
    return globalThis.LOG_AUTH_TOKEN;
  }

  return "";
}

function isValidPackage(stack, packageName) {
  if (stack === "backend") {
    return BACKEND_PACKAGES.has(packageName);
  }

  if (stack === "frontend") {
    return FRONTEND_PACKAGES.has(packageName);
  }

  return false;
}

async function Log(stack, level, packageName, message) {
  try {
    if (!STACKS.has(stack) || !LEVELS.has(level) || !isValidPackage(stack, packageName)) {
      return;
    }

    if (typeof message !== "string" || message.trim().length === 0) {
      return;
    }

    const token = resolveToken();
    if (!token) {
      return;
    }

    const payload = {
      stack,
      level,
      package: packageName,
      message,
    };

    await fetch(LOG_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Intentionally swallow logging errors to avoid crashing callers.
  }
}

module.exports = {
  Log,
};
