"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { ArrowRight, LogIn, Loader2, Sparkles, Shield, Zap, Users, Mic, Star, LayoutDashboard, Briefcase, MessageSquare, Send, Menu, X, Globe, BarChart3, Clock, Award, Heart, Lightbulb } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "ASR Benchmark", href: "/benchmark", icon: BarChart3 },
    { label: "Future Career", href: "#features", icon: Briefcase },
    { label: "Reviews", href: "#reviews", icon: MessageSquare },
    { label: "Feedback", href: "#feedback", icon: Send },
  ];

  const features = [
    {
      icon: Sparkles,
      title: "AI Moderation",
      description: "Intelligent question filtering and prioritization powered by advanced AI algorithms"
    },
    {
      icon: Zap,
      title: "Real-time Sync",
      description: "Instant updates across all devices with sub-second latency for seamless interaction"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level encryption and SOC 2 compliance for your peace of mind"
    },
    {
      icon: Users,
      title: "Unlimited Participants",
      description: "Scale your sessions to thousands of attendees without any performance issues"
    },
    {
      icon: Mic,
      title: "Voice Questions",
      description: "Allow attendees to submit questions via voice for enhanced accessibility"
    },
    {
      icon: Globe,
      title: "Multi-language Support",
      description: "Real-time translation and support for 50+ languages worldwide"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Comprehensive insights on engagement, popular topics, and audience metrics"
    },
    {
      icon: Clock,
      title: "Session Recording",
      description: "Automatic recording and transcription of all Q&A sessions for future reference"
    },
    {
      icon: Award,
      title: "Gamification",
      description: "Engage your audience with points, badges, and leaderboards for participation"
    },
  ];

  const reviews = [
    {
      name: "Sarah Chen",
      role: "Head of Events, TechCorp Global",
      content: "Conference Hub transformed how we engage with our audience. The AI moderation saved us countless hours while ensuring every important question was addressed. Absolutely revolutionary!",
      rating: 5
    },
    {
      name: "Michael Rodriguez",
      role: "CEO, StartupX",
      content: "The real-time sync is incredible. Our remote team felt just as connected as those in the room. This platform is a game-changer for hybrid events and global conferences.",
      rating: 5
    },
    {
      name: "Emily Watson",
      role: "Event Director, Global Summit",
      content: "We have tried many Q&A platforms, but Conference Hub stands out with its elegant design and powerful features. Our attendees absolutely love the seamless experience!",
      rating: 5
    },
    {
      name: "David Kim",
      role: "CTO, Innovation Labs",
      content: "The security features gave us confidence to use this for our internal all-hands meetings. Enterprise-grade protection with consumer-grade ease of use is a rare combination.",
      rating: 5
    },
    {
      name: "Jennifer Park",
      role: "VP of Marketing, TechVentures",
      content: "The analytics dashboard provides invaluable insights into audience engagement. We can now measure the success of our events with concrete data and improve continuously.",
      rating: 5
    },
    {
      name: "Robert Martinez",
      role: "Conference Organizer, DevCon",
      content: "Managing Q&A for 5000+ attendees used to be a nightmare. Conference Hub made it effortless. The AI prioritization ensures the best questions always rise to the top.",
      rating: 5
    },
    {
      name: "Lisa Thompson",
      role: "Director of Learning, EduTech Corp",
      content: "The multi-language support opened our conferences to a global audience. Attendees can ask questions in their native language and everyone stays connected.",
      rating: 5
    },
    {
      name: "James Wilson",
      role: "Founder, InnovateCon",
      content: "From small workshops to massive keynotes, Conference Hub scales beautifully. The interface is intuitive and our speakers love the streamlined experience.",
      rating: 5
    },
  ];

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
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `linear-gradient(oklch(0.50 0.20 250 / 0.1) 1px, transparent 1px), linear-gradient(90deg, oklch(0.50 0.20 250 / 0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      <div className="relative z-10">
        {/* Navigation Header */}
        <nav className="sticky top-0 z-50 glass border-b border-border/50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                <span className="font-bold text-xl text-foreground">Conference Hub</span>
              </div>

              {/* Desktop Menu */}
              <div className="hidden md:flex items-center gap-8">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* Auth Buttons */}
              <div className="hidden md:flex items-center gap-3">
                <SignInButton mode="modal">
                  <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Login
                  </button>
                </SignInButton>
                <SignInButton mode="modal">
                  <button className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-xl transition-all flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Register
                  </button>
                </SignInButton>
              </div>

              {/* Mobile Menu Button */}
              <button 
                className="md:hidden p-2 text-foreground"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="md:hidden mt-4 pb-4 border-t border-border/50 pt-4">
                <div className="flex flex-col gap-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  ))}
                  <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border/50">
                    <SignInButton mode="modal">
                      <button className="w-full px-4 py-3 text-sm font-medium text-foreground border border-border rounded-xl hover:bg-secondary transition-colors">
                        Login
                      </button>
                    </SignInButton>
                    <SignInButton mode="modal">
                      <button className="w-full px-5 py-3 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2">
                        <LogIn className="w-4 h-4" />
                        Register
                      </button>
                    </SignInButton>
                  </div>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Hero Section */}
        <header className="flex flex-col items-center justify-center pt-16 pb-12 px-6">
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

        {/* Join Session Section */}
        <section className="px-6 pb-20">
          <div className="max-w-xl mx-auto">
            <div className="glass rounded-3xl border border-border/50 p-10 md:p-12">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  <span className="text-gradient-gold">Enter</span> a Room
                </h2>
                <p className="text-muted-foreground">
                  Have a room code? Enter it below to join and participate in the session instantly.
                </p>
              </div>

              <form onSubmit={handleJoinRoom} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-3 text-center uppercase tracking-wider">
                    Room Code
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="e.g., CONF2026 or MEET-ABC"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      className={`w-full px-6 py-5 rounded-xl bg-secondary/50 border-2 focus:ring-2 focus:ring-primary/30 outline-none transition-all text-foreground placeholder:text-muted-foreground font-mono text-xl tracking-widest text-center ${
                        error ? "border-destructive focus:ring-destructive/30" : "border-border/50 focus:border-primary/50"
                      }`}
                    />
                    {error && (
                      <p className="text-destructive text-sm mt-3 text-center">{error}</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Examples: <span className="font-mono text-primary/80">CONF2026</span>, <span className="font-mono text-primary/80">MEET-ABC</span>, <span className="font-mono text-primary/80">QA-LIVE</span>
                  </p>
                </div>
                
                <button 
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground font-semibold py-5 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 text-lg group/btn"
                >
                  {loading ? (
                    <Loader2 className="animate-spin w-5 h-5" />
                  ) : (
                    <>
                      Join Session
                      <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-muted-foreground mt-4">
                  Ask the host for the room code to participate in the Q&A session
                </p>
              </form>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-6 pb-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Why Choose <span className="text-gradient-gold">Conference Hub</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Built for modern conferences with cutting-edge technology and premium features
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
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

        {/* Reviews Section */}
        <section id="reviews" className="px-6 pb-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                What Our <span className="text-gradient-gold">Users Say</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Trusted by thousands of event organizers worldwide
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((review, index) => (
                <div 
                  key={index}
                  className="glass rounded-2xl border border-border/50 p-8 hover:border-primary/30 transition-all duration-300"
                >
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <blockquote className="text-foreground mb-6 leading-relaxed">
                    &ldquo;{review.content}&rdquo;
                  </blockquote>
                  <div>
                    <div className="text-foreground font-semibold">{review.name}</div>
                    <div className="text-muted-foreground text-sm">{review.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feedback Section */}
        <section id="feedback" className="px-6 pb-20">
          <div className="max-w-3xl mx-auto">
            <div className="glass rounded-3xl border border-border/50 p-10 md:p-12">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Share Your <span className="text-gradient-gold">Feedback</span>
                </h2>
                <p className="text-muted-foreground">
                  We&apos;d love to hear from you. Help us improve Conference Hub.
                </p>
              </div>

              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Your Name"
                    className="w-full px-5 py-4 rounded-xl bg-secondary/50 border-2 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/30 outline-none transition-all text-foreground placeholder:text-muted-foreground"
                  />
                  <input
                    type="email"
                    placeholder="Your Email"
                    className="w-full px-5 py-4 rounded-xl bg-secondary/50 border-2 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/30 outline-none transition-all text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <textarea
                  placeholder="Your feedback or suggestions..."
                  rows={5}
                  className="w-full px-5 py-4 rounded-xl bg-secondary/50 border-2 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/30 outline-none transition-all text-foreground placeholder:text-muted-foreground resize-none"
                />
                <button 
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 text-lg"
                >
                  <Send className="w-5 h-5" />
                  Submit Feedback
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/50 py-8 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">Conference Hub</span>
              </div>
              
              <div className="flex items-center gap-6">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="text-muted-foreground text-sm">
                2026 All rights reserved
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
