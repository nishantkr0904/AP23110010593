const { Log } = require("../../logging_middleware/index");

const NOTIFICATIONS_ENDPOINT =
  "http://20.207.122.201/evaluation-service/notifications";

const WEIGHTS = {
  placement: 3,
  result: 2,
  event: 1,
};

function toTimestamp(value) {
  const ts = new Date(value).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

function normalizeType(rawType) {
  if (!rawType) {
    return "";
  }

  return String(rawType).toLowerCase();
}

function isUnread(notification) {
  if (typeof notification.isRead === "boolean") {
    return notification.isRead === false;
  }

  if (typeof notification.read === "boolean") {
    return notification.read === false;
  }

  return true;
}

function scoreNotification(notification, nowMs) {
  const type = normalizeType(notification.type || notification.category);
  const weight = WEIGHTS[type] || 0;
  const createdAt = toTimestamp(
    notification.createdAt ||
      notification.created_at ||
      notification.Timestamp ||
      notification.timestamp
  );

  return {
    weight,
    createdAt,
  };
}

async function fetchNotifications(accessToken) {
  if (!accessToken) {
    Log("backend", "error", "service", "Missing access token for notifications fetch");
    throw new Error("Missing access token");
  }

  const response = await fetch(NOTIFICATIONS_ENDPOINT, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    Log("backend", "error", "service", `Notifications fetch failed (${response.status})`);
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

async function getPriorityInbox(accessToken, limit = 10) {
  try {
    const payload = await fetchNotifications(accessToken);
    const items = Array.isArray(payload) ? payload : payload.items || [];
    const nowMs = Date.now();

    const unread = items.filter(isUnread).map((notification) => {
      const scoring = scoreNotification(notification, nowMs);

      return {
        ...notification,
        weight: scoring.weight,
        createdAt: scoring.createdAt,
      };
    });

    unread.sort((a, b) => {
      if (b.weight !== a.weight) {
        return b.weight - a.weight;
      }

      return b.createdAt - a.createdAt;
    });

    return unread.slice(0, limit);
  } catch (error) {
    Log("backend", "error", "service", "Priority inbox computation failed");
    return [];
  }
}

module.exports = {
  getPriorityInbox,
};
