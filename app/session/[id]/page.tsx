"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { QrCode, ArrowLeft, Mic, MicOff, CheckCircle2, Loader2, MessageSquareOff, Waveform } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LiveSession() {
  const { id } = useParams();
  const router = useRouter();
  
  const [isMicOn, setIsMicOn] = useState(false);
  const [seminar, setSeminar] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- NEW STATES FOR REALTIME TEXT ---
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

  // --- SPEECH TO TEXT LOGIC ---
  useEffect(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true; // Crucial for realtime display
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

      // Update the UI with what is being said right now
      setRealtimeTranscript(finalTranscript || interimTranscript);

      // If we have a final sentence, send it to AI to match questions
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
      setRealtimeTranscript(""); // Clear text when off
    }
  }, [isMicOn]);

  const handleAiMatch = async (text: string) => {
    // 1. Filter only 'pending' questions
    const pending = questions.filter(q => q.status === 'pending');
    if (pending.length === 0) return;

    // 2. Optimization: Don't process very short fragments (e.g., "Yes", "Hello")
    if (text.trim().split(" ").length < 5) return;
    try {
      const { data, error } = await supabase.functions.invoke('ai-voice-match', {
        body: { 
          transcript: text, 
          questions: pending.map(q => ({ id: q.id, content: q.content })) 
        }
      });
      console.log("data", data)
      if (data?.matches.length > 0) {
        // Highlight the question briefly before moving it (Optional UX)
        console.log(`AI confirmed you answered: ${data?.matches[0]}`);
        await updateQuestionStatus(data.matches[0]?.id, 'answered');
      }
    } catch (err) {
      console.error("AI Match Error:", err);
    }
  };

  const updateQuestionStatus = async (qId: string, status: string) => {
    await supabase.from('questions').update({ status }).eq('id', qId);
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="text-indigo-500 animate-spin" size={40} /></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar */}
      <div className="border-b border-slate-800 bg-slate-900/50 p-4 flex justify-between items-center px-8">
        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-white">
          <ArrowLeft size={18}/> Quay lại
        </button>
        <div className="flex items-center gap-3 text-red-500 font-bold uppercase text-sm">
          <span className="bg-red-500 w-2 h-2 rounded-full animate-pulse"></span>
          LIVE: {seminar?.title}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-3 border-r border-slate-800 p-8 flex flex-col bg-slate-900/30">
          <div className="bg-white p-4 rounded-3xl mb-6 self-center shadow-lg">
            <QrCode size={160} className="text-slate-950" />
          </div>
          
          <div className="text-center mb-6">
             <p className="text-slate-500 text-xs font-bold uppercase mb-1">Mã phòng</p>
             <p className="text-4xl font-black text-indigo-400 tracking-tighter">{seminar?.code}</p>
          </div>

          <button 
            onClick={() => setIsMicOn(!isMicOn)}
            className={`w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${
              isMicOn ? 'bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isMicOn ? <><MicOff size={22}/> Dừng AI</> : <><Mic size={22}/> Bật AI Voice</>}
          </button>

          {/* --- REALTIME TRANSCRIPT DISPLAY --- */}
          <div className="mt-8 flex-1">
             <h3 className="text-slate-500 text-[10px] font-bold uppercase mb-3 flex items-center gap-2">
                {isMicOn && <span className="flex gap-1"><span className="w-1 h-3 bg-red-500 animate-bounce"></span><span className="w-1 h-3 bg-red-500 animate-bounce [animation-delay:0.2s]"></span></span>}
                Giọng nói hiện tại
             </h3>
             <div className="bg-black/40 rounded-xl p-4 min-h-[120px] border border-slate-800/50">
                {isMicOn ? (
                    <p className="text-sm leading-relaxed text-slate-300 italic">
                        {realtimeTranscript || "Đang lắng nghe..."}
                    </p>
                ) : (
                    <p className="text-xs text-slate-600 text-center mt-8">Micro đang tắt</p>
                )}
             </div>
          </div>
        </div>

        {/* Question List */}
        <div className="col-span-12 lg:col-span-9 p-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold mb-8">Câu hỏi ({questions.filter(q => q.status === 'pending').length})</h2>
            {questions.length === 0 ? (
                <div className="py-20 text-center text-slate-500"><MessageSquareOff size={48} className="mx-auto mb-4 opacity-20" />Chưa có câu hỏi.</div>
            ) : (
              questions.map((q) => (
                <div key={q.id} className={`p-6 rounded-2xl border transition-all ${
                    q.status === 'answered' ? 'bg-slate-900/40 border-slate-800 opacity-50' : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center mb-4 text-xs">
                    <span className="text-indigo-400 font-bold">@{q.author_name}</span>
                    <span className="text-slate-500">{new Date(q.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xl font-medium mb-6">"{q.content}"</p>
                  {q.status !== 'answered' ? (
                    <div className="flex gap-4">
                      <button onClick={() => updateQuestionStatus(q.id, 'ignored')} className="bg-white/5 px-6 py-2 rounded-xl text-sm">Bỏ qua</button>
                      <button onClick={() => updateQuestionStatus(q.id, 'answered')} className="bg-indigo-600 px-6 py-2 rounded-xl text-sm font-bold">Đã xong</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-green-500 text-sm font-bold"><CheckCircle2 size={16} /> Đã trả lời</div>
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