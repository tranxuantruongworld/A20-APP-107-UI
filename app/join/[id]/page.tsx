"use client";

import { useState, useEffect, useRef, use } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Send, CheckCircle2, MessageCircle, 
  Loader2, Sparkles, Users, ArrowLeft, User
} from "lucide-react";
import Link from "next/link";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-question-optimizer', {
        body: { 
          content: content.trim(),
          author_name: name.trim() || "Anonymous",
          seminar_id: id 
        },
      });

      if (error) throw error;
      
      setContent("");
    } catch (error: any) {
      console.error("Error submitting question:", error.message);
      alert("Error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-background">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
        <Loader2 className="relative animate-spin text-primary mb-6" size={48} />
      </div>
      <p className="text-muted-foreground font-medium text-sm tracking-widest uppercase">Connecting to session...</p>
    </div>
  );

  const visibleQuestions = questions.filter(q => q.status !== 'ignored' && !q.already_group);

  return (
    <div className="h-[100dvh] w-screen overflow-hidden bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card/95 backdrop-blur-xl border-b border-primary/20 px-6 py-4 z-30 shrink-0 shadow-lg shadow-black/10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="w-10 h-10 rounded-xl bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary hover:text-primary transition-colors border border-primary/20">
              <ArrowLeft size={18} />
            </Link>
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
              <Sparkles size={24} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground text-lg tracking-tight">{seminar?.title}</h1>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs font-mono bg-primary/20 text-primary px-2.5 py-1 rounded-md font-bold border border-primary/30">{seminar?.code}</span>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/30">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                  Live
                </span>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-xl border border-primary/20">
            <Users size={16} className="text-primary" />
            <span className="text-primary font-bold">{visibleQuestions.length}</span>
            <span className="text-primary/70 text-sm">questions</span>
          </div>
        </div>
      </header>

      {/* Questions Area */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-6 pb-48">
            {visibleQuestions.length === 0 ? (
              <div className="h-[50vh] flex flex-col items-center justify-center">
                <div className="w-24 h-24 rounded-2xl bg-card border border-border/50 flex items-center justify-center mb-6 shadow-lg">
                  <MessageCircle size={40} className="text-muted-foreground/50" />
                </div>
                <p className="text-foreground font-semibold text-lg">No questions yet</p>
                <p className="text-muted-foreground mt-1">Be the first to ask!</p>
              </div>
            ) : (
              visibleQuestions.map((q) => (
                <div key={q.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-md shadow-primary/20">
                        <User size={14} className="text-primary-foreground" />
                      </div>
                      <span className="text-sm font-bold text-primary">{q.author_name}</span>
                      <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded">
                        {new Date(q.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {q.group_count > 1 && (
                      <div className="flex items-center gap-1.5 bg-gradient-to-r from-primary/20 to-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold border border-primary/30 shadow-sm">
                        <Users size={14} /> +{q.group_count - 1} interested
                      </div>
                    )}
                  </div>
                  
                  <div className={`rounded-2xl border-2 p-6 transition-all shadow-lg ${
                    q.status === 'answered' 
                      ? 'bg-emerald-500/10 border-emerald-500/40 shadow-emerald-500/10' 
                      : 'bg-card border-border/50 hover:border-primary/40 shadow-black/10 hover:shadow-primary/10'
                  }`}>
                    <p className={`text-lg leading-relaxed font-medium ${
                      q.status === 'answered' ? 'text-emerald-100' : 'text-foreground'
                    }`}>{q.content}</p>
                    
                    {q.status === 'answered' && (
                      <div className="flex items-center gap-2 mt-4 text-emerald-400 text-sm font-bold bg-emerald-500/20 px-3 py-1.5 rounded-lg w-fit border border-emerald-500/30">
                        <CheckCircle2 size={16} />
                        Answered
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 z-50 p-6 bg-gradient-to-t from-background via-background/95 to-transparent pt-20">
          <div className="max-w-2xl mx-auto">
            <div className="bg-card rounded-2xl border-2 border-primary/30 p-3 shadow-2xl shadow-primary/10">
              <form onSubmit={handleSubmit} className="flex items-center gap-3">
                <div className="flex-1 flex flex-col px-4 py-2">
                  <input
                    type="text"
                    placeholder="Your name (optional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-transparent text-xs font-bold text-primary outline-none placeholder:text-muted-foreground/60 mb-1.5 tracking-wide"
                  />
                  <input
                    required
                    placeholder="Ask a question..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="bg-transparent py-1 text-base outline-none font-semibold text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isSubmitting || !content.trim()} 
                  className="bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 disabled:from-muted disabled:to-muted disabled:cursor-not-allowed text-primary-foreground w-14 h-14 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-primary/30 border border-primary/50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={22} /> : <Send size={22} />}
                </button>
              </form>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-3 bg-secondary/30 py-2 px-4 rounded-lg mx-auto w-fit">
              Questions are moderated by AI before appearing
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
