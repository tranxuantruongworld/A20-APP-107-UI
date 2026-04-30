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
  Star,
  Copy,
  Check,
  Users,
  Clock,
  Zap,
  Heart,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { VoiceASRPanel } from "@/components/VoiceASRPanel";
import { useTranslations } from "next-intl";
import { Settings } from "lucide-react";
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

  const [filter, setFilter] = useState<FilterType>("pending");
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const fullTranscriptRef = useRef("");
  const t = useTranslations();

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
    (typeof window !== "undefined" ? window.location.origin : "") ||
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

  const saveAsrLog = async (
    transcript: string,
    audioBlob: Blob,
    durationMs: number,
  ) => {
    try {
      const now = new Date();
      const datePart = now.toLocaleDateString("vi-VN").replace(/\//g, "-"); // "28-04-2026"
      const timePart = now
        .toLocaleTimeString("vi-VN", { hour12: false })
        .replace(/:/g, "-");
      const fileName = `${id}/${timePart}_${datePart}.wav`;
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
        asr_model: "web-speech",
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

      const durationMs = (audio.length / 16000) * 1000;
      await saveAsrLog(finalSTT, audioBlob, durationMs);
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
    {
      key: "pending",
      label: t("session.pending"),
      count: pendingQuestions.length,
    },
    {
      key: "answered",
      label: t("session.answered"),
      count: answeredQuestions.length,
    },
    {
      key: "ignored",
      label: t("session.ignored"),
      count: ignoredQuestions.length,
    },
    { key: "all", label: t("session.all"), count: questions.length },
  ];

  const [playingTTSId, setPlayingTTSId] = useState<string | null>(null);

  const handleSpeak = async (questionId: string, text: string) => {
    if (playingTTSId) return;
    setPlayingTTSId(questionId);

    try {
      const formData = new FormData();
      formData.append("text", text);
      let backendUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        "";
      if (
        !backendUrl &&
        typeof window !== "undefined" &&
        ["3000", "3001"].includes(window.location.port)
      ) {
        backendUrl = window.location.origin.replace(
          window.location.port,
          "8000",
        );
      }
      const res = await fetch(`${backendUrl}/api/tts/generate`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => setPlayingTTSId(null);
        audio.play().catch((e) => {
          console.error("Audio playback error:", e);
          setPlayingTTSId(null);
        });
      } else {
        console.error("TTS generation failed");
        setPlayingTTSId(null);
      }
    } catch (err) {
      console.error("Error calling TTS backend:", err);
      setPlayingTTSId(null);
    }
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
      <div className="border-b border-border bg-card/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-10 h-10 rounded-xl bg-secondary hover:bg-primary/10 hover:text-primary flex items-center justify-center text-foreground transition-all border border-border"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
              <Star className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground text-lg tracking-tight">
              HoiThao
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
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
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {t("session.questions")}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {filteredQuestions.length} {t("session.shown")}
                  </p>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 pb-4 border-b border-border overflow-x-auto">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-4 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                    filter === tab.key
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "bg-secondary hover:bg-secondary/80 text-muted-foreground border border-border"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
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
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mb-6">
                  <MessageSquareOff className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="font-bold text-foreground text-lg mb-2">
                  {t("session.noQuestionsToShow")}
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {t("session.noQuestionsHint")}
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
                            {aiMatchedIds.has(q.id)
                              ? t("session.aiMatched")
                              : t("session.answeredLabel")}
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
                              {q.group_count - 1} {t("session.similar")}
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
                        onClick={() => handleSpeak(q.id, q.content)}
                        disabled={!!playingTTSId}
                        className={`p-1.5 rounded-lg transition-colors border ${
                          playingTTSId === q.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : playingTTSId
                              ? "bg-secondary text-muted-foreground/50 border-transparent cursor-not-allowed"
                              : "bg-secondary hover:bg-primary/10 hover:text-primary text-muted-foreground border-transparent hover:border-primary/20"
                        }`}
                        title={t("session.readQuestion")}
                      >
                        {playingTTSId === q.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Mic className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Trạng thái đã trả lời */}
                      {q.status === "answered" && (
                        <span className="flex items-center gap-1 text-green-600 text-[11px] font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />{" "}
                          {t("session.answeredLabel")}
                        </span>
                      )}

                      {/* Trạng thái đã bỏ qua */}
                      {q.status === "ignored" && (
                        <span className="text-[11px] font-bold text-muted-foreground">
                          {t("session.skippedLabel")}
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
                            {t("session.skip")}
                          </button>
                          <button
                            onClick={() =>
                              updateQuestionStatus(q.id, "answered")
                            }
                            className="px-3 py-1 rounded-lg text-[11px] font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
                          >
                            {t("session.answer")}
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
              {t("session.scanToJoin")}
            </p>
          </div>

          {/* Room Code */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2">
              {t("session.roomCode")}
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
              {t("session.shareCode")}
            </p>
          </div>

          {/* Admin Button */}
          <Link
            href={`/session/${id}/admin`}
            className="flex items-center justify-center gap-2 w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all shadow-lg shadow-primary/25"
          >
            <Settings className="w-5 h-5" />
            Admin Panel
          </Link>
        </aside>
      </div>
    </div>
  );
}
