"use client";

import { Mic, MicOff } from "lucide-react";
import { VoiceVisualizer } from "@/components/VoiceVisualizer";
import { useTranslations } from "next-intl";

interface VoiceASRPanelProps {
  isMicOn: boolean;
  onToggleMic: () => void;
  audioStream: MediaStream | null;
  realtimeTranscript: string;
  isSpeaking: boolean; // Prop mới từ VAD
}

export function VoiceASRPanel({
  isMicOn,
  onToggleMic,
  audioStream,
  realtimeTranscript,
  isSpeaking,
}: VoiceASRPanelProps) {
  const t = useTranslations();
  return (
    <>
      {/* AI Voice Button */}
      <button
        onClick={onToggleMic}
        className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all text-lg border-2 ${
          isMicOn
            ? "bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
            : "bg-primary hover:bg-primary/90 text-primary-foreground border-primary shadow-md"
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

      {/* Realtime Transcript Container */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isMicOn && (
              <span className="flex gap-1">
                {/* Nếu isSpeaking = true thì các chấm đỏ nháy mạnh hơn */}
                <span
                  className={`w-1.5 h-1.5 rounded-full bg-red-500 ${isSpeaking ? "animate-ping" : "animate-pulse"}`}
                />
                <span
                  className={`w-1.5 h-1.5 rounded-full bg-red-500 ${isSpeaking ? "animate-ping" : "animate-pulse"} [animation-delay:150ms]`}
                />
                <span
                  className={`w-1.5 h-1.5 rounded-full bg-red-500 ${isSpeaking ? "animate-ping" : "animate-pulse"} [animation-delay:300ms]`}
                />
              </span>
            )}
            <h3 className="font-bold text-foreground">
              {t("voice.liveTranscript")}
            </h3>
          </div>

          {/* Badge trạng thái Voice Activity */}
          {isMicOn && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${
                isSpeaking
                  ? "bg-green-100 text-green-600"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {isSpeaking ? t("voice.speaking") : t("voice.silent")}
            </span>
          )}
        </div>

        {isMicOn && audioStream && (
          <div className="w-full mb-4 h-8 flex items-center justify-center">
            {/* Visualizer sẽ trông thật hơn khi kết hợp với audioStream */}
            <VoiceVisualizer stream={audioStream} />
          </div>
        )}

        <div className="min-h-[200px] max-h-[400px] overflow-y-auto rounded-xl bg-secondary/50 p-4 text-sm text-foreground leading-relaxed border border-border/50">
          {isMicOn ? (
            <div>
              {realtimeTranscript ? (
                <p>
                  {realtimeTranscript}
                  {isSpeaking && (
                    <span className="inline-block w-0.5 h-3.5 bg-primary ml-0.5 align-middle animate-pulse" />
                  )}
                </p>
              ) : (
                <p className="text-muted-foreground italic flex items-center gap-2">
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
            </div>
          )}
        </div>
      </div>
    </>
  );
}
