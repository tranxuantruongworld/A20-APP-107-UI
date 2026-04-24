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
      <div className="bg-card border-b border-border px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/dashboard')} 
            className="w-10 h-10 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center text-foreground transition-colors border border-border"
          >
            <ArrowLeft size={18}/>
          </button>
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold hidden md:block text-foreground">Conference Hub</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
            LIVE
          </span>
          <span className="text-foreground font-medium hidden md:block">{seminar?.title}</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-3 border-r border-border p-8 flex flex-col bg-card">
          {/* QR Code */}
          <div className="bg-white p-6 rounded-2xl mb-6 self-center shadow-lg border-2 border-primary/20">
            <QrCode size={140} className="text-primary" />
          </div>
          
          {/* Room Code */}
          <div className="text-center mb-8">
            <p className="text-muted-foreground text-xs font-bold uppercase mb-3 tracking-widest">Room Code</p>
            <div className="flex items-center justify-center gap-3">
              <p className="text-4xl font-black text-primary tracking-tight">{seminar?.code}</p>
              <button 
                onClick={copyCode}
                className="w-12 h-12 rounded-xl bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors border-2 border-primary/30"
              >
                {copied ? <Check size={20} className="text-emerald-600" /> : <Copy size={20} className="text-primary" />}
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-3 bg-secondary py-2 px-4 rounded-lg inline-block">Share this code with your audience</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-amber-50 rounded-2xl border-2 border-amber-200 p-5 text-center">
              <p className="text-3xl font-black text-amber-600">{pendingQuestions.length}</p>
              <p className="text-sm text-amber-700 font-semibold mt-1">Pending</p>
            </div>
            <div className="bg-emerald-50 rounded-2xl border-2 border-emerald-200 p-5 text-center">
              <p className="text-3xl font-black text-emerald-600">{answeredQuestions.length}</p>
              <p className="text-sm text-emerald-700 font-semibold mt-1">Answered</p>
            </div>
          </div>

          {/* AI Voice Button */}
          <button 
            onClick={() => setIsMicOn(!isMicOn)}
            className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all text-lg border-2 ${
              isMicOn 
                ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200' 
                : 'bg-primary hover:bg-primary/90 text-primary-foreground border-primary shadow-md'
            }`}
          >
            {isMicOn ? <><MicOff size={22}/> Stop AI Voice</> : <><Mic size={22}/> Start AI Voice</>}
          </button>

          {/* Realtime Transcript */}
          <div className="mt-6 flex-1">
            <h3 className="text-muted-foreground text-xs font-bold uppercase mb-3 flex items-center gap-2 tracking-widest">
              {isMicOn && (
                <span className="flex gap-0.5">
                  <span className="w-1.5 h-4 bg-red-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-4 bg-red-500 rounded-full animate-bounce [animation-delay:0.15s]"></span>
                  <span className="w-1.5 h-4 bg-red-500 rounded-full animate-bounce [animation-delay:0.3s]"></span>
                </span>
              )}
              Live Transcript
            </h3>
            <div className="bg-secondary rounded-2xl border-2 border-border p-5 min-h-[120px]">
              {isMicOn ? (
                <p className="text-base leading-relaxed text-foreground italic">
                  {realtimeTranscript || "Listening..."}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground text-center mt-8">
                  Enable AI Voice to see transcript
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Question List */}
        <div className="col-span-12 lg:col-span-9 p-8 overflow-y-auto bg-background">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black flex items-center gap-3 text-foreground">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md">
                  <Zap className="w-5 h-5 text-primary-foreground" />
                </div>
                Questions
                <span className="text-lg text-primary font-bold bg-primary/10 px-4 py-1.5 rounded-xl border border-primary/20">({pendingQuestions.length} pending)</span>
              </h2>
            </div>
            
            {questions.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-24 h-24 rounded-2xl bg-secondary border-2 border-border flex items-center justify-center mx-auto mb-6">
                  <MessageSquareOff size={36} className="text-muted-foreground" />
                </div>
                <p className="text-foreground font-semibold text-lg">No questions yet</p>
                <p className="text-muted-foreground mt-1">Share the room code to start receiving questions</p>
              </div>
            ) : (
              questions.map((q) => (
                <div 
                  key={q.id} 
                  className={`rounded-2xl border-2 p-6 transition-all shadow-sm ${
                    q.status === 'answered' 
                      ? 'bg-emerald-50 border-emerald-200' 
                      : q.status === 'ignored'
                        ? 'bg-muted/30 border-border opacity-60'
                        : 'bg-card border-border hover:border-primary/50 hover:shadow-md'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                        <Users size={16} className="text-primary-foreground" />
                      </div>
                      <div>
                        <span className="font-bold text-primary text-lg">{q.author_name}</span>
                        {q.group_count > 1 && (
                          <span className="ml-3 text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-bold border border-primary/20">
                            +{q.group_count - 1} similar
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-lg border border-border">
                      <Clock size={14} />
                      {new Date(q.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <p className="text-xl font-semibold mb-6 text-foreground leading-relaxed">{q.content}</p>
                  
                  {q.status === 'pending' && (
                    <div className="flex gap-4">
                      <button 
                        onClick={() => updateQuestionStatus(q.id, 'ignored')} 
                        className="bg-secondary hover:bg-secondary/80 px-6 py-3 rounded-xl text-sm font-bold text-muted-foreground transition-colors border border-border"
                      >
                        Skip
                      </button>
                      <button 
                        onClick={() => updateQuestionStatus(q.id, 'answered')} 
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl text-sm font-bold transition-colors shadow-md"
                      >
                        Mark Answered
                      </button>
                    </div>
                  )}
                  
                  {q.status === 'answered' && (
                    <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold bg-emerald-100 px-4 py-2 rounded-xl w-fit border border-emerald-200">
                      <CheckCircle2 size={18} /> Answered
                    </div>
                  )}
                  
                  {q.status === 'ignored' && (
                    <div className="text-muted-foreground text-sm font-medium bg-muted px-4 py-2 rounded-xl w-fit">Skipped</div>
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
