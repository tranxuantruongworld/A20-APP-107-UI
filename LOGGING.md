# Logging Guide (Axiom)

This document defines how to add application logging with Axiom for both local development and production.

## Goals

- Centralize logs from Next.js server and browser.
- Keep local setup simple and safe.
- Use structured logs for search and alerting.

## 1) Install dependencies

```bash
npm install @axiomhq/js
```

## 2) Environment variables

Add these variables to `.env.local` (local) and your deployment environment (production):

```bash
AXIOM_TOKEN=your_axiom_token
AXIOM_DATASET=your_dataset_name
NEXT_PUBLIC_APP_ENV=local
```

Production example:

```bash
AXIOM_TOKEN=your_production_token
AXIOM_DATASET=your_production_dataset
NEXT_PUBLIC_APP_ENV=production
```

Notes:
- `AXIOM_TOKEN` must be server-only. Never expose it to the browser.
- `AXIOM_DATASET` can be shared by server and client pipeline naming.
- `NEXT_PUBLIC_APP_ENV` helps filtering local vs production logs.

## 3) Create logger utility

Create `lib/logger.ts`:

```ts
import { Axiom } from "@axiomhq/js";

const token = process.env.AXIOM_TOKEN;
const dataset = process.env.AXIOM_DATASET;
const appEnv = process.env.NEXT_PUBLIC_APP_ENV ?? "unknown";
const axiom = token ? new Axiom({ token }) : null;

type LogLevel = "debug" | "info" | "warn" | "error";

type LogPayload = Record<string, unknown>;

export async function logEvent(
  level: LogLevel,
  event: string,
  payload: LogPayload = {},
) {
  const record = {
    timestamp: new Date().toISOString(),
    level,
    event,
    env: appEnv,
    ...payload,
  };

  if (!axiom || !dataset) {
    if (appEnv !== "production") console.log("[log]", record);
    return;
  }

  await axiom.ingest(dataset, record);
  await axiom.flush();
}
```

## 4) Server-side usage (Route Handlers / Server Actions)

Example in `app/api/questions/optimize/route.ts`:

```ts
import { logEvent } from "@/lib/logger";

export async function POST(req: Request) {
  await logEvent("info", "question_optimize_request_received");

  try {
    // ... your existing logic
    await logEvent("info", "question_optimize_success", {
      grouped: true,
      seminar_id: "example",
    });
    return Response.json({ ok: true });
  } catch (error) {
    await logEvent("error", "question_optimize_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return Response.json({ error: "failed" }, { status: 500 });
  }
}
```

## 5) Client-side logging pattern

Do not send `AXIOM_TOKEN` from browser.

Recommended approach:
- Browser calls your own API endpoint.
- API endpoint writes logs to Axiom.

Example client event:

```ts
await fetch("/api/log", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    level: "info",
    event: "join_question_submit_clicked",
    payload: { seminar_id: id },
  }),
});
```

Then in `app/api/log/route.ts`, validate payload and call `logEvent(...)`.

## 6) Local setup checklist

- Create an Axiom dataset for local dev (or reuse one with `env=local` filter).
- Put `AXIOM_TOKEN` and `AXIOM_DATASET` in `.env.local`.
- Run `npm run dev`.
- Trigger an action and confirm logs appear in Axiom.
- If token is missing, logs fall back to console in local.

## 7) Production setup checklist

- Create production dataset (or use one dataset with `env=production` filter).
- Set `AXIOM_TOKEN` and `AXIOM_DATASET` in your hosting secrets.
- Set `NEXT_PUBLIC_APP_ENV=production`.
- Verify logs appear after deploy.
- Create alerts in Axiom for key `error` events.

## 8) Naming conventions

Use consistent event names:
- `domain_action_result`
- examples: `question_optimize_success`, `question_optimize_failed`, `auth_login_failed`

Use structured payload keys:
- `user_id`, `seminar_id`, `request_id`, `status_code`, `duration_ms`, `error_code`

## 9) Recommended minimum events

- API request received
- API request success
- API request failure
- external API failure (Gemini, Supabase, etc.)
- auth failure / permission denied

## 10) Security and privacy

- Never log secrets, tokens, passwords, raw auth headers.
- Minimize personal data.
- Redact sensitive values before sending logs.

