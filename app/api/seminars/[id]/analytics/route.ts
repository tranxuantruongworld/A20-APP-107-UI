import { createClient } from "@supabase/supabase-js";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: Params) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return Response.json(
        { error: "Missing Supabase URL or anon key on server." },
        { status: 500 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { id: seminarId } = await params;

    // Fetch seminar metadata for duration calculation
    const { data: seminarData, error: seminarError } = await supabase
      .from("seminars")
      .select("created_at")
      .eq("id", seminarId)
      .single();

    if (seminarError) throw seminarError;

    // Fetch questions using your specific schema columns
    const { data: questions, error: questionsError } = await supabase
      .from("questions")
      .select("id, question_type, status, author_name, likes, is_sensitive, answer_id")
      .eq("seminar_id", seminarId);

    if (questionsError) throw questionsError;

    const totalQuestions = questions?.length ?? 0;
    
    // Updated filtering based on your text-based 'status' and 'question_type' columns
    const greetingCount = questions?.filter((q) => q.question_type === "greeting").length ?? 0;
    const professionalCount = questions?.filter((q) => q.question_type === "professional").length ?? 0;
    
    // Schema uses 'pending' as default; we check for 'answered' status or presence of an answer_id
    const answeredCount = questions?.filter((q) => q.status === 'answered' || q.answer_id !== null).length ?? 0;
    const pendingCount = questions?.filter((q) => q.status === 'pending' && q.answer_id === null).length ?? 0;
    
    // Aggregating new metrics from your schema
    const totalLikes = questions?.reduce((acc, q) => acc + (q.likes || 0), 0) ?? 0;
    const sensitiveCount = questions?.filter((q) => q.is_sensitive === true).length ?? 0;

    const uniqueParticipants = new Set(
      (questions ?? []).map((q) => q.author_name).filter((name) => name && name !== 'Anonymous')
    ).size;

    const sessionDurationMinutes = seminarData?.created_at
      ? Math.max(
          Math.floor((Date.now() - new Date(seminarData.created_at).getTime()) / 1000 / 60),
          1,
        )
      : 1;

    return Response.json({
      total_questions: totalQuestions,
      greeting_count: greetingCount,
      professional_count: professionalCount,
      answered_count: answeredCount,
      pending_count: pendingCount,
      unique_participants: uniqueParticipants,
      total_likes: totalLikes,
      sensitive_count: sensitiveCount,
      questions_per_minute: totalQuestions / sessionDurationMinutes,
      session_duration_minutes: sessionDurationMinutes,
    });
  } catch (error: any) {
    return Response.json({ error: error.message || "Server Error" }, { status: 500 });
  }
}