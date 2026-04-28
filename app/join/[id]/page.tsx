"use client";

import { useState, useEffect, useRef, use } from "react";
import { supabase } from "@/lib/supabase";
import {
  Send,
  CheckCircle2,
  MessageCircle,
  Loader2,
  Star,
  Users,
  ArrowLeft,
  User,
  Heart,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Toast } from "@/components/Toast";
import { QuestionClassificationBadge } from "@/components/QuestionClassificationBadge";
import { classifyQuestion } from "@/lib/classification";

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
  const [showSentConfirmation, setShowSentConfirmation] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = useTranslations();

  useEffect(() => {
    const fetchData = async () => {
      const { data: semi } = await supabase
        .from("seminars")
        .select("*")
        .eq("id", id)
        .single();
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
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "questions",
          filter: `seminar_id=eq.${id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT")
            setQuestions((prev) => [...prev, payload.new]);
          if (payload.eventType === "UPDATE")
            setQuestions((prev) =>
              prev.map((q) => (q.id === payload.new.id ? payload.new : q)),
            );
          if (payload.eventType === "DELETE")
            setQuestions((prev) => prev.filter((q) => q.id === payload.old.id));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [questions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;
    setIsSubmitting(true);

    // Clear input field immediately (optimistic UI)
    const questionText = content.trim();
    setContent("");
    
    // Show confirmation toast
    setShowSentConfirmation(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "ai-question-optimizer",
        {
          body: {
            content: questionText,
            author_name: name.trim() || "Anonymous",
            seminar_id: id,
          },
        },
      );

      if (error) throw error;
    } catch (error: any) {
      console.error("Error submitting question:", error.message);
      alert("Error: " + error.message);
    } finally {
      setIsSubmitting(false);
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
  if (loading)
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
            <Star className="w-10 h-10 text-primary-foreground animate-pulse" />
          </div>
        </div>
        <Loader2 className="animate-spin text-primary mb-4" size={32} />
        <p className="text-muted-foreground font-medium text-sm tracking-widest uppercase">
          {t("join.connecting")}
        </p>
      </div>
    );

  const visibleQuestions = questions.filter(
    (q) => q.status !== "ignored" && !q.already_group,
  );

  return (
    <div className="h-[100dvh] w-screen overflow-hidden bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-xl border-b border-border px-6 py-4 z-30 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="w-10 h-10 rounded-xl bg-secondary hover:bg-primary/10 hover:text-primary flex items-center justify-center text-foreground transition-all border border-border"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
              <Star size={24} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground text-lg tracking-tight">
                {seminar?.title}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs font-mono bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-bold border border-primary/20">
                  {seminar?.code}
                </span>
                <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 bg-accent/20 px-3 py-1.5 rounded-lg border border-accent/30">
                  <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
                  Live
                </span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 bg-primary/10 px-4 py-2.5 rounded-full border border-primary/20">
            <Users size={16} className="text-primary" />
            <span className="text-primary font-bold">
              {visibleQuestions.length}
            </span>
            <span className="text-primary/70 text-sm">
              {t("join.questions")}
            </span>
          </div>
        </div>
      </header>

      {/* Questions Area */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 py-8 scroll-smooth"
        >
          <div className="max-w-3xl mx-auto space-y-6 pb-48">
            {visibleQuestions.length === 0 ? (
              <div className="h-[50vh] flex flex-col items-center justify-center">
                <div className="w-24 h-24 rounded-2xl bg-secondary border-2 border-border flex items-center justify-center mb-6">
                  <MessageCircle size={40} className="text-muted-foreground" />
                </div>
                <p className="text-foreground font-semibold text-lg">
                  {t("join.noQuestions")}
                </p>
                <p className="text-muted-foreground mt-1">
                  {t("join.beFirstToAsk")}
                </p>
              </div>
            ) : (
              visibleQuestions.map((q) => (
                <div
                  key={q.id}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                >
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-sm">
                        <User size={14} className="text-primary-foreground" />
                      </div>
                      <span className="text-sm font-bold text-primary">
                        {q.author_name}
                      </span>
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded border border-border">
                        {new Date(q.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {seminar?.enable_question_classification && (
                        <QuestionClassificationBadge
                          type={classifyQuestion(q.content)}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* INTERESTED BADGE */}
                      {q.group_count > 1 && (
                        <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-bold border border-primary/20 shadow-sm">
                          <Users size={14} />
                          <span>
                            +{q.group_count - 1} {t("join.interested")}
                          </span>
                        </div>
                      )}
                      {/* LIKE BUTTON - Now on the right with a recognizable Heart icon */}
                      <button
                        onClick={() => handleLike(q.id, q.likes)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-pink-200 bg-pink-50 text-pink-600 transition-all active:scale-90 hover:bg-pink-100"
                      >
                        <Heart
                          size={14}
                          className={q.likes > 0 ? "fill-pink-600" : ""}
                        />
                        <span className="text-xs font-bold">
                          {q.likes || 0}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div
                    className={`rounded-2xl border-2 p-6 transition-all shadow-sm ${
                      q.status === "answered"
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-card border-border hover:border-primary/40 hover:shadow-md"
                    }`}
                  >
                    <p
                      className={`text-lg leading-relaxed font-medium ${
                        q.status === "answered"
                          ? "text-emerald-800"
                          : "text-foreground"
                      }`}
                    >
                      {q.content}
                    </p>

                    {q.status === "answered" && (
                      <div className="flex items-center gap-2 mt-4 text-emerald-600 text-sm font-bold bg-emerald-100 px-3 py-1.5 rounded-lg w-fit border border-emerald-200">
                        <CheckCircle2 size={16} />
                        {t("join.answered")}
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
            <div className="bg-card rounded-2xl border-2 border-primary/30 p-4 shadow-xl shadow-primary/10">
              <form onSubmit={handleSubmit} className="flex items-center gap-4">
                <div className="flex-1 flex flex-col px-4 py-2">
                  <input
                    type="text"
                    placeholder={t("join.namePlaceholder")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-transparent text-xs font-bold text-primary outline-none placeholder:text-muted-foreground mb-2 tracking-wide"
                  />
                  <input
                    required
                    placeholder={t("join.questionPlaceholder")}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="bg-transparent py-1 text-base outline-none font-semibold text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !content.trim()}
                  className="bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground w-14 h-14 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-primary/25"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={22} />
                  ) : (
                    <Send size={22} />
                  )}
                </button>
              </form>
            </div>
            <div className="flex items-center justify-center gap-2 mt-4">
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="text-primary animate-spin" />
                  <p className="text-xs text-primary font-medium">
                    {t("join.questionProcessing")}
                  </p>
                </>
              ) : (
                <>
                  <Sparkles size={14} className="text-accent" />
                  <p className="text-xs text-muted-foreground">
                    {t("join.aiModerated")}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      <Toast
        message={t("join.questionSent")}
        isVisible={showSentConfirmation}
        onClose={() => setShowSentConfirmation(false)}
        duration={3500}
        type="success"
      />
    </div>
  );
}
