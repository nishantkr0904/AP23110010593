# Project Overview

This repository contains the required full stack folder structure and a reusable logging middleware package.

## Structure

- logging_middleware: Shared logging utility.
- notification_app_be: Backend application folder.
- notification_app_fe: Frontend application folder.
- vehicle_maintenance_scheduler: Backend track scheduler folder.
- notification_system_design.md: System architecture notes.

## Logging Middleware Usage

Set a bearer token locally before logging:

```bash
export LOG_AUTH_TOKEN="<access_token>"
```

Example usage:

```js
const { Log } = require("./logging_middleware/index");

Log("backend", "error", "db", "Critical database connection failure");
```

## Tech Notes

- Backend: Node.js + Express (implementation pending).
- Frontend: JavaScript (implementation pending).

## Compliance Notes

- Do not commit secrets or tokens.
- Keep logging messages descriptive and contextual.
