"use client";
import { useState } from "react";
import { Mic, Send, ChevronUp, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ResponsiveQA() {
  const [isRecording, setIsRecording] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      {/* Header Cam - Giữ full width nhưng giới hạn nội dung bên trong */}
      <div className="w-full bg-orange-500 py-6 px-4 md:py-10 text-white flex justify-center">
        <div className="w-full max-w-4xl space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center">Live Q&A Session</h2>
          
          <div className="relative max-w-2xl mx-auto group">
            <Input 
              placeholder="Ask a question..." 
              className="pr-28 h-14 md:h-16 text-lg text-slate-900 rounded-xl shadow-xl border-none focus-visible:ring-4 focus-visible:ring-orange-300"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className={`rounded-full h-10 w-10 md:h-12 md:w-12 transition-all ${
                  isRecording ? 'bg-red-100 text-red-500 animate-pulse scale-110' : 'text-slate-400 hover:text-orange-500'
                }`}
                onClick={() => setIsRecording(!isRecording)}
              >
                <Mic size={24} />
              </Button>
              <Button size="icon" className="bg-orange-600 hover:bg-orange-700 rounded-lg h-10 w-10 md:h-12 md:w-12">
                <Send size={20} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Container chính: Desktop dùng 2 cột (hoặc 1 cột giữa), Mobile dùng 1 cột */}
      <div className="w-full max-w-4xl flex-1 flex flex-col md:mt-6 bg-white md:rounded-t-2xl shadow-sm overflow-hidden">
        
        {/* Toolbar: Responsive Tabs & Filter */}
        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-b gap-4">
          <Tabs defaultValue="all" className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100">
              <TabsTrigger value="all">Tất cả (12)</TabsTrigger>
              <TabsTrigger value="answered">Đã trả lời</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <Button variant="outline" size="sm" className="flex-1 sm:flex-none gap-2">
               <Filter size={14} /> Mới nhất
             </Button>
             <Button variant="outline" size="sm" className="flex-1 sm:flex-none gap-2">
               <Search size={14} /> Tìm kiếm
             </Button>
          </div>
        </div>

        {/* Danh sách câu hỏi */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-8">
            {[
              { id: 1, user: "Trần Trường", text: "Làm thế nào để tích hợp Whisper AI vào Next.js hiệu quả?", votes: 12, status: "Answered", time: "2m ago" },
              { id: 2, user: "Anonymous", text: "Dự án Voice Moderator có hỗ trợ tiếng Việt tốt không?", votes: 5, status: null, time: "5m ago" },
              { id: 3, user: "Ban & Trien", text: "Chi phí để vận hành hệ thống STT này là bao nhiêu?", votes: 2, status: "Answered", time: "10m ago" }
            ].map((item) => (
              <div key={item.id} className="flex gap-4 md:gap-6 group">
                {/* Cột Upvote: Mobile nhỏ, Desktop to */}
                <div className="flex flex-col items-center gap-1">
                  <Button variant="secondary" className="h-10 w-10 md:h-12 md:w-12 rounded-xl flex flex-col gap-0 hover:bg-orange-100 hover:text-orange-600 border border-transparent hover:border-orange-200">
                    <ChevronUp size={24} />
                    <span className="text-xs md:text-sm font-bold -mt-1">{item.votes}</span>
                  </Button>
                </div>
                
                {/* Cột Nội dung */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm md:text-base">{item.user}</span>
                    <span className="text-xs text-slate-400">• {item.time}</span>
                  </div>
                  
                  <p className="text-slate-700 text-base md:text-lg leading-relaxed">
                    {item.text}
                  </p>

                  <div className="flex items-center gap-4 pt-1">
                    {item.status && (
                      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-100 px-2 py-0">
                        {item.status}
                      </Badge>
                    )}
                    <button className="text-sm font-medium text-blue-600 hover:underline">
                      Trả lời
                    </button>
                    <button className="text-sm font-medium text-slate-400 hover:text-slate-600">
                      Chia sẻ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}