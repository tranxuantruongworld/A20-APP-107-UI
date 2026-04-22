"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { QrCode, ArrowLeft, Mic, MicOff, CheckCircle2, Loader2, MessageSquareOff } from "lucide-react";
import { supabase } from "@/lib/supabase"; // Đảm bảo đường dẫn này đúng

export default function LiveSession() {
  const { id } = useParams(); // Đây là UUID của Seminar từ Database
  const router = useRouter();
  
  const [isMicOn, setIsMicOn] = useState(false);
  const [seminar, setSeminar] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    // 1. Lấy thông tin chi tiết về Seminar (để lấy mã Room Code hiển thị)
    const fetchSeminarData = async () => {
      const { data, error } = await supabase
        .from('seminars')
        .select('*')
        .eq('id', id)
        .single();
      
      if (data) setSeminar(data);
    };

    // 2. Lấy danh sách câu hỏi hiện có
    const fetchQuestions = async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('seminar_id', id)
        .order('created_at', { ascending: false });

      if (data) setQuestions(data);
      setLoading(false);
    };

    fetchSeminarData();
    fetchQuestions();

    // 3. Thiết lập Realtime Subscription
    // Lắng nghe mọi thay đổi (INSERT, UPDATE, DELETE) trong bảng questions của seminar này
    const channel = supabase
      .channel(`seminar_questions_${id}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'questions', 
          filter: `seminar_id=eq.${id}` 
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setQuestions((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setQuestions((prev) => prev.map(q => q.id === payload.new.id ? payload.new : q));
          } else if (payload.eventType === 'DELETE') {
            setQuestions((prev) => prev.filter(q => q.id === payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // Hàm cập nhật trạng thái câu hỏi thủ công (hoặc sẽ do AI gọi sau này)
  const updateQuestionStatus = async (qId: string, status: string) => {
    const { error } = await supabase
      .from('questions')
      .update({ status })
      .eq('id', qId);
    
    if (error) console.error("Lỗi cập nhật:", error.message);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="text-indigo-500 animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar */}
      <div className="border-b border-slate-800 bg-slate-900/50 p-4 flex justify-between items-center px-8">
        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={18}/> Quay lại Dashboard
        </button>
        <div className="flex items-center gap-3">
          <span className="bg-red-500 w-2 h-2 rounded-full animate-pulse"></span>
          <span className="text-sm font-bold tracking-widest text-red-500 uppercase">
            {seminar?.status === 'live' ? 'Live' : 'Ended'}: {seminar?.title}
          </span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
        {/* Sidebar: QR & Control */}
        <div className="col-span-12 lg:col-span-3 border-r border-slate-800 p-8 flex flex-col items-center bg-slate-900/30">
          <div className="bg-white p-4 rounded-3xl mb-6 shadow-[0_0_50px_rgba(79,70,229,0.2)]">
            {/* Link này dẫn đến trang đặt câu hỏi cho khán giả */}
            <QrCode size={180} className="text-slate-950" />
          </div>
          <div className="text-center mb-10">
             <p className="text-slate-500 text-xs font-bold uppercase mb-1">Mã phòng tham gia</p>
             <p className="text-4xl font-black text-indigo-400 tracking-tighter">{seminar?.code}</p>
          </div>

          <button 
            onClick={() => setIsMicOn(!isMicOn)}
            className={`w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${
              isMicOn ? 'bg-red-600 shadow-lg shadow-red-900/40' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isMicOn ? <><MicOff size={22}/> Dừng AI</> : <><Mic size={22}/> Bật AI Voice</>}
          </button>
          <p className="mt-4 text-[10px] text-slate-500 text-center leading-relaxed">
            Hệ thống đang lắng nghe giọng nói để tự động khớp câu hỏi.
          </p>
        </div>

        {/* Main: Question List */}
        <div className="col-span-12 lg:col-span-9 p-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Câu hỏi từ khán giả</h2>
              <span className="bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-xs font-bold">
                {questions.filter(q => q.status === 'pending').length} đang chờ
              </span>
            </div>
            
            {questions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <MessageSquareOff size={48} className="mb-4 opacity-20" />
                <p>Chưa có câu hỏi nào được gửi đến.</p>
              </div>
            ) : (
              questions.map((q) => (
                <div 
                  key={q.id} 
                  className={`p-6 rounded-2xl border transition-all ${
                    q.status === 'answered' 
                    ? 'bg-slate-900/40 border-slate-800 opacity-50' 
                    : 'bg-slate-900 border-slate-800 hover:border-indigo-500/50 shadow-xl shadow-black/20'
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-indigo-400 font-bold text-sm underline tracking-tight">
                      @{q.author_name}
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      {new Date(q.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xl font-medium leading-relaxed mb-6">
                    "{q.content}"
                  </p>
                  
                  {q.status !== 'answered' ? (
                    <div className="flex gap-4">
                      <button 
                        onClick={() => updateQuestionStatus(q.id, 'ignored')}
                        className="bg-white/5 hover:bg-red-500/20 hover:text-red-400 px-6 py-2 rounded-xl text-sm transition-all"
                      >
                        Bỏ qua
                      </button>
                      <button 
                        onClick={() => updateQuestionStatus(q.id, 'answered')}
                        className="bg-indigo-600/20 text-indigo-400 border border-indigo-600/30 px-6 py-2 rounded-xl text-sm font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-lg shadow-indigo-900/10"
                      >
                        Đánh dấu đã trả lời
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-green-500 text-sm font-bold">
                      <CheckCircle2 size={16} /> Đã hoàn thành
                    </div>
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