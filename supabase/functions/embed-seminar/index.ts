import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  console.log("===== FUNCTION START =====")
  console.log("Method:", req.method)

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    console.log("Payload:", JSON.stringify(payload))

    const record = payload.record || payload
    const { id, title, description } = record

    console.log("Parsed record:", { id, title, description })

    if (!id || !title) {
      throw new Error("Missing id or title")
    }

    const apiKey = Deno.env.get("OPENROUTER_API_KEY")

    if (!apiKey) {
      throw new Error("Missing OPENROUTER_API_KEY")
    }

    const textToEmbed =
      `Chủ đề: ${title}. Nội dung: ${description || "Không có mô tả"}.`

    console.log("TextToEmbed:", textToEmbed)

    // ==========================
    // CALL OPENROUTER
    // ==========================
    const embedRes = await fetch(
      "https://openrouter.ai/api/v1/embeddings",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://supabase.com",
          "X-Title": "Seminar Embed",
        },
        body: JSON.stringify({
          model: "nvidia/llama-nemotron-embed-vl-1b-v2:free",
          input: textToEmbed,
          encoding_format: "float",
        }),
      }
    )

    const raw = await embedRes.text()

    console.log("OpenRouter status:", embedRes.status)
    console.log("OpenRouter raw:", raw)

    const embedData = JSON.parse(raw)

    const vector = embedData?.data?.[0]?.embedding

    if (!vector) {
      throw new Error("Embedding not returned")
    }

    console.log("Vector length:", vector.length)

    if (vector.length !== 2048) {
      throw new Error(`Wrong vector size ${vector.length}`)
    }

    // ==========================
    // UPDATE SUPABASE
    // ==========================
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const { error } = await supabase
      .from("seminars")
      .update({
        embedding: vector,
      })
      .eq("id", id)

    if (error) {
      console.log("DB ERROR:", error)
      throw error
    }

    console.log("DB updated success")

    return new Response(
      JSON.stringify({
        success: true,
        id,
        vector_size: vector.length,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  } catch (err) {
    console.log("FUNCTION ERROR:", err)

    return new Response(
      JSON.stringify({
        success: false,
        error: err.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  }
})