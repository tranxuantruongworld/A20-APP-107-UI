"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { QrCode, ArrowRight, LogIn, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Tự động redirect nếu đã login (Client-side)
  useEffect(() => {
    if (isLoaded && userId) {
      router.push("/dashboard");
    }
  }, [userId, isLoaded, router]);

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) return;

    setLoading(true);
    setError("");

    try {
      // Kiểm tra xem mã phòng có tồn tại trong Supabase không
      const { data, error: supabaseError } = await supabase
        .from("seminars")
        .select("id, status")
        .eq("code", roomCode.trim().toUpperCase())
        .single();

      if (supabaseError || !data) {
        setError("Mã phòng không tồn tại hoặc đã hết hạn.");
      } else {
        // Nếu tìm thấy, chuyển hướng đến trang tham gia (Bạn cần tạo route /join/[id])
        router.push(`/join/${data.id}`);
      }
    } catch (err) {
      setError("Đã có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Q&A Conference Hub</h1>
        <p className="text-slate-500">Tham gia đặt câu hỏi hoặc quản lý hội nghị</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* BÊN TRÁI: Dành cho Audience */}
        <form 
          onSubmit={handleJoinRoom}
          className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center transition-all hover:shadow-md"
        >
          <div className="bg-slate-100 p-4 rounded-xl mb-6">
            <QrCode size={120} className="text-slate-800" />
          </div>
          <div className="w-full space-y-4">
            <input 
              type="text" 
              placeholder="Nhập mã phòng (VD: AI2026)"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className={`w-full px-4 py-3 rounded-lg border focus:ring-2 outline-none transition-all ${
                error ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:ring-blue-500"
              }`}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            
            <button 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>Tham gia đặt câu hỏi <ArrowRight size={18} /></>
              )}
            </button>
          </div>
        </form>

        {/* BÊN PHẢI: Dành cho Admin */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center items-center text-center">
          <div className="mb-6 p-4 bg-indigo-50 rounded-full text-indigo-600">
            <LogIn size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Ban tổ chức</h3>
          <p className="text-slate-500 mb-8 text-sm px-4">
            Đăng nhập để khởi tạo phiên thảo luận và kích hoạt AI Voice Moderator.
          </p>
          
          <SignInButton mode="modal">
            <button className="w-full bg-slate-900 hover:bg-black text-white font-semibold py-3 rounded-lg transition-all">
              Bắt đầu quản lý
            </button>
          </SignInButton>
        </div>
      </div>

      <footer className="mt-12 text-slate-400 text-xs">
        Powered by Next.js & Supabase Realtime
      </footer>
    </div>
  );
}