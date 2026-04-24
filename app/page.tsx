"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { QrCode, ArrowRight, LogIn, Loader2, Sparkles, Shield, Zap, Users, Mic, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      const { data, error: supabaseError } = await supabase
        .from("seminars")
        .select("id, status")
        .eq("code", roomCode.trim().toUpperCase())
        .single();

      if (supabaseError || !data) {
        setError("Room code does not exist or has expired.");
      } else {
        router.push(`/join/${data.id}`);
      }
    } catch {
      setError("An error occurred, please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `linear-gradient(oklch(0.78 0.12 85 / 0.1) 1px, transparent 1px), linear-gradient(90deg, oklch(0.78 0.12 85 / 0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      <div className="relative z-10">
        {/* Hero Section */}
        <header className="flex flex-col items-center justify-center pt-20 pb-16 px-6">
          {/* Badge */}
          <div className="glass px-4 py-2 rounded-full border border-primary/30 mb-8 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">AI-Powered Conference Platform</span>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-bold text-center mb-6 tracking-tight">
            <span className="text-gradient-gold">Q&A Conference</span>
            <br />
            <span className="text-foreground">Hub</span>
          </h1>

          <p className="text-muted-foreground text-lg md:text-xl text-center max-w-2xl mb-4 leading-relaxed text-balance">
            Experience the future of conference interaction with our AI-powered Q&A platform. 
            Real-time engagement, intelligent moderation, seamless collaboration.
          </p>

          {/* Stats */}
          <div className="flex items-center gap-8 mt-8 mb-12">
            {[
              { value: "10K+", label: "Sessions" },
              { value: "500K+", label: "Questions" },
              { value: "99.9%", label: "Uptime" }
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-gradient-gold">{stat.value}</div>
                <div className="text-xs md:text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </header>

        {/* Main Cards Section */}
        <main className="px-6 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-5xl mx-auto">
            {/* Audience Card */}
            <form 
              onSubmit={handleJoinRoom}
              className="glass rounded-3xl border border-border/50 p-10 flex flex-col items-center transition-all duration-500 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 group"
            >
              {/* Icon Container */}
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:bg-primary/30 transition-all" />
                <div className="relative bg-secondary/80 p-6 rounded-2xl border border-primary/20 group-hover:border-primary/40 transition-all">
                  <QrCode className="w-16 h-16 text-primary animate-float" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-2">Join Session</h2>
              <p className="text-muted-foreground text-center mb-8 text-sm">
                Enter your room code to participate and ask questions in real-time
              </p>

              <div className="w-full space-y-4">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Enter room code (e.g., AI2026)"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className={`w-full px-5 py-4 rounded-xl bg-secondary/50 border-2 focus:ring-2 focus:ring-primary/30 outline-none transition-all text-foreground placeholder:text-muted-foreground font-mono text-lg tracking-widest text-center ${
                      error ? "border-destructive focus:ring-destructive/30" : "border-border/50 focus:border-primary/50"
                    }`}
                  />
                  {error && (
                    <p className="text-destructive text-xs mt-2 text-center">{error}</p>
                  )}
                </div>
                
                <button 
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground font-semibold py-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 text-lg group/btn animate-pulse-glow"
                >
                  {loading ? (
                    <Loader2 className="animate-spin w-5 h-5" />
                  ) : (
                    <>
                      Join Now
                      <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>

              {/* Features List */}
              <div className="mt-8 w-full space-y-3">
                {[
                  { icon: Mic, text: "Voice-enabled questions" },
                  { icon: Zap, text: "Real-time interaction" }
                ].map((feature) => (
                  <div key={feature.text} className="flex items-center gap-3 text-muted-foreground text-sm">
                    <feature.icon className="w-4 h-4 text-primary" />
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>
            </form>

            {/* Admin Card */}
            <div className="glass rounded-3xl border border-border/50 p-10 flex flex-col items-center justify-center transition-all duration-500 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 group">
              {/* Icon Container */}
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/30 transition-all" />
                <div className="relative bg-secondary/80 p-6 rounded-full border border-primary/20 group-hover:border-primary/40 transition-all">
                  <Shield className="w-16 h-16 text-primary animate-float" style={{ animationDelay: '1s' }} />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-2">Organizer Portal</h2>
              <p className="text-muted-foreground text-center mb-8 text-sm max-w-xs">
                Create sessions, manage questions, and activate AI Voice Moderator for intelligent Q&A management
              </p>
              
              <SignInButton mode="modal">
                <button className="w-full bg-secondary hover:bg-secondary/80 border-2 border-primary/30 hover:border-primary/50 text-foreground font-semibold py-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 text-lg group/btn">
                  <LogIn className="w-5 h-5 text-primary" />
                  Start Managing
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform text-primary" />
                </button>
              </SignInButton>

              {/* Features List */}
              <div className="mt-8 w-full space-y-3">
                {[
                  { icon: Users, text: "Unlimited participants" },
                  { icon: Sparkles, text: "AI-powered moderation" }
                ].map((feature) => (
                  <div key={feature.text} className="flex items-center gap-3 text-muted-foreground text-sm">
                    <feature.icon className="w-4 h-4 text-primary" />
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* Features Section */}
        <section className="px-6 pb-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Why Choose <span className="text-gradient-gold">Conference Hub</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Built for modern conferences with cutting-edge technology
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: Sparkles,
                  title: "AI Moderation",
                  description: "Intelligent question filtering and prioritization powered by advanced AI"
                },
                {
                  icon: Zap,
                  title: "Real-time Sync",
                  description: "Instant updates across all devices with sub-second latency"
                },
                {
                  icon: Shield,
                  title: "Enterprise Security",
                  description: "Bank-level encryption and compliance for your peace of mind"
                }
              ].map((feature) => (
                <div 
                  key={feature.title}
                  className="glass rounded-2xl border border-border/50 p-8 text-center hover:border-primary/30 transition-all duration-300 group"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 mb-6 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="px-6 pb-20">
          <div className="max-w-5xl mx-auto">
            <div className="glass rounded-3xl border border-border/50 p-10 md:p-12">
              <div className="flex items-center justify-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>
              <blockquote className="text-xl md:text-2xl text-foreground text-center font-medium mb-6 max-w-3xl mx-auto leading-relaxed text-balance">
                {`"Conference Hub transformed how we engage with our audience. The AI moderation saved us countless hours while ensuring every important question was addressed."`}
              </blockquote>
              <div className="text-center">
                <div className="text-foreground font-semibold">Sarah Chen</div>
                <div className="text-muted-foreground text-sm">Head of Events, TechCorp Global</div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/50 py-8 px-6">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">Conference Hub</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Powered by Next.js, Supabase & AI
            </p>
            <div className="text-muted-foreground text-xs">
              2026 All rights reserved
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
