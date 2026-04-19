"use client";
import { Mic, MessageSquare, Users, Settings, PlayCircle } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white p-6 flex flex-col">
        <div className="text-xl font-bold mb-10 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">V</div>
          VoiceAgent
        </div>
        <nav className="space-y-4 flex-1">
          <a href="#" className="flex items-center gap-3 bg-blue-600 p-2 rounded-lg"><Mic size={20}/> Trực tiếp</a>
          <a href="#" className="flex items-center gap-3 text-slate-400 hover:text-white p-2"><MessageSquare size={20}/> Lịch sử Q&A</a>
          <a href="#" className="flex items-center gap-3 text-slate-400 hover:text-white p-2"><Users size={20}/> Thính giả</a>
        </nav>
        <div className="pt-6 border-t border-slate-800">
          <a href="#" className="flex items-center gap-3 text-slate-400 p-2"><Settings size={20}/> Cấu hình hệ thống</a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Điều hành Hội thảo Trực tiếp</h2>
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-sm font-medium text-slate-600">Đang hoạt động</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Voice Visualization Card */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold mb-4">Tín hiệu Voice Agent</h3>
            <div className="h-64 bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300">
              {/* Image of audio waveform visualizer */}
              <div className="text-slate-400 flex flex-col items-center">
                <Mic size={48} className="mb-2 animate-bounce text-blue-500"/>
                <p>Đang lắng nghe thính giả...</p>
              </div>
            </div>
            <div className="mt-6 flex gap-4">
              <button className="flex-1 bg-red-500 text-white py-2 rounded-lg font-medium">Ngắt Micro</button>
              <button className="flex-1 bg-slate-800 text-white py-2 rounded-lg font-medium">Bật Loa</button>
            </div>
          </div>

          {/* Pending Questions */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold mb-4">Câu hỏi chờ duyệt</h3>
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-sm text-slate-800 font-medium mb-1">Thính giả #{item*123}</p>
                  <p className="text-xs text-slate-500 line-clamp-2">"Làm thế nào để tối ưu RAG trong môi trường thực tế?"</p>
                  <div className="mt-2 flex gap-2">
                    <button className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded">Duyệt</button>
                    <button className="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded">Hủy</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}