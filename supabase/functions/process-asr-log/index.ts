import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function whisperTranscribe(audioUrl: string, openaiKey: string): Promise<string | null> {
  try {
    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) return null;
    const audioBuffer = await audioRes.arrayBuffer();

    const form = new FormData();
    form.append("file", new Blob([audioBuffer], { type: "audio/webm" }), "audio.webm");
    form.append("model", "whisper-1");
    form.append("language", "vi");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}` },
      body: form,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.text ?? null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    // Payload sent by Supabase Database Webhook on asr_logs INSERT
    const payload = await req.json();
    const record = payload.record;

    const seminarId: string = record.seminar_id;
    const asrLogId: string = record.id;
    const webSpeechTranscript: string = record.transcript ?? "";

    console.log(`[process-asr-log] START | asr_log_id=${asrLogId} seminar_id=${seminarId}`);
    console.log(`[process-asr-log] web-speech transcript: "${webSpeechTranscript}"`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiKey = Deno.env.get("GEMINI_API_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY")!;

    console.log(`[process-asr-log] env check | geminiKey=${geminiKey ? "OK" : "MISSING"} openaiKey=${openaiKey ? "OK" : "MISSING"}`);

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Whisper transcription for higher accuracy
    let transcript = webSpeechTranscript;
    if (record.audio_url && openaiKey) {
      console.log(`[process-asr-log] Step 1: calling Whisper | audio_url=${record.audio_url}`);
      const whisperText = await whisperTranscribe(record.audio_url, openaiKey);
      if (whisperText && whisperText.trim().length > 0) {
        transcript = whisperText;
        console.log(`[process-asr-log] Step 1: Whisper OK | "${whisperText}"`);
        await supabase
          .from("asr_logs")
          .update({ refine_model: "whisper-1", refined_transcript: whisperText })
          .eq("id", asrLogId);
      } else {
        console.warn(`[process-asr-log] Step 1: Whisper returned empty, using web-speech fallback`);
      }
    } else {
      console.log(`[process-asr-log] Step 1: skip Whisper (no audio_url or no openaiKey)`);
    }

    // Step 2: Fetch pending questions for this seminar
    console.log(`[process-asr-log] Step 2: fetching pending questions for seminar=${seminarId}`);
    const { data: pending, error: qErr } = await supabase
      .from("questions")
      .select("id, content")
      .eq("seminar_id", seminarId)
      .eq("status", "pending");

    if (qErr) throw new Error(qErr.message);
    if (!pending || pending.length === 0) {
      console.log(`[process-asr-log] Step 2: no pending questions, skipping`);
      return new Response(JSON.stringify({ skipped: "no pending questions" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.log(`[process-asr-log] Step 2: found ${pending.length} pending question(s)`);

    // Step 3: Call Gemini to get similarity scores using the best available transcript
    console.log(`[process-asr-log] Step 3: calling Gemini | transcript="${transcript}"`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${geminiKey}`;

    const prompt = `
[SYSTEM]
Bạn là trợ lý AI điều phối Q&A. Nhiệm vụ của bạn là so sánh nội dung diễn giả đang nói (TRANSCRIPT) với DANH SÁCH CÂU HỎI.
Bạn PHẢI trả về một JSON duy nhất, chứa điểm số tin cậy (0-10) cho TẤT CẢ câu hỏi được cung cấp.
Chỉ coi là "khớp" nếu điểm >= 7.

CẤU TRÚC TRẢ VỀ (BẮT BUỘC):
{"matches": [{"id": "UUID", "score": number}, ...]}

[DATA]
TRANSCRIPT: "${transcript}"
PENDING QUESTIONS: ${JSON.stringify(pending)}

[OUTPUT]
`;

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
      }),
    });

    const geminiData = await geminiRes.json();
    if (geminiData.error) throw new Error(geminiData.error.message);

    let aiText: string = geminiData.candidates[0].content.parts[0].text;
    console.log(`[process-asr-log] Step 3: Gemini raw response: ${aiText}`);
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (jsonMatch) aiText = jsonMatch[0];

    const { matches } = JSON.parse(aiText) as {
      matches: { id: string; score: number }[];
    };
    console.log(`[process-asr-log] Step 3: parsed ${matches.length} match(es): ${JSON.stringify(matches)}`);

    // Find best match above threshold (score >= 7 out of 10)
    const best = matches
      .filter((m) => m.score >= 7)
      .sort((a, b) => b.score - a.score)[0];

    if (!best) {
      console.log(`[process-asr-log] Step 3: no match above threshold`);
      return new Response(JSON.stringify({ matched: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[process-asr-log] Step 4: matched question_id=${best.id} score=${best.score} -> updating status=answered`);
    await supabase
      .from("questions")
      .update({ status: "answered", answer_id: asrLogId })
      .eq("id", best.id);

    console.log(`[process-asr-log] DONE | matched question_id=${best.id}`);
    return new Response(
      JSON.stringify({ matched: true, question_id: best.id, score: best.score }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[process-asr-log] ERROR: ${message}`);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
