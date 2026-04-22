"use client";
import { useEffect, useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { PlusCircle, History, Calendar, MessageCircle, ChevronRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const router = useRouter();
  const { user } = useUser();
  const [seminars, setSeminars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Lấy danh sách seminar từ Database
  useEffect(() => {
    if (!user) return;

    const fetchSeminars = async () => {
      const { data, error } = await supabase
        .from('seminars')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error) setSeminars(data);
      setLoading(false);
    };

    fetchSeminars();
  }, [user]);

  // 2. Hàm tạo phiên mới và lưu vào Supabase
  const createNewSession = async () => {
    if (!user) return;

    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const title = `Hội thảo ngày ${new Date().toLocaleDateString('vi-VN')}`;

    const { data, error } = await supabase
      .from('seminars')
      .insert([{ 
        title, 
        code: roomCode, 
        user_id: user.id,
        status: 'live' 
      }])
      .select()
      .single();

    if (error) {
      console.error("Lỗi tạo phiên:", error.message);
      return;
    }

    // Redirect sang trang session với ID vừa tạo
    router.push(`/session/${data.id}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b px-6 py-3 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2 font-bold text-xl text-indigo-600">
          <MessageCircle size={24} />
          <span>Q&A Admin</span>
        </div>
        <UserButton />
      </nav>

      <main className="max-w-5xl mx-auto p-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 font-sans">Phiên thảo luận</h2>
            <p className="text-slate-500">Quản lý các buổi hội thảo của bạn thông qua AI.</p>
          </div>
          <button 
            onClick={createNewSession}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-200 active:scale-95"
          >
            <PlusCircle size={20} /> Tạo phiên mới
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="flex items-center gap-2 font-semibold text-slate-600 mb-4">
            <History size={18}/> Lịch sử hội nghị
          </h3>

          {loading ? (
            <div className="flex justify-center py-10 text-slate-400">
              <Loader2 className="animate-spin" />
            </div>
          ) : seminars.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400">Bạn chưa có phiên hội thảo nào. Hãy tạo mới ngay!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {seminars.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => router.push(`/session/${item.id}`)}
                  className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between group cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-colors ${item.status === 'live' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                      <Calendar size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{item.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded uppercase font-bold text-slate-500">
                          Mã: {item.code}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(item.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {item.status === 'live' && (
                      <span className="text-[10px] bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-bold animate-pulse">LIVE</span>
                    )}
                    <ChevronRight className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}