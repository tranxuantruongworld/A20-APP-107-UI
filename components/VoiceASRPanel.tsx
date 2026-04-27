"use client";

import { Mic, MicOff } from "lucide-react";
import { VoiceVisualizer } from "@/components/VoiceVisualizer";

interface VoiceASRPanelProps {
  isMicOn: boolean;
  onToggleMic: () => void;
  audioStream: MediaStream | null;
  realtimeTranscript: string;
}

export function VoiceASRPanel({
  isMicOn,
  onToggleMic,
  audioStream,
  realtimeTranscript,
}: VoiceASRPanelProps) {
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
    </>
  );
}
