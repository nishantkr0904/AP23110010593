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

function isUnread(notification, readIds) {
  if (readIds && readIds.has(notification.id)) {
    return false;
  }

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

  // Blend type weight with recency to rank the inbox.
  const ageHours = createdAt > 0 ? (nowMs - createdAt) / (60 * 60 * 1000) : 9999;
  const recencyScore = Math.max(0, 1 - ageHours / 48);
  const priorityScore = weight * 3 + recencyScore;

  return {
    weight,
    createdAt,
    priorityScore,
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

async function getPriorityInbox(accessToken, limit = 10, readIds = new Set()) {
  try {
    const payload = await fetchNotifications(accessToken);
    const items = Array.isArray(payload) ? payload : payload.items || [];
    const nowMs = Date.now();

    const unread = items.filter((notification) => isUnread(notification, readIds)).map((notification) => {
      const scoring = scoreNotification(notification, nowMs);

      return {
        ...notification,
        weight: scoring.weight,
        createdAt: scoring.createdAt,
        priorityScore: scoring.priorityScore,
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
