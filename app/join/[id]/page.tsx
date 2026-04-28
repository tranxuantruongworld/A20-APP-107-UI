"use client";

import { useState, useEffect, useRef, use } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Send, CheckCircle2, MessageCircle, 
  Loader2, Sparkles, Users, ArrowLeft, User, Heart, Mic, MicOff
} from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateData, setDuplicateData] = useState<any>(null);
  const [isProcessingMerge, setIsProcessingMerge] = useState(false);
  const [interimContent, setInterimContent] = useState("");
  const [showSessionEndDialog, setShowSessionEndDialog] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: semi } = await supabase.from("seminars").select("*").eq("id", id).single();
      setSeminar(semi);
      
      if (semi?.status === "finished" || semi?.status === "ended") {
        setShowSessionEndDialog(true);
        setTimeout(() => {
          window.location.href = "/";
        }, 3000);
        return; // Stop fetching questions if session ended
      }
      
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

  // Listen for seminar status changes (finished/ended)
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`seminar_status_${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "seminars",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          if (payload.new?.status === "finished" || payload.new?.status === "ended") {
            // Show notification and redirect
            setShowSessionEndDialog(true);
            setTimeout(() => {
              window.location.href = "/";
            }, 3000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [questions]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "vi-VN"; // Vietnamese

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let currentInterim = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          setContent(prev => (prev ? prev + " " : "") + transcript);
        } else {
          currentInterim += transcript;
        }
      }
      setInterimContent(currentInterim);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      setInterimContent("");
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimContent("");
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleMicrophone = () => {
    if (!recognitionRef.current) return;
    
    try {
      if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      } else {
        // Lỗi 2: Dừng trạng thái trước khi bật phiên mới để tránh InvalidStateError
        recognitionRef.current.stop();
        setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.start();
            setIsListening(true);
          }
        }, 100);
      }
    } catch (error) {
      console.error("Microphone toggle error:", error);
      setIsListening(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      // Restore Logic Omission: Call the Supabase Edge Function directly
      const { data: duplicateDataRes, error } = await supabase.functions.invoke('ai-question-optimizer', {
        body: { 
          content: content.trim(),
          author_name: name.trim() || "Anonymous",
          seminar_id: id 
        },
      });

      if (error) {
        console.warn("Edge function check failed:", error);
        // Show an alert to user if they asked for error handling
        if (error.message?.includes("429") || error.status === 429) {
          alert("Hệ thống AI đang quá tải. Câu hỏi của bạn sẽ được gửi thẳng.");
        }
      }

      if (duplicateDataRes?.is_duplicate) {
        const matchedParent = questions.find(q => q.id === duplicateDataRes.parent_id);
        
        setDuplicateData({
          newContent: content.trim(),
          matchedContent: duplicateDataRes.matched_content || matchedParent?.content || "Một câu hỏi tương tự đã tồn tại.",
          synthesizedPreview: duplicateDataRes.synthesized_preview,
          othersCount: duplicateDataRes.others_count || 0,
          parentId: duplicateDataRes.parent_id
        });
        setShowDuplicateDialog(true);
        return;
      }
      
      // Not a duplicate, create new question manually since Edge Function doesn't insert anymore
      const { error: insertError } = await supabase.from("questions").insert([{
        seminar_id: id,
        content: content.trim(),
        author_name: name.trim() || "Anonymous",
        group_count: 1,
        status: "pending"
      }]);
      if (insertError) throw insertError;
      
      // Clear the content
      setContent("");
    } catch (error: any) {
      console.error("Error submitting question:", error.message);
      alert("Error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMergeDuplicate = async () => {
    if (!duplicateData) return;
    setIsProcessingMerge(true);

    try {
      // 1. Update parent count
      await supabase.rpc('increment_group_count', { row_id: duplicateData.parentId });
      
      // 2. Insert child question pointing to parent
      const { error } = await supabase.from("questions").insert([{
        seminar_id: id,
        content: duplicateData.newContent,
        author_name: name.trim() || "Anonymous",
        already_group: duplicateData.parentId,
        status: "pending"
      }]);

      if (error) throw error;

      setContent("");
      setShowDuplicateDialog(false);
      setDuplicateData(null);
    } catch (error: any) {
      console.error("Error merging question:", error.message);
      alert("Error merging: " + error.message);
    } finally {
      setIsProcessingMerge(false);
    }
  };

  const handleDeclineMerge = async () => {
    if (!duplicateData) return;
    setIsProcessingMerge(true);
    
    try {
      // Insert as new unique question
      const { error: insertError } = await supabase.from("questions").insert([{
        seminar_id: id,
        content: duplicateData.newContent,
        author_name: name.trim() || "Anonymous",
        group_count: 1,
        status: "pending"
      }]);
      if (insertError) throw insertError;
      
      setContent("");
      setShowDuplicateDialog(false);
      setDuplicateData(null);
    } catch (error: any) {
      console.error("Error submitting question:", error.message);
      alert("Error: " + error.message);
    } finally {
      setIsProcessingMerge(false);
    }
  };
  const handleLike = async (questionId: string, currentLikes: number) => {
    try {
      // We target the new 'likes' column specifically
      const { error } = await supabase
        .from("questions")
        .update({ likes: (currentLikes || 0) + 1 })
        .eq("id", questionId);

      if (error) throw error;
    } catch (error: any) {
      console.error("Error liking question:", error.message);
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
      {/* Session End Dialog */}
      <Dialog open={showSessionEndDialog} onOpenChange={() => {}}>
        <DialogContent className="max-w-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Hội thảo đã kết thúc
            </DialogTitle>
            <DialogDescription>
              Cảm ơn bạn đã tham gia hội thảo. Bạn sẽ được chuyển về trang chủ trong giây lát...
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>

      {/* Duplicate Merge Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Câu hỏi tương tự được phát hiện</DialogTitle>
            <DialogDescription>
              Hệ thống phát hiện có người muốn hỏi nội dung giống bạn. Bạn có muốn gộp câu hỏi để tăng mức độ ưu tiên không?
            </DialogDescription>
          </DialogHeader>
          {duplicateData && (
            <div className="space-y-3 py-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Câu hỏi gốc:</p>
                <p className="text-sm bg-secondary p-3 rounded-lg">{duplicateData.matchedContent}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Người quan tâm khác: +{duplicateData.othersCount}</p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={handleDeclineMerge}
              disabled={isProcessingMerge}
            >
              Từ chối
            </Button>
            <Button
              onClick={handleMergeDuplicate}
              disabled={isProcessingMerge}
              className="bg-primary hover:bg-primary/90"
            >
              {isProcessingMerge ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang gộp...
                </>
              ) : (
                "Đồng ý gộp"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4 z-30 shrink-0 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="w-10 h-10 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center text-foreground transition-colors border border-border">
              <ArrowLeft size={18} />
            </Link>
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-md">
              <Sparkles size={24} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground text-lg tracking-tight">{seminar?.title}</h1>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs font-mono bg-primary/10 text-primary px-2.5 py-1 rounded-md font-bold border border-primary/20">{seminar?.code}</span>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
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
                <div className="w-24 h-24 rounded-2xl bg-secondary border-2 border-border flex items-center justify-center mb-6">
                  <MessageCircle size={40} className="text-muted-foreground" />
                </div>
                <p className="text-foreground font-semibold text-lg">No questions yet</p>
                <p className="text-muted-foreground mt-1">Be the first to ask!</p>
              </div>
            ) : (
              visibleQuestions.map((q) => (
  <div key={q.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex items-center justify-between mb-3 px-1">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-sm">
          <User size={14} className="text-primary-foreground" />
        </div>
        <span className="text-sm font-bold text-primary">{q.author_name}</span>
        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded border border-border">
          {new Date(q.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
     <div className="flex items-center gap-2">
      {/* INTERESTED BADGE */}
    {q.group_count > 1 && (
      <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-bold border border-primary/20 shadow-sm">
        <Users size={14} /> 
        <span>+{q.group_count - 1} interested</span>
      </div>
    )}
    {/* LIKE BUTTON - Now on the right with a recognizable Heart icon */}
    <button 
      onClick={() => handleLike(q.id, q.likes)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-pink-200 bg-pink-50 text-pink-600 transition-all active:scale-90 hover:bg-pink-100"
    >
      <Heart size={14} className={q.likes > 0 ? "fill-pink-600" : ""} />
      <span className="text-xs font-bold">{q.likes || 0}</span>
    </button>

    
  </div>
    </div>

                  <div className={`rounded-2xl border-2 p-6 transition-all shadow-sm ${
      q.status === 'answered' 
        ? 'bg-emerald-50 border-emerald-200' 
        : 'bg-card border-border hover:border-primary/40 hover:shadow-md'
    }`}>
        <p className={`text-lg leading-relaxed font-medium ${
          q.status === 'answered' ? 'text-emerald-800' : 'text-foreground'
                    }`}>{q.content}</p>
        
        {q.status === 'answered' && (
          <div className="flex items-center gap-2 mt-4 text-emerald-600 text-sm font-bold bg-emerald-100 px-3 py-1.5 rounded-lg w-fit border border-emerald-200">
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
            <div className="bg-card rounded-2xl border-2 border-primary/30 p-3 shadow-lg">
              <form onSubmit={handleSubmit} className="flex items-center gap-3">
                <div className="flex-1 flex flex-col px-4 py-2">
                  <input
                    type="text"
                    placeholder="Your name (optional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-transparent text-xs font-bold text-primary outline-none placeholder:text-muted-foreground mb-1.5 tracking-wide"
                  />
                  <div className="relative">
                    <input
                      required
                      placeholder="Ask a question..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="bg-transparent py-1 text-base outline-none font-semibold text-foreground placeholder:text-muted-foreground w-full"
                    />
                    {isListening && interimContent && (
                      <span className="absolute left-0 bottom-[-20px] text-xs text-muted-foreground truncate w-full pointer-events-none">
                        {interimContent}
                      </span>
                    )}
                  </div>
                </div>
                {/* Microphone Button */}
                {speechSupported ? (
                  <button
                    type="button"
                    onClick={toggleMicrophone}
                    disabled={isSubmitting}
                    className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all shadow-md ${
                      isListening
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-secondary hover:bg-secondary/80 text-foreground"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={isListening ? "Click to stop listening" : "Click to start voice input"}
                  >
                    {isListening ? <MicOff size={22} /> : <Mic size={22} />}
                  </button>
                ) : null}
                <button 
                  type="submit" 
                  disabled={isSubmitting || !content.trim()} 
                  className="bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground w-14 h-14 rounded-xl flex items-center justify-center transition-all shadow-md"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={22} /> : <Send size={22} />}
                </button>
              </form>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-3 bg-secondary py-2 px-4 rounded-lg mx-auto w-fit border border-border">
              Questions are moderated by AI before appearing
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
