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
  Heart,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { VoiceASRPanel } from "@/components/VoiceASRPanel";
type FilterType = "pending" | "answered" | "ignored" | "all";
import { QRCodeSVG } from "qrcode.react";
import { useMicVAD, utils } from "@ricky0123/vad-react";
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
  const interimTextRef = useRef("");
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());
  const [aiMatchedIds, setAiMatchedIds] = useState<Set<string>>(new Set());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const segmentStartRef = useRef<number>(0);

  const [filter, setFilter] = useState<FilterType>("pending");
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  // Ref để giữ instance của Speech Recognition
  const fullTranscriptRef = useRef("");

  const filteredQuestions = questions
    .filter((q) => {
      if (filter === "all") return true;
      // Keep animating cards visible even if they no longer match the filter
      if (animatingIds.has(q.id)) return true;
      return q.status === filter;
    })
    .sort((a, b) => {
      // Calculate total score: (group_count * 3) + likes
      const scoreA = a.group_count * 3 + (a.likes ?? 0);
      const scoreB = b.group_count * 3 + (b.likes ?? 0);
      return scoreB - scoreA;
    });
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    window.location.origin ||
    "http://localhost:3000";
  const joinUrl = `${baseUrl}/join/${seminar?.id}`;

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
          if (payload.eventType === "UPDATE") {
            setQuestions((prev) => {
              // Read previous status from local state BEFORE updating
              const prevQuestion = prev.find((q) => q.id === payload.new.id);
              const wasJustAnswered =
                prevQuestion?.status === "pending" &&
                payload.new?.status === "answered";

              if (wasJustAnswered) {
                const qId: string = payload.new.id;
                const isAi = payload.new?.answer_id != null;
                if (isAi) setAiMatchedIds((prev) => new Set(prev).add(qId));
                setAnimatingIds((prev) => new Set(prev).add(qId));
                setTimeout(() => {
                  setAnimatingIds((prev) => {
                    const n = new Set(prev);
                    n.delete(qId);
                    return n;
                  });
                  setAiMatchedIds((prev) => {
                    const n = new Set(prev);
                    n.delete(qId);
                    return n;
                  });
                }, 3000);
              }

              return prev.map((q) =>
                q.id === payload.new.id ? payload.new : q,
              );
            });
          }
          if (payload.eventType === "DELETE")
            setQuestions((prev) => prev.filter((q) => q.id !== payload.old.id));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // 4. Hàm lưu trữ lên Supabase
  const saveAsrLog = async (
    transcript: string,
    audioBlob: Blob,
    durationMs: number,
  ) => {
    try {
      const fileName = `${id}/${Date.now()}.wav`;

      // Upload Audio lên Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("asr-recordings")
        .upload(fileName, audioBlob, { contentType: "audio/wav" });

      let audio_url = null;
      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage
          .from("asr-recordings")
          .getPublicUrl(uploadData.path);
        audio_url = urlData.publicUrl;
      }

      // Lưu Log vào DB
      await supabase.from("asr_logs").insert({
        seminar_id: id,
        transcript: transcript,
        audio_url: audio_url,
        duration_ms: Math.round(durationMs),
      });

      console.log("Đã lưu log thành công:", transcript);
    } catch (err) {
      console.error("Lỗi SaveAsrLog:", err);
    }
  };

  // 1. Cấu hình Web Speech API (Chỉ khởi tạo, không tự chạy)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "vi-VN";

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          fullTranscriptRef.current += event.results[i][0].transcript;
          interimTextRef.current = "";
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      interimTextRef.current = interim;
      setRealtimeTranscript(fullTranscriptRef.current + interim);
    };

    recognitionRef.current = recognition;
  }, []);
  // 2. Cấu hình Silero VAD - "Nhạc trưởng" điều khiển luồng
  const vad = useMicVAD({
    model: "v5",
    baseAssetPath: "/vad/",
    onnxWASMBasePath: "/vad/",
    startOnLoad: false,
    getStream: async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          autoGainControl: true,
          noiseSuppression: true,
        },
      });
      setAudioStream(stream);
      return stream;
    },
    pauseStream: async (stream: MediaStream) => {
      stream.getTracks().forEach((t) => t.stop());
      setAudioStream(null);
    },

    onSpeechEnd: async (audio) => {
      console.log("VAD: Kết thúc câu -> Chốt transcript & gửi log");

      // Snapshot transcript tại thời điểm VAD detect silence
      // Gộp cả interim chưa isFinal vào để không bỏ sót từ cuối câu
      const finalSTT = (
        fullTranscriptRef.current + interimTextRef.current
      ).trim();
      fullTranscriptRef.current = "";
      interimTextRef.current = "";

      if (finalSTT.length > 0) {
        setRealtimeTranscript("");
      }
      // Chuyển đổi audio từ VAD sang WAV
      const wavBuffer = utils.encodeWAV(audio);
      const audioBlob = new Blob([wavBuffer], { type: "audio/wav" });

      if (finalSTT.length > 2) {
        const durationMs = (audio.length / 16000) * 1000;
        await saveAsrLog(finalSTT, audioBlob, durationMs);
      }
    },

    positiveSpeechThreshold: 0.5,
    negativeSpeechThreshold: 0.35,
    redemptionMs: 200,
    minSpeechMs: 150,
  });
  // 3. Đồng bộ Switch Mic với VAD
  useEffect(() => {
    if (isMicOn) {
      fullTranscriptRef.current = "";
      interimTextRef.current = "";
      setRealtimeTranscript("");
      try {
        recognitionRef.current?.start();
      } catch (_) {}
      try {
        vad.start();
      } catch (_) {}
    } else {
      recognitionRef.current?.stop();
      try {
        vad.pause();
      } catch (_) {}
    }
  }, [isMicOn]);

  const updateQuestionStatus = async (qId: string, status: string) => {
    if (status === "answered") {
      setAnimatingIds((prev) => new Set(prev).add(qId));
      setTimeout(() => {
        setAnimatingIds((prev) => {
          const n = new Set(prev);
          n.delete(qId);
          return n;
        });
      }, 3000);
    }
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

  const handleSpeak = (text: string) => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "vi-VN"; // Set to Vietnamese

    window.speechSynthesis.speak(utterance);
  };
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
          <VoiceASRPanel
            isMicOn={isMicOn}
            onToggleMic={() => setIsMicOn(!isMicOn)}
            audioStream={audioStream}
            realtimeTranscript={realtimeTranscript}
            // Truyền status từ VAD để UI hiển thị sóng âm
            isSpeaking={vad.userSpeaking}
          />
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
              <div className="space-y-2">
                {filteredQuestions.map((q) => (
                  <div
                    key={q.id}
                    className={`bg-background border rounded-xl p-3 transition-colors shadow-sm ${
                      animatingIds.has(q.id)
                        ? "animate-ai-match border-green-400"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    {/* Header: Tên và Thời gian */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="w-3 h-3 text-primary" />
                        </div>
                        <span className="font-bold text-foreground text-xs">
                          {q.author_name}
                        </span>
                        {animatingIds.has(q.id) && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-green-50 text-green-700 font-bold flex items-center gap-1 border border-green-200 animate-pulse">
                            <Sparkles className="w-2.5 h-2.5" />
                            {aiMatchedIds.has(q.id) ? "AI matched" : "Answered"}
                          </span>
                        )}
                        {/* Row for engagement badges */}
                        <div className="flex items-center gap-1.5 ml-1">
                          {/* LIKES BADGE - NEW */}
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-pink-50 text-pink-600 font-bold flex items-center gap-1 border border-pink-100">
                            <Heart
                              size={14}
                              className={q.likes > 0 ? "fill-pink-600" : ""}
                            />
                            <span className="text-xs font-bold">
                              {q.likes || 0}
                            </span>
                          </span>

                          {/* SIMILAR BADGE */}
                          {q.group_count > 1 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 font-bold flex items-center gap-1 border border-blue-100">
                              <Users className="w-2.5 h-2.5" />+
                              {q.group_count - 1} similar
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(q.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Nội dung câu hỏi */}
                    <p className="text-sm text-foreground mb-2 leading-snug px-1">
                      {q.content}
                    </p>

                    {/* Thanh hành động - Tất cả dồn về bên PHẢI */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
                      {/* Nút Loa (Voice) - Luôn hiển thị */}
                      <button
                        onClick={() => handleSpeak(q.content)}
                        className="p-1.5 rounded-lg bg-secondary hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors border border-transparent hover:border-primary/20"
                        title="Đọc câu hỏi"
                      >
                        <Mic className="w-3.5 h-3.5" />
                      </button>

                      {/* Trạng thái đã trả lời */}
                      {q.status === "answered" && (
                        <span className="flex items-center gap-1 text-green-600 text-[11px] font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Answered
                        </span>
                      )}

                      {/* Trạng thái đã bỏ qua */}
                      {q.status === "ignored" && (
                        <span className="text-[11px] font-bold text-muted-foreground">
                          Skipped
                        </span>
                      )}

                      {/* Cụm nút bấm khi đang ở trạng thái Pending */}
                      {q.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              updateQuestionStatus(q.id, "ignored")
                            }
                            className="px-3 py-1 rounded-lg text-[11px] font-bold text-muted-foreground bg-secondary hover:bg-secondary/80 transition-colors"
                          >
                            Skip
                          </button>
                          <button
                            onClick={() =>
                              updateQuestionStatus(q.id, "answered")
                            }
                            className="px-3 py-1 rounded-lg text-[11px] font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
                          >
                            Answer
                          </button>
                        </div>
                      )}
                    </div>
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
            <div className="w-full aspect-square rounded-xl bg-white flex items-center justify-center mb-3 p-4">
              {/* Real QR Code Generator */}
              {seminar?.code ? (
                <QRCodeSVG
                  value={joinUrl}
                  size={200}
                  level={"H"} // High error correction
                  includeMargin={false}
                  className="w-full h-full"
                />
              ) : (
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              )}
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
        </aside>
      </div>
    </div>
  );
}
