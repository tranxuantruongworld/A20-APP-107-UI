import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { transcript, questions } = await req.json()
    const apiKey = Deno.env.get("GEMINI_API_KEY")

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing API Key" }), { status: 500, headers: corsHeaders })
    }

    // Đổi URL sang gemma-3-27b-it
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${apiKey}`;

    // System Prompt tối ưu cho Gemma 3: Yêu cầu đánh giá TOÀN BỘ câu hỏi
    const prompt = `
[SYSTEM]
Bạn là trợ lý AI điều phối Q&A. Nhiệm vụ của bạn là so sánh nội dung diễn giả đang nói (TRANSCRIPT) với DANH SÁCH CÂU HỎI.
Bạn PHẢI trả về một JSON duy nhất, chứa điểm số tin cậy (0-10) cho TẤT CẢ câu hỏi được cung cấp, bất kể chúng có liên quan hay không.

CẤU TRÚC TRẢ VỀ (BẮT BUỘC):
{"matches": [{"id": "UUID", "score": số}, ...]}

[DATA]
TRANSCRIPT: "${transcript}"
PENDING QUESTIONS: ${JSON.stringify(questions)}

[OUTPUT]
`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          // Lưu ý: Không dùng responseMimeType: "application/json" nếu model báo lỗi
          temperature: 0.1,
          maxOutputTokens: 1024
        }
      })
    })

    const result = await response.json()
    if (result.error) throw new Error(result.error.message);

    let aiText = result.candidates[0].content.parts[0].text;

    // Hậu xử lý: Gemma 3 đôi khi bọc JSON trong Markdown ```json ... ```
    // Đoạn regex này giúp lấy nội dung JSON thuần túy
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      aiText = jsonMatch[0];
    }

    // Parse thử để đảm bảo JSON hợp lệ trước khi gửi về client
    try {
      JSON.parse(aiText);
    } catch (e) {
      console.error("Gemma 3 gen JSON lỗi:", aiText);
      throw new Error("Invalid JSON format from model");
    }
    
    return new Response(aiText, {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (err) {
    console.error("Function Error:", err.message)
    return new Response(JSON.stringify({ matches: [], error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200 
    })
  }
})