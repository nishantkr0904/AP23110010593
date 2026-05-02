# Notification System Design

## Goals

- Deliver notifications to users through multiple channels.
- Support both scheduled and real-time delivery.
- Provide a simple audit trail for debugging.

## High-Level Architecture

- Frontend (notification_app_fe) sends notification requests and displays status.
- Backend (notification_app_be) validates requests, routes them, and persists state.
- Logging middleware captures structured logs for monitoring.

## Components

- API Gateway: Receives requests from the frontend.
- Notification Service: Orchestrates delivery logic and retries.
- Scheduler: Handles queued and delayed notifications.
- Data Store: Persists users, templates, and delivery status.

## Key Flows

1. User submits a notification request.
2. Backend validates and enqueues the request.
3. Scheduler triggers delivery workers.
4. Delivery status updates are stored and exposed to the frontend.

## Observability

- Structured logs emitted via the logging middleware.
- Error logs include request identifiers and context.
