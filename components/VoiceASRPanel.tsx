"use client";

import { useState } from "react";
import {
  Mic,
  MicOff,
  Users,
  Volume2,
  Brain,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { VoiceVisualizer } from "@/components/VoiceVisualizer";
import { useTranslations } from "next-intl";

interface TranscriptEntry {
  id: string;
  text: string;
  speaker: "audience" | "speaker";
  timestamp: Date;
  isQuestion?: boolean;
  matchedAnswer?: string;
}

interface VoiceASRPanelProps {
  isMicOn: boolean;
  onToggleMic: () => void;
  audioStream: MediaStream | null;
  realtimeTranscript: string;
  isSpeaking: boolean;
}

export function VoiceASRPanel({
  isMicOn,
  onToggleMic,
  audioStream,
  realtimeTranscript,
  isSpeaking,
}: VoiceASRPanelProps) {
  const t = useTranslations();
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="space-y-4">
      {/* AI Voice Button */}
      <button
        onClick={onToggleMic}
        className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all text-lg ${
          isMicOn
            ? "bg-destructive/10 hover:bg-destructive/20 text-destructive border-2 border-destructive/30"
            : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
        }`}
      >
        {isMicOn ? (
          <>
            <MicOff className="w-5 h-5" /> {t("voice.stopAIVoice")}
          </>
        ) : (
          <>
            <Mic className="w-5 h-5" /> {t("voice.startAIVoice")}
          </>
        )}
      </button>

      {/* Info Panel */}
      <button
        onClick={() => setShowInfo(!showInfo)}
        className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border hover:bg-secondary/70 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Cách Voice AI hoạt động
          </span>
        </div>
        {showInfo ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {showInfo && (
        <div className="p-4 rounded-xl bg-accent/10 border border-accent/30 space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="font-medium text-foreground">Khán giả</p>
              <p className="text-muted-foreground text-xs">
                AI nhận diện câu hỏi từ người tham dự và tự động tạo câu hỏi mới
                trên dashboard
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Volume2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Diễn giả</p>
              <p className="text-muted-foreground text-xs">
                AI nhận diện câu trả lời và tự động khớp với câu hỏi tương ứng
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <Brain className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">AI xử lý</p>
              <p className="text-muted-foreground text-xs">
                Tự động phân loại, gom nhóm, ranking câu hỏi và đánh dấu đã trả
                lời
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Speaker Classification Indicator */}
      {isMicOn && (
        <div className="grid grid-cols-2 gap-3">
          <div
            className={`p-3 rounded-xl border transition-all ${
              isSpeaking
                ? "bg-accent/10 border-accent/30"
                : "bg-secondary/30 border-border"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold text-foreground">
                Khán giả
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">Câu hỏi mới</p>
          </div>
          <div
            className={`p-3 rounded-xl border transition-all ${
              !isSpeaking && isMicOn
                ? "bg-primary/10 border-primary/30"
                : "bg-secondary/30 border-border"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Volume2 className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-foreground">
                Diễn giả
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">Câu trả lời</p>
          </div>
        </div>
      )}

      {/* Realtime Transcript Container */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isMicOn && (
              <span className="flex gap-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full bg-primary ${isSpeaking ? "animate-ping" : "animate-pulse"}`}
                />
                <span
                  className={`w-1.5 h-1.5 rounded-full bg-primary ${isSpeaking ? "animate-ping" : "animate-pulse"} [animation-delay:150ms]`}
                />
                <span
                  className={`w-1.5 h-1.5 rounded-full bg-primary ${isSpeaking ? "animate-ping" : "animate-pulse"} [animation-delay:300ms]`}
                />
              </span>
            )}
            <h3 className="font-bold text-foreground">
              {t("voice.liveTranscript")}
            </h3>
          </div>

          {/* Badge Voice Activity */}
          {isMicOn && (
            <span
              className={`text-[10px] px-3 py-1 rounded-full font-bold transition-colors ${
                isSpeaking
                  ? "bg-accent/20 text-foreground border border-accent/30"
                  : "bg-secondary text-muted-foreground border border-border"
              }`}
            >
              {isSpeaking ? t("voice.speaking") : t("voice.silent")}
            </span>
          )}
        </div>

        {isMicOn && audioStream && (
          <div className="w-full mb-4 h-8 flex items-center justify-center">
            <VoiceVisualizer stream={audioStream} />
          </div>
        )}

        <div className="min-h-[200px] max-h-[400px] overflow-y-auto rounded-xl bg-secondary/50 p-4 text-sm text-foreground leading-relaxed border border-border/50">
          {isMicOn ? (
            <div className="space-y-3">
              {/* Current Transcript */}
              {realtimeTranscript ? (
                <div className="p-3 rounded-xl bg-card border-2 border-primary/30">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-bold text-primary uppercase">
                      Dang xu ly...
                    </span>
                  </div>
                  <p className="text-sm text-foreground">
                    {realtimeTranscript}
                    {isSpeaking && (
                      <span className="inline-block w-0.5 h-3.5 bg-primary ml-0.5 align-middle animate-pulse" />
                    )}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground italic flex items-center gap-2 p-3">
                  <span className="flex h-2 w-2 mb-[-2px]">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  {t("voice.listening")}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[160px] text-center">
              <MicOff className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-muted-foreground italic">
                {t("voice.enableToSee")}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Bat Voice AI de AI tu dong nhan dien cau hoi va cau tra loi
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
