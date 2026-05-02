# Vehicle Maintenance Scheduler

Backend microservice to compute optimal maintenance task schedules per depot using a 0/1 knapsack solver.

## Setup

Install dependencies:

```bash
npm install
```

Create a local env file from the example and set tokens:

```bash
cp .env.example .env
```

Required env vars:

- `EVAL_ACCESS_TOKEN`
- `LOG_AUTH_TOKEN`

## Run

```bash
npm start
```

## Endpoints

- GET /health
- GET /get-optimized-schedule

Response:

```json
{
  "status": "success",
  "data": [
    {
      "depotID": 1,
      "totalImpact": 15,
      "totalHoursUsed": 58,
      "tasksScheduled": ["264e638f-...", "73ce9dca-..."]
    }
  ]
}
```

## Notes

- All logs are sent through the shared logging middleware.
- External data is fetched from the evaluation APIs at request time.
- Requires Node.js 18+ for native `fetch` support.
- Legacy `GET /schedule` is retained for compatibility.
