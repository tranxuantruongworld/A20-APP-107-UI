"use client";

import { useState, useRef, useCallback } from "react";
import {
  Mic,
  MicOff,
  Trophy,
  BarChart3,
  Clock,
  Sparkles,
  LayoutDashboard,
  RotateCcw,
  Loader2,
  ThumbsUp,
  Minus,
  AlertCircle,
  Key,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { VoiceVisualizer } from "@/components/VoiceVisualizer";
import Link from "next/link";

interface TranscriptionResult {
  text: string;
  model: string;
  latencyMs: number;
}

interface BenchmarkRound {
  id: string;
  modelA: TranscriptionResult;
  modelB: TranscriptionResult;
  winner: "A" | "B" | "tie" | null;
  audioDurationMs: number;
}

const ASR_MODELS = [
  { value: "whisper-1", label: "Whisper-1" },
  { value: "gpt-4o-transcribe", label: "GPT-4o Transcribe" },
  { value: "gpt-4o-mini-transcribe", label: "GPT-4o Mini Transcribe" },
];

export default function BenchmarkPage() {
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [modelA, setModelA] = useState("whisper-1");
  const [modelB, setModelB] = useState("gpt-4o-mini-transcribe");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [rounds, setRounds] = useState<BenchmarkRound[]>([]);
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordStartRef = useRef<number>(0);

  const stats = {
    total: rounds.filter((r) => r.winner).length,
    aWins: rounds.filter((r) => r.winner === "A").length,
    bWins: rounds.filter((r) => r.winner === "B").length,
    ties: rounds.filter((r) => r.winner === "tie").length,
    avgLatencyA:
      rounds.length > 0
        ? Math.round(
            rounds.reduce((s, r) => s + r.modelA.latencyMs, 0) / rounds.length,
          )
        : 0,
    avgLatencyB:
      rounds.length > 0
        ? Math.round(
            rounds.reduce((s, r) => s + r.modelB.latencyMs, 0) / rounds.length,
          )
        : 0,
  };

  const transcribeAudio = useCallback(
    async (audioBlob: Blob, model: string): Promise<TranscriptionResult> => {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("model", model);
      if (apiKey) formData.append("apiKey", apiKey);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Transcription failed");
      }

      return res.json();
    },
    [apiKey],
  );

  const startRecording = useCallback(async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);

      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      audioChunksRef.current = [];
      recordStartRef.current = Date.now();
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
    } catch {
      setError("Could not access microphone. Please allow mic permission.");
    }
  }, []);

  const stopRecording = useCallback(async () => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === "inactive") return;

    setIsRecording(false);
    setIsProcessing(true);

    const audioDurationMs = Date.now() - recordStartRef.current;

    await new Promise<void>((resolve) => {
      mr.onstop = () => resolve();
      mr.stop();
    });

    if (audioStream) {
      audioStream.getTracks().forEach((t) => t.stop());
      setAudioStream(null);
    }

    const audioBlob = new Blob(audioChunksRef.current, {
      type: "audio/webm",
    });
    audioChunksRef.current = [];

    if (audioBlob.size < 1000) {
      setError("Recording too short. Please speak for at least 1 second.");
      setIsProcessing(false);
      return;
    }

    try {
      const [resultA, resultB] = await Promise.all([
        transcribeAudio(audioBlob, modelA),
        transcribeAudio(audioBlob, modelB),
      ]);

      const round: BenchmarkRound = {
        id: crypto.randomUUID(),
        modelA: resultA,
        modelB: resultB,
        winner: null,
        audioDurationMs,
      };

      setRounds((prev) => [round, ...prev]);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to transcribe";
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  }, [modelA, modelB, audioStream, transcribeAudio]);

  const handleVote = async (
    roundId: string,
    winner: "A" | "B" | "tie",
  ) => {
    setRounds((prev) =>
      prev.map((r) => (r.id === roundId ? { ...r, winner } : r)),
    );

    const round = rounds.find((r) => r.id === roundId);
    if (!round) return;

    try {
      await supabase.from("asr_benchmarks").insert({
        model_a_name: round.modelA.model,
        model_a_text: round.modelA.text,
        model_a_ms: round.modelA.latencyMs,
        model_b_name: round.modelB.model,
        model_b_text: round.modelB.text,
        model_b_ms: round.modelB.latencyMs,
        duration_ms: round.audioDurationMs,
        winner,
      });
    } catch (err) {
      console.error("Failed to save benchmark result:", err);
    }
  };

  const resetBenchmark = () => {
    setRounds([]);
    setError("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">
              ASR Benchmark
            </span>
          </Link>
          <Link
            href="/dashboard"
            className="text-primary font-medium text-sm flex items-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-foreground mb-3">
            <span className="text-gradient-gold">ASR Model</span> Benchmark
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Record your voice, compare two AI speech-to-text models
            side-by-side, and vote for the best transcription.
          </p>
        </div>

        {/* API Key Input */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Key className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-foreground">OpenAI API Key</h3>
          </div>
          <div className="flex gap-3">
            <input
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="flex-1 px-4 py-3 rounded-xl border border-border bg-secondary/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="px-4 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
            >
              {showApiKey ? "Hide" : "Show"}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Your key is only sent to our server for transcription and is never
            stored.
          </p>
        </div>

        {/* Model Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <label className="block text-sm font-bold text-foreground mb-3">
              Model A
            </label>
            <select
              value={modelA}
              onChange={(e) => setModelA(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {ASR_MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <label className="block text-sm font-bold text-foreground mb-3">
              Model B
            </label>
            <select
              value={modelB}
              onChange={(e) => setModelB(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {ASR_MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Recording Controls */}
        <div className="bg-card border border-border rounded-2xl p-8 mb-8 shadow-sm text-center">
          {error && (
            <div className="mb-4 flex items-center gap-2 justify-center text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {isProcessing ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-muted-foreground font-medium">
                Transcribing with both models...
              </p>
            </div>
          ) : (
            <>
              {isRecording && audioStream && (
                <div className="mb-6 max-w-xs mx-auto">
                  <VoiceVisualizer stream={audioStream} />
                </div>
              )}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!apiKey}
                className={`w-full max-w-md mx-auto py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all text-lg border-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isRecording
                    ? "bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground border-primary shadow-md"
                }`}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-6 h-6" /> Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="w-6 h-6" /> Start Recording
                  </>
                )}
              </button>
              {!apiKey && (
                <p className="text-xs text-muted-foreground mt-3">
                  Enter your OpenAI API key above to start benchmarking.
                </p>
              )}
            </>
          )}
        </div>

        {/* Stats Bar */}
        {rounds.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <StatCard
              icon={<BarChart3 className="w-5 h-5 text-primary" />}
              label="Rounds"
              value={String(stats.total)}
            />
            <StatCard
              icon={<Trophy className="w-5 h-5 text-emerald-600" />}
              label={`${ASR_MODELS.find((m) => m.value === modelA)?.label ?? "A"} Wins`}
              value={String(stats.aWins)}
            />
            <StatCard
              icon={<Trophy className="w-5 h-5 text-blue-600" />}
              label={`${ASR_MODELS.find((m) => m.value === modelB)?.label ?? "B"} Wins`}
              value={String(stats.bWins)}
            />
            <StatCard
              icon={<Minus className="w-5 h-5 text-amber-600" />}
              label="Ties"
              value={String(stats.ties)}
            />
            <StatCard
              icon={<Clock className="w-5 h-5 text-purple-600" />}
              label="Avg Latency"
              value={`${stats.avgLatencyA} / ${stats.avgLatencyB}ms`}
            />
          </div>
        )}

        {/* Reset */}
        {rounds.length > 0 && (
          <div className="flex justify-end mb-6">
            <button
              onClick={resetBenchmark}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Reset All Rounds
            </button>
          </div>
        )}

        {/* Rounds */}
        <div className="space-y-6">
          {rounds.map((round, i) => (
            <RoundCard
              key={round.id}
              round={round}
              index={rounds.length - i}
              onVote={(w) => handleVote(round.id, w)}
            />
          ))}
        </div>

        {rounds.length === 0 && !isRecording && !isProcessing && (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Mic className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              Ready to benchmark
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Select two ASR models, enter your API key, and hit record. Speak
              naturally — both models will transcribe simultaneously.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}

function RoundCard({
  round,
  index,
  onVote,
}: {
  round: BenchmarkRound;
  index: number;
  onVote: (w: "A" | "B" | "tie") => void;
}) {
  const voted = round.winner !== null;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-foreground">Round {index}</h3>
        <span className="text-xs text-muted-foreground">
          Audio: {(round.audioDurationMs / 1000).toFixed(1)}s
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* Model A */}
        <div
          className={`rounded-xl border p-4 transition-all ${
            round.winner === "A"
              ? "border-emerald-300 bg-emerald-50/50"
              : "border-border"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-foreground">
              Model A:{" "}
              <span className="text-primary">{round.modelA.model}</span>
            </span>
            <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded-md">
              {round.modelA.latencyMs}ms
            </span>
          </div>
          <p className="text-sm text-foreground leading-relaxed min-h-[3rem]">
            {round.modelA.text || (
              <span className="text-muted-foreground italic">
                No transcription
              </span>
            )}
          </p>
        </div>

        {/* Model B */}
        <div
          className={`rounded-xl border p-4 transition-all ${
            round.winner === "B"
              ? "border-blue-300 bg-blue-50/50"
              : "border-border"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-foreground">
              Model B:{" "}
              <span className="text-primary">{round.modelB.model}</span>
            </span>
            <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded-md">
              {round.modelB.latencyMs}ms
            </span>
          </div>
          <p className="text-sm text-foreground leading-relaxed min-h-[3rem]">
            {round.modelB.text || (
              <span className="text-muted-foreground italic">
                No transcription
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Voting */}
      {voted ? (
        <div className="text-center">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
            <Trophy className="w-4 h-4" />
            {round.winner === "tie"
              ? "Voted: Tie"
              : `Winner: Model ${round.winner} (${round.winner === "A" ? round.modelA.model : round.modelB.model})`}
          </span>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => onVote("A")}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-all"
          >
            <ThumbsUp className="w-4 h-4" /> Model A is better
          </button>
          <button
            onClick={() => onVote("tie")}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm border-2 border-amber-200 text-amber-700 hover:bg-amber-50 transition-all"
          >
            <Minus className="w-4 h-4" /> Tie
          </button>
          <button
            onClick={() => onVote("B")}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm border-2 border-blue-200 text-blue-700 hover:bg-blue-50 transition-all"
          >
            <ThumbsUp className="w-4 h-4" /> Model B is better
          </button>
        </div>
      )}
    </div>
  );
}
