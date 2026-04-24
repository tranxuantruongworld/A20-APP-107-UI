"use client";
import { useEffect, useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { PlusCircle, History, Calendar, MessageCircle, ChevronRight, Loader2, Sparkles, LayoutDashboard, Users, Clock, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function Dashboard() {
  const router = useRouter();
  const { user } = useUser();
  const [seminars, setSeminars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchSeminars = async () => {
      const { data, error } = await supabase
        .from('seminars')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error) setSeminars(data || []);
      setLoading(false);
    };

    fetchSeminars();
  }, [user]);

  const createNewSession = async () => {
    if (!user) return;

    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const title = `Session ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

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
      console.error("Error creating session:", error.message);
      return;
    }

    router.push(`/session/${data.id}`);
  };

  const liveSessions = seminars.filter(s => s.status === 'live').length;
  const totalQuestions = seminars.reduce((acc, s) => acc + (s.question_count || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground">Conference Hub</span>
          </Link>
          
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-primary font-medium text-sm flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10 ring-2 ring-primary/20"
                }
              }}
            />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Welcome back, <span className="text-gradient-gold">{user?.firstName || 'Host'}</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your Q&A sessions and engage with your audience
            </p>
          </div>
          <button 
            onClick={createNewSession}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-xl font-semibold flex items-center gap-3 transition-all shadow-lg shadow-primary/20 active:scale-95 group"
          >
            <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" /> 
            Create New Session
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="glass rounded-2xl border border-border/50 p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{seminars.length}</p>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
              </div>
            </div>
          </div>
          
          <div className="glass rounded-2xl border border-border/50 p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Zap className="w-7 h-7 text-green-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{liveSessions}</p>
                <p className="text-sm text-muted-foreground">Live Now</p>
              </div>
            </div>
          </div>
          
          <div className="glass rounded-2xl border border-border/50 p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <MessageCircle className="w-7 h-7 text-blue-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{totalQuestions}</p>
                <p className="text-sm text-muted-foreground">Total Questions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="space-y-6">
          <h2 className="flex items-center gap-3 text-xl font-semibold text-foreground">
            <History className="w-5 h-5 text-primary" />
            Your Sessions
          </h2>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin w-8 h-8 text-primary" />
            </div>
          ) : seminars.length === 0 ? (
            <div className="glass rounded-3xl border-2 border-dashed border-border/50 py-20 text-center">
              <div className="w-20 h-20 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg mb-2">No sessions yet</p>
              <p className="text-sm text-muted-foreground/70">Create your first session to get started</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {seminars.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => router.push(`/session/${item.id}`)}
                  className="glass rounded-2xl border border-border/50 p-6 flex items-center justify-between group cursor-pointer hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
                      item.status === 'live' 
                        ? 'bg-green-500/10 text-green-500' 
                        : 'bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                    }`}>
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-lg group-hover:text-primary transition-colors">{item.title}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs font-mono bg-secondary px-3 py-1 rounded-lg uppercase font-bold text-muted-foreground tracking-wider">
                          {item.code}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {item.status === 'live' && (
                      <span className="text-xs bg-green-500/10 text-green-500 px-3 py-1.5 rounded-full font-bold flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        LIVE
                      </span>
                    )}
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
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
