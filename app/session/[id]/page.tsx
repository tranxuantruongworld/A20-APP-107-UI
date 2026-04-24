"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { QrCode, ArrowLeft, Mic, MicOff, CheckCircle2, Loader2, MessageSquareOff, Sparkles, Copy, Check, Users, Clock, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

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

  useEffect(() => {
    if (!id) return;

    const fetchInitialData = async () => {
      const { data: sem } = await supabase.from('seminars').select('*').eq('id', id).single();
      const { data: qs } = await supabase.from('questions').select('*').eq('seminar_id', id).order('created_at', { ascending: false });
      if (sem) setSeminar(sem);
      if (qs) setQuestions(qs);
      setLoading(false);
    };

    fetchInitialData();

    const channel = supabase.channel(`live_${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions', filter: `seminar_id=eq.${id}` }, 
      (payload) => {
        if (payload.eventType === 'INSERT') setQuestions(prev => [payload.new, ...prev]);
        if (payload.eventType === 'UPDATE') setQuestions(prev => prev.map(q => q.id === payload.new.id ? payload.new : q));
        if (payload.eventType === 'DELETE') setQuestions(prev => prev.filter(q => q.id === payload.old.id));
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  useEffect(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
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
    if (isMicOn) {
      recognitionRef.current?.start();
    } else {
      recognitionRef.current?.stop();
      setRealtimeTranscript("");
    }
  }, [isMicOn]);

  const handleAiMatch = async (text: string) => {
    const pending = questions.filter(q => q.status === 'pending');
    if (pending.length === 0) return;

    if (text.trim().split(" ").length < 5) return;
    try {
      const { data, error } = await supabase.functions.invoke('ai-voice-match', {
        body: { 
          transcript: text, 
          questions: pending.map(q => ({ id: q.id, content: q.content })) 
        }
      });
      if (data?.matches.length > 0) {
        console.log(`AI confirmed you answered: ${data.matches[0]?.id}`);
        await updateQuestionStatus(data.matches[0]?.id, 'answered');
      }
    } catch (err) {
      console.error("AI Match Error:", err);
    }
  };

  const updateQuestionStatus = async (qId: string, status: string) => {
    await supabase.from('questions').update({ status }).eq('id', qId);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(seminar?.code || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pendingQuestions = questions.filter(q => q.status === 'pending');
  const answeredQuestions = questions.filter(q => q.status === 'answered');

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
        <Loader2 className="relative text-primary animate-spin" size={48} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Bar */}
      <div className="glass border-b border-border/50 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/dashboard')} 
            className="w-10 h-10 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={18}/>
          </button>
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <span className="text-lg font-bold hidden md:block">Conference Hub</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-green-500 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            LIVE
          </span>
          <span className="text-muted-foreground hidden md:block">{seminar?.title}</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-3 border-r border-border/50 p-8 flex flex-col glass">
          {/* QR Code */}
          <div className="bg-foreground p-6 rounded-2xl mb-6 self-center shadow-2xl shadow-black/30">
            <QrCode size={140} className="text-background" />
          </div>
          
          {/* Room Code */}
          <div className="text-center mb-8">
            <p className="text-muted-foreground text-xs font-semibold uppercase mb-2 tracking-wider">Room Code</p>
            <div className="flex items-center justify-center gap-3">
              <p className="text-4xl font-black text-gradient-gold tracking-tight">{seminar?.code}</p>
              <button 
                onClick={copyCode}
                className="w-10 h-10 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
              >
                {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} className="text-muted-foreground" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Share this code with your audience</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="glass rounded-xl border border-border/50 p-4 text-center">
              <p className="text-2xl font-bold text-primary">{pendingQuestions.length}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div className="glass rounded-xl border border-border/50 p-4 text-center">
              <p className="text-2xl font-bold text-green-500">{answeredQuestions.length}</p>
              <p className="text-xs text-muted-foreground">Answered</p>
            </div>
          </div>

          {/* AI Voice Button */}
          <button 
            onClick={() => setIsMicOn(!isMicOn)}
            className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all ${
              isMicOn 
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30' 
                : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20'
            }`}
          >
            {isMicOn ? <><MicOff size={20}/> Stop AI Voice</> : <><Mic size={20}/> Start AI Voice</>}
          </button>

          {/* Realtime Transcript */}
          <div className="mt-6 flex-1">
            <h3 className="text-muted-foreground text-xs font-semibold uppercase mb-3 flex items-center gap-2">
              {isMicOn && (
                <span className="flex gap-0.5">
                  <span className="w-1 h-3 bg-red-500 rounded-full animate-bounce"></span>
                  <span className="w-1 h-3 bg-red-500 rounded-full animate-bounce [animation-delay:0.15s]"></span>
                  <span className="w-1 h-3 bg-red-500 rounded-full animate-bounce [animation-delay:0.3s]"></span>
                </span>
              )}
              Live Transcript
            </h3>
            <div className="glass rounded-xl border border-border/50 p-4 min-h-[120px]">
              {isMicOn ? (
                <p className="text-sm leading-relaxed text-foreground/80 italic">
                  {realtimeTranscript || "Listening..."}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground text-center mt-8">
                  Enable AI Voice to see transcript
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Question List */}
        <div className="col-span-12 lg:col-span-9 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Zap className="w-6 h-6 text-primary" />
                Questions
                <span className="text-lg text-muted-foreground font-normal">({pendingQuestions.length} pending)</span>
              </h2>
            </div>
            
            {questions.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-20 h-20 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-6">
                  <MessageSquareOff size={32} className="text-muted-foreground/30" />
                </div>
                <p className="text-muted-foreground">No questions yet</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Share the room code to start receiving questions</p>
              </div>
            ) : (
              questions.map((q) => (
                <div 
                  key={q.id} 
                  className={`glass rounded-2xl border p-6 transition-all ${
                    q.status === 'answered' 
                      ? 'border-green-500/20 opacity-60' 
                      : q.status === 'ignored'
                        ? 'border-border/30 opacity-40'
                        : 'border-border/50 hover:border-primary/30'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users size={14} className="text-primary" />
                      </div>
                      <div>
                        <span className="font-semibold text-foreground">{q.author_name}</span>
                        {q.group_count > 1 && (
                          <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            +{q.group_count - 1} similar
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(q.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <p className="text-xl font-medium mb-6 text-foreground leading-relaxed">{q.content}</p>
                  
                  {q.status === 'pending' && (
                    <div className="flex gap-3">
                      <button 
                        onClick={() => updateQuestionStatus(q.id, 'ignored')} 
                        className="bg-secondary hover:bg-secondary/80 px-5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground transition-colors"
                      >
                        Skip
                      </button>
                      <button 
                        onClick={() => updateQuestionStatus(q.id, 'answered')} 
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-primary/20"
                      >
                        Mark Answered
                      </button>
                    </div>
                  )}
                  
                  {q.status === 'answered' && (
                    <div className="flex items-center gap-2 text-green-500 text-sm font-semibold">
                      <CheckCircle2 size={16} /> Answered
                    </div>
                  )}
                  
                  {q.status === 'ignored' && (
                    <div className="text-muted-foreground text-sm">Skipped</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
