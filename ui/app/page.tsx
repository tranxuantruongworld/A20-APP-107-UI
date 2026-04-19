"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";

export default function LandingPage() {
  const [showModal, setShowModal] = useState(true);
  const [eventCode, setEventCode] = useState('');
  const router = useRouter();
  
  // Kiểm tra trạng thái đăng nhập
  const { isSignedIn } = useUser();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (eventCode.length === 6) {
      // Điều hướng vào dashboard sau khi xác thực mã
      router.push(`/dashboard?code=${eventCode}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Tham gia Hội thảo</h1>
            <p className="text-slate-500 mb-6">Nhập mã 6 chữ số để bắt đầu đặt câu hỏi bằng giọng nói.</p>
            
            <form onSubmit={handleJoin}>
              <input
                type="text"
                maxLength={6}
                placeholder="Ví dụ: 123456"
                className="w-full text-center text-3xl tracking-widest border-2 border-slate-200 rounded-lg py-3 focus:border-blue-500 outline-none mb-4 text-slate-800"
                value={eventCode}
                onChange={(e) => setEventCode(e.target.value.toUpperCase())}
              />
              
              {isSignedIn ? (
                <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all"
                >
                  Vào tham gia ngay
                </button>
              ) : (
                <div className="flex flex-col gap-3">
                  <SignInButton mode="modal">
                    <button type="button" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all">
                      Đăng nhập để tham gia
                    </button>
                  </SignInButton>
                  
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-4 text-slate-400 text-sm">hoặc</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  <SignUpButton mode="modal">
                    <button type="button" className="w-full bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-lg transition-all">
                      Tạo tài khoản mới
                    </button>
                  </SignUpButton>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}