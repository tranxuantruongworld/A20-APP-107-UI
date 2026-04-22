// app/join/[id]/page.tsx
"use client";

import { useState, useEffect, useRef, use } from "react"; // Thêm use ở đây
import { supabase } from "@/lib/supabase";
import { 
  Send, CheckCircle2, User, MessageCircle, 
  Loader2, Sparkles, ArrowDownCircle, Hash, Users 
} from "lucide-react";

// Định nghĩa kiểu dữ liệu cho params
interface PageProps {
  params: Promise<{ id: string }>;
}

export default function JoinRoom({ params }: PageProps) {
  // 1. Unwrap params bằng React.use()
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
      // 2. Sử dụng biến 'id' đã unwrap
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
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]); 

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [questions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
        await supabase.from("questions").insert([{
            seminar_id: id,
            content: content.trim(),
            author_name: name.trim() || "Khách ẩn danh",
            status: "pending",
            }]);
    }catch(e){
        console.log(e)
    }
    setContent("");
    setIsSubmitting(false);
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
      <p className="text-slate-500 font-medium">Đang chuẩn bị khán phòng...</p>
    </div>
  );

  return (
    <div className="h-[100dvh] w-screen overflow-hidden bg-white flex flex-col">
      
      {/* HEADER: Full Width với Border mỏng */}
      <header className="h-20 bg-white/70 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 md:px-10 z-30 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 shrink-0">
            <Sparkles size={24} />
          </div>
          <div>
            <h1 className="font-black text-slate-900 text-lg md:text-2xl tracking-tighter leading-none uppercase">
              {seminar?.title}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                ID: {seminar?.code} • Live Realtime
              </p>
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <div className="text-right border-r border-slate-100 pr-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Khán giả</p>
            <div className="flex items-center gap-1.5 justify-end">
               <Users size={14} className="text-indigo-600" />
               <span className="text-sm font-black text-slate-700 underline decoration-indigo-200">Active Session</span>
            </div>
          </div>
          <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
             <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Powered by Gemini 3 Flash</span>
          </div>
        </div>
      </header>

      {/* MAIN CHAT AREA: Chiếm toàn bộ chiều rộng nhưng giới hạn chiều rộng nội dung để dễ đọc */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        
        {/* Chat List */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 md:px-0 py-10 scroll-smooth custom-scrollbar"
        >
          <div className="max-w-3xl mx-auto space-y-10 pb-40">
            {questions.length === 0 ? (
              <div className="h-[50vh] flex flex-col items-center justify-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-indigo-100 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                  <MessageCircle size={80} className="text-slate-100 relative z-10" />
                </div>
                <p className="text-slate-400 font-medium text-lg italic">Hãy đặt câu hỏi đầu tiên để bắt đầu thảo luận...</p>
              </div>
            ) : (
              questions.map((q) => (
                <div key={q.id} className="animate-in fade-in slide-in-from-bottom-6 duration-700 group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600 uppercase shadow-sm">
                      {q.author_name.charAt(0)}
                    </div>
                    <span className="text-sm font-bold text-slate-700 tracking-tight">{q.author_name}</span>
                    <span className="text-[10px] text-slate-300 font-bold">{new Date(q.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  
                  <div className={`p-6 rounded-[2rem] transition-all duration-500 ${
                    q.status === 'answered' 
                    ? 'bg-slate-50 border border-transparent opacity-60 grayscale-[0.5]' 
                    : 'bg-white border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.06)] hover:shadow-indigo-100 hover:border-indigo-100'
                  }`}>
                    <p className="text-lg md:text-xl font-medium text-slate-800 leading-relaxed tracking-tight">
                      {q.content}
                    </p>
                    {q.status === 'answered' && (
                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                        <CheckCircle2 size={14} /> Diễn giả đã phản hồi
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* INPUT BOX: Floating Floating và bám vào cạnh dưới */}
        <div className="absolute bottom-8 left-0 right-0 z-50 pointer-events-none">
          <div className="max-w-3xl mx-auto px-6 pointer-events-auto">
            <div className="bg-white/80 backdrop-blur-3xl p-3 rounded-[3rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] border border-white">
              <form onSubmit={handleSubmit} className="flex flex-col">
                <div className="flex items-center px-6 py-2 mb-1">
                  <User size={14} className="text-indigo-400 mr-2" />
                  <input
                    type="text"
                    placeholder="Bạn là ai? (Tùy chọn)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-500 outline-none w-full placeholder:text-slate-300 tracking-tighter"
                  />
                </div>
                
                <div className="flex items-center gap-3 bg-slate-100/50 rounded-[2.5rem] p-2 transition-all focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-50 border border-transparent focus-within:border-indigo-100">
                  <textarea
                    rows={1}
                    required
                    placeholder="Nhập nội dung câu hỏi..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="flex-1 px-5 py-3 bg-transparent text-base md:text-lg outline-none resize-none max-h-32 placeholder:text-slate-400 font-medium tracking-tight"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                  <button 
                    type="submit"
                    disabled={isSubmitting || !content.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl shadow-indigo-200 active:scale-90 shrink-0"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} className="ml-1" />}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Bottom Button */}
      <button 
        onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })}
        className="fixed bottom-36 right-10 bg-white w-12 h-12 flex items-center justify-center rounded-full shadow-2xl border border-slate-100 text-slate-400 hover:text-indigo-600 transition-all active:scale-75 z-40"
      >
        <ArrowDownCircle size={24} />
      </button>
    </div>
  );
}