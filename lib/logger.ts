import { Axiom } from "@axiomhq/js";

type LogLevelName = "debug" | "info" | "warn" | "error";
type LogPayload = Record<string, unknown>;

const token = process.env.AXIOM_TOKEN;
const dataset = process.env.AXIOM_DATASET;
const env = process.env.NEXT_PUBLIC_APP_ENV ?? "local";

const axiom = token ? new Axiom({ token }) : null;

export async function logServerEvent(
  level: LogLevelName,
  event: string,
  payload: LogPayload = {},
) {
  const record = {
    timestamp: new Date().toISOString(),
    level,
    event,
    source: "server",
    env,
    ...payload,
  };

  if (!axiom || !dataset) {
    if (env !== "production") {
      console.log("[server-log]", record);
    }
    return;
  }

  await axiom.ingest(dataset, record);
  await axiom.flush();
}

export async function logClientEventFromApi(
  level: LogLevelName,
  event: string,
  payload: LogPayload = {},
) {
  const record = {
    timestamp: new Date().toISOString(),
    level,
    event,
    source: "client",
    env,
    ...payload,
  };

  if (!axiom || !dataset) {
    if (env !== "production") {
      console.log("[client-log]", record);
    }
    return;
  }

  await axiom.ingest(dataset, record);
  await axiom.flush();
}
