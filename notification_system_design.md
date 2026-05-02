# Notification System Design

This document defines a multi-stage technical roadmap for a campus notifications microservice that supports real-time delivery, large-scale storage, and read-heavy workloads.

## Stage 1: REST API and Real-Time Design

### API Contract (REST)

Base URL: `/api/v1`

**POST /notifications**

- Description: Create a notification.
- Headers: `Content-Type: application/json`, `Authorization: Bearer <token>`
- Request body:
  - `title` (string)
  - `message` (string)
  - `type` (string: placement | event | result)
  - `audience` (object with `studentIds` array or `cohort` string)
- Response: `201 Created` with `notificationId` and timestamps.

**GET /notifications**

- Description: Fetch notifications for a student.
- Query params: `studentId`, `limit`, `cursor`, `unreadOnly`
- Response: `200 OK` with `items`, `nextCursor`.

**PATCH /notifications/{id}/read**

- Description: Mark as read.
- Response: `200 OK`.

**DELETE /notifications/{id}**

- Description: Soft delete.
- Response: `204 No Content`.

### Real-Time Push

Use Server-Sent Events (SSE) for simplicity and fan-out efficiency. Each student opens a single SSE stream:

`GET /api/v1/stream?studentId=...`

The service publishes events to the SSE stream after persistence and delivery to the message queue.

## Stage 2: Persistent Storage and Schema

### Storage Choice

Use a relational database for strong consistency on read/unread state and ordered retrieval. A relational store also supports efficient indexing for common access patterns.

### Schema (SQL)

**notifications**

- `id` (uuid, pk)
- `student_id` (varchar, indexed)
- `type` (varchar, indexed)
- `title` (varchar)
- `message` (text)
- `is_read` (boolean, indexed)
- `created_at` (timestamp, indexed)
- `deleted_at` (timestamp, nullable)

### Queries

Insert:

```sql
INSERT INTO notifications (id, student_id, type, title, message, is_read, created_at)
VALUES (?, ?, ?, ?, ?, false, NOW());
```

Fetch unread with cursor:

```sql
SELECT id, type, title, message, created_at
FROM notifications
WHERE student_id = ? AND is_read = false AND created_at < ?
ORDER BY created_at DESC
LIMIT ?;
```

## Stage 3: Query Optimization

### Why the query is slow

`SELECT * FROM notifications WHERE studentID = ? AND isRead = false ORDER BY createdAt DESC` becomes slow at 5M rows because:

- No composite index matches the filter + sort pattern, so the engine scans many rows.
- `SELECT *` forces full row retrieval, increasing IO.
- Sorting without a matching index requires extra memory and temp storage.

### Indexing Guidance

Composite indexes are effective when they match the query pattern. Indexing every column is counterproductive due to write amplification and storage overhead.

Recommended index:

```sql
CREATE INDEX idx_notifications_student_read_created
ON notifications (student_id, is_read, created_at DESC);
```

### Optimized query for Placement notifications (last 7 days)

```sql
SELECT id, title, message, created_at
FROM notifications
WHERE student_id = ?
	AND type = 'placement'
	AND created_at >= NOW() - INTERVAL '7 days'
	AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 50;
```

## Stage 4: Read-Heavy Performance

### Strategies

- **Redis cache**: Cache the latest unread list per student. Fast reads, but requires invalidation on new notifications and read-state changes.
- **Read replicas**: Offload read traffic. Improves throughput but may introduce replication lag.
- **Write-behind + fan-out queues**: Persist once, push to cache asynchronously. Faster reads but eventual consistency concerns.

Tradeoffs must prioritize correctness for read/unread state while keeping p95 latency low.

## Stage 5: Reliability and Notify-All

### Issue

Synchronous loops over 50,000 students risk timeouts and partial failures.

### Reliable Pattern

Use a message queue with a worker pool. The API publishes one job per student and returns immediately. Workers handle retries with exponential backoff and a dead-letter queue.

### Idempotency Safeguard

Maintain a `sent_logs` table keyed by `(notification_id, student_id)` or a unique `message_id`. The worker checks for an existing entry before sending and inserts on success to prevent duplicate delivery during retries.

### Pseudocode

```text
POST /notifications/broadcast
	validate payload
	create notification record
	for each studentId
		enqueue job (notificationId, studentId)
	return 202 Accepted

Worker:
	while jobs exist
		job = dequeue
		try deliver
		if fail and retries < max
			requeue with backoff
		else if fail
			send to dead-letter queue
```

## Stage 6: Priority Inbox Implementation

See [notification_app_be/src/priorityInbox.js](notification_app_be/src/priorityInbox.js) for the functional implementation that fetches notifications, filters unread, scores by weight and recency, and returns the top 10.
