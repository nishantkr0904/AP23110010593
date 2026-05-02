# Notification Backend Service

Backend service for the campus notifications system, including Stage 6 Priority Inbox logic.

## Environment

Provide credentials via a local `.env` (not committed):

- `EVAL_ACCESS_TOKEN` for external API access.
- `LOG_AUTH_TOKEN` for the logging middleware.

## Run

```bash
npm install
npm start
```

## Endpoints

- `GET /health`
- `GET /notifications/priority?limit=10`
  - Response:
    ```json
    {
      "notifications": [
        {
          "id": "...",
          "type": "Placement",
          "priority_score": 9.5,
          "message": "..."
        }
      ]
    }
    ```
- `PATCH /notifications/:id/read`
  - Request body:
    ```json
    { "isRead": true }
    ```
- `POST /notifications/notify-all`
  - Request body:
    ```json
    { "message": "Placement drive starting tomorrow", "target": "all_students" }
    ```

## Notes

- Priority scoring blends type weight and recency (last 48 hours).
- Read status is tracked in memory for evaluator flows.
- Legacy `GET /priority-inbox` is retained for compatibility.
