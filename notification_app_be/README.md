# Notification Backend Service

Backend utilities and modules for the campus notifications system, including the Priority Inbox logic.

## Modules

- `src/priorityInbox.js`: Fetches notifications, filters unread, scores by weight + recency, and returns the top 10.

## Environment

Provide credentials via a local `.env` (not committed):

- `EVAL_ACCESS_TOKEN` for external API access.
- `LOG_AUTH_TOKEN` for the logging middleware.

## Usage

This folder currently exports reusable logic. Integrate it into an Express route or service layer as needed.
