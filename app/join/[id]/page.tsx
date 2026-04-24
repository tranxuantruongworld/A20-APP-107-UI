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
      <header className="glass border-b border-border/50 px-6 py-4 z-30 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="w-10 h-10 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shadow-lg shadow-primary/10">
              <Sparkles size={24} className="text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-foreground text-lg tracking-tight">{seminar?.title}</h1>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs font-mono bg-secondary px-2 py-0.5 rounded text-muted-foreground">{seminar?.code}</span>
                <span className="text-xs font-semibold text-green-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Live
                </span>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <Users size={16} className="text-primary" />
            <span>{visibleQuestions.length} questions</span>
          </div>
        </div>
      </header>

      {/* Questions Area */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-6 pb-48">
            {visibleQuestions.length === 0 ? (
              <div className="h-[50vh] flex flex-col items-center justify-center">
                <div className="w-24 h-24 rounded-2xl bg-secondary/50 flex items-center justify-center mb-6">
                  <MessageCircle size={40} className="text-muted-foreground/30" />
                </div>
                <p className="text-muted-foreground font-medium">No questions yet</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Be the first to ask!</p>
              </div>
            ) : (
              visibleQuestions.map((q) => (
                <div key={q.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <User size={12} className="text-primary" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">{q.author_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(q.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {q.group_count > 1 && (
                      <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                        <Users size={12} /> +{q.group_count - 1} interested
                      </div>
                    )}
                  </div>
                  
                  <div className={`glass rounded-2xl border p-5 transition-all ${
                    q.status === 'answered' 
                      ? 'border-green-500/30 bg-green-500/5' 
                      : 'border-border/50 hover:border-primary/30'
                  }`}>
                    <p className={`text-lg leading-relaxed ${
                      q.status === 'answered' ? 'text-muted-foreground' : 'text-foreground'
                    }`}>{q.content}</p>
                    
                    {q.status === 'answered' && (
                      <div className="flex items-center gap-2 mt-4 text-green-500 text-sm font-medium">
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
        <div className="absolute bottom-0 left-0 right-0 z-50 p-6 bg-gradient-to-t from-background via-background to-transparent pt-20">
          <div className="max-w-2xl mx-auto">
            <div className="glass rounded-2xl border border-border/50 p-2 shadow-2xl shadow-black/20">
              <form onSubmit={handleSubmit} className="flex items-center gap-3">
                <div className="flex-1 flex flex-col px-4 py-2">
                  <input
                    type="text"
                    placeholder="Your name (optional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-primary outline-none placeholder:text-muted-foreground/50 mb-1"
                  />
                  <input
                    required
                    placeholder="Ask a question..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="bg-transparent py-1 text-base outline-none font-medium text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isSubmitting || !content.trim()} 
                  className="bg-primary hover:bg-primary/90 disabled:bg-primary/30 disabled:cursor-not-allowed text-primary-foreground w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-primary/20"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                </button>
              </form>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-3">
              Questions are moderated by AI before appearing
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
