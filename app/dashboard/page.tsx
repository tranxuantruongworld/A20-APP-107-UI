// app/dashboard/page.tsx
"use client";
import { UserButton } from "@clerk/nextjs";
import { PlusCircle, History, Calendar, MessageCircle, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();

  const createNewSession = () => {
    const sessionId = Math.random().toString(36).substring(2, 9).toUpperCase();
    // Sau này: Gọi API lưu vào DB trước khi redirect
    router.push(`/session/${sessionId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b px-6 py-3 flex justify-between items-center">
        <h1 className="font-bold text-xl text-indigo-600">Q&A Admin</h1>
        <UserButton />
      </nav>

      <main className="max-w-5xl mx-auto p-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Phiên thảo luận</h2>
            <p className="text-slate-500">Xem lại dữ liệu từ các hội nghị trước.</p>
          </div>
          <button 
            onClick={createNewSession}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-200"
          >
            <PlusCircle size={20} /> Tạo phiên mới
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="flex items-center gap-2 font-semibold text-slate-600"><History size={18}/> Lịch sử</h3>
          {/* List Item Sample */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between group cursor-pointer hover:border-indigo-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-100 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600"><Calendar /></div>
              <div>
                <p className="font-bold">Hội thảo AI thâm nhập doanh nghiệp</p>
                <p className="text-xs text-slate-400 font-mono">ID: AI-9921</p>
              </div>
            </div>
            <ChevronRight className="text-slate-300" />
          </div>
        </div>
      </main>
    </div>
  );
}