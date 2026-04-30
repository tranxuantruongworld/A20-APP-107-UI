import { logClientEventFromApi } from "@/lib/logger";

type ClientLogBody = {
  level?: "debug" | "info" | "warn" | "error";
  event?: string;
  payload?: Record<string, unknown>;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ClientLogBody;
    const level = body.level ?? "info";
    const event = body.event;
    const payload = body.payload ?? {};

    if (!event || typeof event !== "string") {
      return Response.json({ error: "event is required" }, { status: 400 });
    }

    await logClientEventFromApi(level, event, payload);
    return Response.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";
    return Response.json({ error: message }, { status: 500 });
  }
}
