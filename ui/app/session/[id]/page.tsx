"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  QrCode,
  ArrowLeft,
  Mic,
  MicOff,
  CheckCircle2,
  Loader2,
  MessageSquareOff,
  Sparkles,
  Copy,
  Check,
  Users,
  Clock,
  Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {VoiceVisualizer} from "@/components/VoiceVisualizer"
type FilterType = "pending" | "answered" | "ignored" | "all";

export default function LiveSession() {
  const { id } = useParams();
  const router = useRouter();

  const [isMicOn, setIsMicOn] = useState(false);
  const [seminar, setSeminar] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [realtimeTranscript, setRealtimeTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  const [filter, setFilter] = useState<FilterType>("pending");
const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const filteredQuestions = questions.filter((q) => {
    if (filter === "all") return true;
    return q.status === filter;
  });

  useEffect(() => {
    if (!id) return;

    const fetchInitialData = async () => {
      const { data: sem } = await supabase
        .from("seminars")
        .select("*")
        .eq("id", id)
        .single();
      const { data: qs } = await supabase
        .from("questions")
        .select("*")
        .eq("seminar_id", id)
        .order("created_at", { ascending: false });
      if (sem) setSeminar(sem);
      if (qs) setQuestions(qs);
      setLoading(false);
    };

    fetchInitialData();

    const channel = supabase
      .channel(`live_${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "questions",
          filter: `seminar_id=eq.${id}`,
        },
        (payload: any) => {
          if (payload.eventType === "INSERT")
            setQuestions((prev) => [payload.new, ...prev]);
          if (payload.eventType === "UPDATE")
            setQuestions((prev) =>
              prev.map((q) => (q.id === payload.new.id ? payload.new : q))
            );
          if (payload.eventType === "DELETE")
            setQuestions((prev) => prev.filter((q) => q.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "vi-VN";

    recognition.onresult = async (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      setRealtimeTranscript(finalTranscript || interimTranscript);

      if (finalTranscript) {
        handleAiMatch(finalTranscript);
      }
    };

    recognitionRef.current = recognition;
  }, [questions]);

  useEffect(() => {
    const startMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setAudioStream(stream);
        recognitionRef.current?.start();
      } catch (err) {
        console.error("Error accessing mic:", err);
        setIsMicOn(false);
      }
    };

    const stopMic = () => {
      recognitionRef.current?.stop();
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
      }
      setRealtimeTranscript("");
    };

    if (isMicOn) {
      startMic();
    } else {
      stopMic();
    }
  }, [isMicOn]);

  const handleAiMatch = async (text: string) => {
    const pending = questions.filter((q) => q.status === "pending");
    if (pending.length === 0) return;
    if (text.trim().split(" ").length < 5) return;

    try {
      const { data } = await supabase.functions.invoke("ai-voice-match", {
        body: {
          transcript: text,
          questions: pending.map((q) => ({ id: q.id, content: q.content })),
        },
      });
      if (data?.matches?.length > 0) {
        await updateQuestionStatus(data.matches[0]?.id, "answered");
      }
    } catch (err) {
      console.error("AI Match Error:", err);
    }
  };

  const updateQuestionStatus = async (qId: string, status: string) => {
    await supabase.from("questions").update({ status }).eq("id", qId);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(seminar?.code || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pendingQuestions = questions.filter((q) => q.status === "pending");
  const answeredQuestions = questions.filter((q) => q.status === "answered");
  const ignoredQuestions = questions.filter((q) => q.status === "ignored");

  const filterTabs: { key: FilterType; label: string; count: number }[] = [
    { key: "pending", label: "Pending", count: pendingQuestions.length },
    { key: "answered", label: "Answered", count: answeredQuestions.length },
    { key: "ignored", label: "Skipped", count: ignoredQuestions.length },
    { key: "all", label: "All", count: questions.length },
  ];

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-10 h-10 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center text-foreground transition-colors border border-border"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">Conference Hub</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-600 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </div>
          <span className="font-semibold text-foreground">
            {seminar?.title}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 p-6">
        {/* LEFT SIDEBAR — AI Voice + Transcript */}
        <aside className="col-span-12 lg:col-span-3 space-y-4">
          {/* AI Voice Button */}
          <button
            onClick={() => setIsMicOn(!isMicOn)}
            className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all text-lg border-2 ${
              isMicOn
                ? "bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                : "bg-primary hover:bg-primary/90 text-primary-foreground border-primary shadow-md"
            }`}
          >
            {isMicOn ? (
              <>
                <MicOff className="w-5 h-5" /> Stop AI Voice
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" /> Start AI Voice
              </>
            )}
          </button>

          {/* Realtime Transcript */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              {isMicOn && (
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse [animation-delay:300ms]" />
                </span>
              )}
              <h3 className="font-bold text-foreground">Live Transcript</h3>
            </div>
            {isMicOn && audioStream && (
              <div className="w-32">
                <VoiceVisualizer stream={audioStream} />
              </div>
            )}
            <div className="min-h-[200px] max-h-[400px] overflow-y-auto rounded-xl bg-secondary/50 p-4 text-sm text-foreground leading-relaxed">
              {isMicOn ? (
                <p>{realtimeTranscript || "Listening..."}</p>
              ) : (
                <p className="text-muted-foreground italic">
                  Enable AI Voice to see transcript
                </p>
              )}
            </div>
          </div>
        </aside>

        {/* MAIN — Questions with filter tabs */}
        <main className="col-span-12 lg:col-span-6">
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Questions</h2>
              </div>
              <span className="text-sm text-muted-foreground">
                {filteredQuestions.length} shown
              </span>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-5 border-b border-border pb-3 overflow-x-auto">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${
                    filter === tab.key
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-secondary hover:bg-secondary/80 text-muted-foreground border-border"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-md text-xs ${
                      filter === tab.key
                        ? "bg-primary-foreground/20"
                        : "bg-background"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {filteredQuestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                  <MessageSquareOff className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-bold text-foreground mb-1">
                  No questions to show
                </h3>
                <p className="text-sm text-muted-foreground">
                  Try a different filter or share the room code
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="bg-background border border-border rounded-xl p-4 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-sm">
                            {q.author_name}
                          </span>
                          {q.group_count > 1 && (
                            <span className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold">
                              +{q.group_count - 1} similar
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {new Date(q.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <p className="text-foreground mb-3 leading-relaxed">
                      {q.content}
                    </p>

                    {q.status === "pending" && (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() =>
                            updateQuestionStatus(q.id, "ignored")
                          }
                          className="bg-secondary hover:bg-secondary/80 px-5 py-2 rounded-xl text-sm font-bold text-muted-foreground transition-colors border border-border"
                        >
                          Skip
                        </button>
                        <button
                          onClick={() =>
                            updateQuestionStatus(q.id, "answered")
                          }
                          className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm"
                        >
                          Mark Answered
                        </button>
                      </div>
                    )}

                    {q.status === "answered" && (
                      <div className="flex items-center gap-2 text-green-600 text-sm font-bold">
                        <CheckCircle2 className="w-4 h-4" /> Answered
                      </div>
                    )}

                    {q.status === "ignored" && (
                      <p className="text-sm font-bold text-muted-foreground">
                        Skipped
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* RIGHT SIDEBAR — QR + Code + Stats */}
        <aside className="col-span-12 lg:col-span-3 space-y-4">
          {/* QR Code */}
          <div className="bg-card border border-border rounded-2xl p-5 flex flex-col items-center">
            <div className="w-full aspect-square rounded-xl bg-secondary flex items-center justify-center mb-3">
              <QrCode className="w-24 h-24 text-foreground" />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Scan to join the session
            </p>
          </div>

          {/* Room Code */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2">
              Room Code
            </p>
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-3xl font-black text-foreground tracking-wider">
                {seminar?.code}
              </p>
              <button
                onClick={copyCode}
                className="w-10 h-10 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center border border-border"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-foreground" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this code with your audience
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-foreground">
                {pendingQuestions.length}
              </p>
              <p className="text-xs text-muted-foreground font-semibold">
                Pending
              </p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-foreground">
                {answeredQuestions.length}
              </p>
              <p className="text-xs text-muted-foreground font-semibold">
                Answered
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
