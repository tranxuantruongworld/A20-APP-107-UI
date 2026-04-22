"use client";

import { useState, useEffect, useRef, use } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Send, CheckCircle2, MessageCircle, 
  Loader2, Sparkles, ArrowDownCircle, Users 
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function JoinRoom({ params }: PageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [content, setContent] = useState("");
  const [name, setName] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [seminar, setSeminar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: semi } = await supabase.from("seminars").select("*").eq("id", id).single();
      setSeminar(semi);
      
      const { data: qs } = await supabase
        .from("questions")
        .select("*")
        .eq("seminar_id", id)
        .order("created_at", { ascending: true });
      
      setQuestions(qs || []);
      setLoading(false);
    };
    fetchData();

    const channel = supabase
      .channel(`public_chat_${id}`)
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: "questions", 
        filter: `seminar_id=eq.${id}` 
      }, 
      (payload) => {
        if (payload.eventType === 'INSERT') setQuestions(prev => [...prev, payload.new]);
        if (payload.eventType === 'UPDATE') setQuestions(prev => prev.map(q => q.id === payload.new.id ? payload.new : q));
        if (payload.eventType === 'DELETE') setQuestions(prev => prev.filter(q => q.id === payload.old.id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [questions]);

  // --- HÀM SUBMIT SỬ DỤNG INVOKE ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      // Sử dụng .invoke thay vì fetch
      const { data, error } = await supabase.functions.invoke('ai-question-optimizer', {
        body: { 
          content: content.trim(),
          author_name: name.trim() || "Khách ẩn danh",
          seminar_id: id 
        },
      });

      if (error) throw error;
      
      setContent("");
    } catch (error: any) {
      console.error("Lỗi gửi câu hỏi:", error.message);
      alert("Lỗi: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
      <p className="text-slate-500 font-medium text-sm tracking-widest uppercase">Đang kết nối...</p>
    </div>
  );

  return (
    <div className="h-[100dvh] w-screen overflow-hidden bg-slate-50 flex flex-col">
      <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-10 z-30 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-lg md:text-xl tracking-tight uppercase">{seminar?.title}</h1>
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Trực tiếp
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative flex flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-10 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-8 pb-40">
            {questions.filter(q => q.status !== 'ignored' && !q.already_group).length === 0 ? (
              <div className="h-[50vh] flex flex-col items-center justify-center text-slate-300">
                <MessageCircle size={60} className="mb-4 opacity-20" />
                <p className="text-sm font-medium italic">Chưa có câu hỏi nào...</p>
              </div>
            ) : (
              questions
                .filter(q => q.status !== 'ignored' && !q.already_group)
                .map((q) => (
                  <div key={q.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-2 ml-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">@{q.author_name}</span>
                        <span className="text-[10px] text-slate-300">• {new Date(q.created_at).toLocaleTimeString()}</span>
                      </div>
                      {q.group_count > 1 && (
                        <div className="flex items-center gap-1.5 bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-bold">
                          <Users size={12} /> +{q.group_count - 1} người khác quan tâm
                        </div>
                      )}
                    </div>
                    
                    <div className={`p-6 rounded-[2rem] border shadow-sm transition-all ${q.status === 'answered' ? 'bg-emerald-50/50 border-emerald-100 opacity-80' : 'bg-white border-slate-100'}`}>
                      <p className={`text-lg font-medium ${q.status === 'answered' ? 'text-slate-500' : 'text-slate-800'}`}>{q.content}</p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        <div className="absolute bottom-8 left-0 right-0 z-50 pointer-events-none">
          <div className="max-w-2xl mx-auto px-6 pointer-events-auto">
            <div className="bg-white/90 backdrop-blur-xl p-2 rounded-[2.5rem] shadow-2xl border border-white">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <div className="flex-1 flex flex-col pl-4">
                   <input
                    type="text"
                    placeholder="Tên của bạn..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-transparent text-[10px] font-bold text-indigo-500 outline-none uppercase"
                  />
                  <input
                    required
                    placeholder="Đặt câu hỏi cho Speaker..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="bg-transparent py-2 text-sm md:text-base outline-none font-medium text-slate-700"
                  />
                </div>
                <button type="submit" disabled={isSubmitting || !content.trim()} className="bg-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg shadow-indigo-200">
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}