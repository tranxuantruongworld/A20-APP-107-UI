// app/session/[id]/page.tsx
"use client";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { QrCode, ArrowLeft, Mic, MicOff, CheckCircle2 } from "lucide-react";

export default function LiveSession() {
  const { id } = useParams();
  const router = useRouter();
  const [isMicOn, setIsMicOn] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar */}
      <div className="border-b border-slate-800 bg-slate-900/50 p-4 flex justify-between items-center px-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white">
          <ArrowLeft size={18}/> Quay lại
        </button>
        <div className="flex items-center gap-3">
          <span className="bg-red-500 w-2 h-2 rounded-full animate-pulse"></span>
          <span className="text-sm font-bold tracking-widest text-red-500 uppercase">Live: {id}</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
        {/* Sidebar: QR & Control */}
        <div className="col-span-3 border-r border-slate-800 p-8 flex flex-col items-center bg-slate-900/30">
          <div className="bg-white p-4 rounded-3xl mb-6 shadow-[0_0_50px_rgba(79,70,229,0.2)]">
            <QrCode size={180} className="text-slate-950" />
          </div>
          <div className="text-center mb-10">
             <p className="text-slate-500 text-xs font-bold uppercase mb-1">Mã phòng</p>
             <p className="text-4xl font-black text-indigo-400">{id}</p>
          </div>

          <button 
            onClick={() => setIsMicOn(!isMicOn)}
            className={`w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${
              isMicOn ? 'bg-red-600 shadow-lg shadow-red-900/40' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isMicOn ? <><MicOff size={22}/> Dừng AI</> : <><Mic size={22}/> Bật AI Voice</>}
          </button>
        </div>

        {/* Main: Question List */}
        <div className="col-span-9 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold mb-8">Câu hỏi đang chờ</h2>
            
            {/* Question Card */}
            {[1, 2].map((i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-indigo-500/50 transition-all">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-indigo-400 font-bold text-sm underline">Audience_{i}</span>
                  <span className="text-slate-500 text-xs">2 phút trước</span>
                </div>
                <p className="text-xl font-medium leading-relaxed mb-6 italic">
                  "Làm sao để đảm bảo độ chính xác khi AI định danh câu hỏi qua giọng nói?"
                </p>
                <div className="flex gap-4">
                  <button className="bg-white/5 hover:bg-white/10 px-6 py-2 rounded-xl text-sm transition-colors">Bỏ qua</button>
                  <button className="bg-indigo-600/20 text-indigo-400 border border-indigo-600/30 px-6 py-2 rounded-xl text-sm font-bold hover:bg-indigo-600 hover:text-white transition-all">Đang trả lời...</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}