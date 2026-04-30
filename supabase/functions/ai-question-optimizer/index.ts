import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Xử lý CORS preflight
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { content, author_name, seminar_id } = await req.json()
    const apiKey = Deno.env.get("GEMINI_API_KEY")
    
    // Khởi tạo Supabase Client với Service Role để có quyền update/insert
    const supabase = createClient(
      Deno.env.get('NEXT_PUBLIC_SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Lấy danh sách các câu hỏi gốc (chưa bị gom) trong seminar này
    const { data: existingQuestions } = await supabase
      .from("questions")
      .select("id, content")
      .eq("seminar_id", seminar_id)
      .is("already_group", null)
      .limit(20); // Giới hạn để tránh vượt quá context window

    let matchedId = null;

    if (existingQuestions && existingQuestions.length > 0) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${apiKey}`;

      const prompt = `
[SYSTEM]
Bạn là trợ lý AI chuyên phân loại câu hỏi. 
NHIỆM VỤ: So sánh CÂU HỎI MỚI với DANH SÁCH CÂU HỎI CŨ. 
Nếu câu hỏi mới có cùng ý nghĩa hoặc hỏi về cùng một vấn đề, hãy chọn ID của câu hỏi cũ đó.

LƯU Ý: 
- Chỉ chọn ID nếu sự tương đồng > 80%.
- Nếu không có câu hỏi nào trùng, trả về null.
- Trả về kết quả dưới định dạng JSON duy nhất.

CẤU TRÚC TRẢ VỀ:
{"matched_id": "UUID hoặc null"}

[DATA]
CÂU HỎI MỚI: "${content}"
DANH SÁCH CÂU HỎI CŨ:
${JSON.stringify(existingQuestions)}

[OUTPUT]
`;

      const aiResponse = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 150 }
        })
      });

      const result = await aiResponse.json();
      if (result.error) throw new Error(result.error.message);

      let aiText = result.candidates[0].content.parts[0].text;
      
      // Hậu xử lý JSON từ Markdown (Gemma 3 style)
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        matchedId = parsed.matched_id;
      }
    }

    // 2. Thực hiện Logic Database
    if (matchedId && matchedId !== "null") {
      // Trường hợp TRÙNG: 
      // - Tăng count câu hỏi cũ (sử dụng RPC để tránh race condition)
      await supabase.rpc('increment_group_count', { row_id: matchedId });

      // - Lưu câu hỏi hiện tại và link tới câu cũ
      const { data } = await supabase.from("questions").insert([{
        seminar_id,
        content,
        author_name,
        already_group: matchedId,
        status: "pending"
      }]).select().single();

      return new Response(JSON.stringify({ grouped: true, parent_id: matchedId, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } else {
      // Trường hợp KHÔNG TRÙNG: Tạo mới bình thường
      const { data } = await supabase.from("questions").insert([{
        seminar_id,
        content,
        author_name,
        group_count: 1,
        status: "pending"
      }]).select().single();

      return new Response(JSON.stringify({ grouped: false, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    })
  }
})