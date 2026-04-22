import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { QrCode, ArrowRight, LayoutDashboard, LogIn } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  // Kiểm tra session ở phía Server
  const { userId } = await auth();

  // Nếu đã login, tự động chuyển hướng vào dashboard
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-900 mb-2 text-balance">
          Q&A Conference Hub
        </h1>
        <p className="text-slate-500">Tham gia đặt câu hỏi hoặc quản lý hội nghị</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* BÊN TRÁI: Dành cho Audience (Không cần login) */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center">
          <div className="bg-slate-100 p-4 rounded-xl mb-6">
            <QrCode size={120} className="text-slate-800" />
          </div>
          <div className="w-full space-y-4">
            <input 
              type="text" 
              placeholder="Nhập mã phòng (VD: AI-2026)"
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
              Tham gia đặt câu hỏi <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* BÊN PHẢI: Dành cho Admin/Speaker (Cần Login) */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center items-center text-center">
          <div className="mb-6 p-4 bg-indigo-50 rounded-full">
            <LogIn size={40} className="text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Ban tổ chức</h3>
          <p className="text-slate-500 mb-8 text-sm px-4">
            Đăng nhập để khởi tạo phiên thảo luận, quản lý câu hỏi và kích hoạt AI Voice Moderator.
          </p>
            <div className="w-full bg-slate-900 hover:bg-black text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2">
              <SignInButton mode="modal">
                  Bắt đầu quản lý 
              </SignInButton>
            </div>
        </div>
      </div>

      <footer className="mt-12 text-slate-400 text-xs">
        Powered by Next.js & AI Recognition System
      </footer>
    </div>
  );
}