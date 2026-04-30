import { supabaseAdmin } from "@/lib/supabase-admin";

type OptimizeRequestBody = {
  content?: string;
  author_name?: string;
  seminar_id?: string;
};

type ExistingQuestion = {
  id: string;
  content: string;
};

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "Missing GEMINI_API_KEY on server." },
        { status: 500 },
      );
    }

    const body = (await req.json()) as OptimizeRequestBody;
    const content = body.content?.trim();
    const authorName = body.author_name?.trim() || "Anonymous";
    const seminarId = body.seminar_id;

    if (!content || !seminarId) {
      return Response.json(
        { error: "content and seminar_id are required." },
        { status: 400 },
      );
    }

    const { data: existingQuestions, error: existingQuestionsError } =
      await supabaseAdmin
        .from("questions")
        .select("id, content")
        .eq("seminar_id", seminarId)
        .is("already_group", null)
        .limit(20);

    if (existingQuestionsError) {
      throw existingQuestionsError;
    }

    let matchedId: string | null = null;
    const oldQuestions = (existingQuestions ?? []) as ExistingQuestion[];

    if (oldQuestions.length > 0) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${apiKey}`;
      const prompt = `
[SYSTEM]
Ban la tro ly AI chuyen phan loai cau hoi.
NHIEM VU: So sanh CAU HOI MOI voi DANH SACH CAU HOI CU.
Neu cau hoi moi co cung y nghia hoac hoi ve cung mot van de, hay chon ID cua cau hoi cu do.

LUU Y:
- Chi chon ID neu su tuong dong > 80%.
- Neu khong co cau hoi nao trung, tra ve null.
- Tra ve ket qua duoi dinh dang JSON duy nhat.

CAU TRUC TRA VE:
{"matched_id": "UUID hoac null"}

[DATA]
CAU HOI MOI: "${content}"
DANH SACH CAU HOI CU:
${JSON.stringify(oldQuestions)}

[OUTPUT]
`;

      const aiResponse = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 150 },
        }),
      });

      const result = await aiResponse.json();
      if (!aiResponse.ok || result?.error) {
        throw new Error(
          result?.error?.message ?? "Failed to get AI optimization result.",
        );
      }

      const aiText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof aiText === "string") {
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as { matched_id?: string | null };
          matchedId = parsed.matched_id ?? null;
        }
      }
    }

    if (matchedId && matchedId !== "null") {
      const { error: rpcError } = await supabaseAdmin.rpc("increment_group_count", {
        row_id: matchedId,
      });
      if (rpcError) {
        throw rpcError;
      }

      const { data, error: insertError } = await supabaseAdmin
        .from("questions")
        .insert([
          {
            seminar_id: seminarId,
            content,
            author_name: authorName,
            already_group: matchedId,
            status: "pending",
          },
        ])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      return Response.json({ grouped: true, parent_id: matchedId, data });
    }

    const { data, error: insertError } = await supabaseAdmin
      .from("questions")
      .insert([
        {
          seminar_id: seminarId,
          content,
          author_name: authorName,
          group_count: 1,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return Response.json({ grouped: false, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";
    return Response.json({ error: message }, { status: 500 });
  }
}
