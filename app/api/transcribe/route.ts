import { NextRequest } from "next/server";
import OpenAI from "openai";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    const model = (formData.get("model") as string) || "whisper-1";
    const apiKey = formData.get("apiKey") as string | null;

    if (!audioFile) {
      return Response.json({ error: "No audio file provided" }, { status: 400 });
    }

    const key = apiKey || process.env.OPENAI_API_KEY;
    if (!key) {
      return Response.json(
        { error: "No OpenAI API key provided" },
        { status: 401 },
      );
    }

    const openai = new OpenAI({ apiKey: key });

    const start = Date.now();

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model,
      language: "vi",
    });

    const latencyMs = Date.now() - start;

    return Response.json({
      text: transcription.text,
      model,
      latencyMs,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Transcription failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
