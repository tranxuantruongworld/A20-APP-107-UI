import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    // Payload sent by Supabase Database Webhook on asr_logs INSERT
    const payload = await req.json();
    const record = payload.record; // the newly inserted asr_logs row

    const seminarId: string = record.seminar_id;
    const asrLogId: string = record.id;
    const transcript: string = record.transcript ?? "";

    if (!transcript.trim() || transcript.trim().split(" ").length < 5) {
      return new Response(JSON.stringify({ skipped: "transcript too short" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiKey = Deno.env.get("GEMINI_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch pending questions for this seminar
    const { data: pending, error: qErr } = await supabase
      .from("questions")
      .select("id, content")
      .eq("seminar_id", seminarId)
      .eq("status", "pending");

    if (qErr) throw new Error(qErr.message);
    if (!pending || pending.length === 0) {
      return new Response(JSON.stringify({ skipped: "no pending questions" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call Gemini to get similarity scores
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
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (jsonMatch) aiText = jsonMatch[0];

    const { matches } = JSON.parse(aiText) as {
      matches: { id: string; score: number }[];
    };

    // Find best match above 70% threshold (score >= 7 out of 10)
    const best = matches
      .filter((m) => m.score >= 7)
      .sort((a, b) => b.score - a.score)[0];

    if (!best) {
      return new Response(JSON.stringify({ matched: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark the matched question as answered and link it to this asr_log row
    await supabase
      .from("questions")
      .update({
        status: "answered",
        answer_id: asrLogId,
      })
      .eq("id", best.id);

    return new Response(
      JSON.stringify({ matched: true, question_id: best.id, score: best.score }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("process-asr-log error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
