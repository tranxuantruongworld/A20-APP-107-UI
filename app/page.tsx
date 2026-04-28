"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import {
  ArrowRight,
  LogIn,
  Loader2,
  Sparkles,
  Shield,
  Zap,
  Users,
  Mic,
  Star,
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  Send,
  Menu,
  X,
  Globe,
  BarChart3,
  Clock,
  Award,
  Play,
  Check,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function Home() {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useTranslations();
  const locale = useLocale();

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
        setError(t("home.errorRoomNotFound"));
      } else {
        router.push(`/join/${data.id}`);
      }
    } catch {
      setError(t("home.errorGeneral"));
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return null;

  const navItems = [
    { label: t("nav.dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { label: t("nav.futureCareer"), href: "#features", icon: Briefcase },
    { label: t("nav.reviews"), href: "#reviews", icon: MessageSquare },
    { label: t("nav.feedback"), href: "#feedback", icon: Send },
  ];

  const features = [
    {
      icon: Sparkles,
      title: t("features.aiModeration"),
      description: t("features.aiModerationDesc"),
    },
    {
      icon: Zap,
      title: t("features.realTimeSync"),
      description: t("features.realTimeSyncDesc"),
    },
    {
      icon: Shield,
      title: t("features.security"),
      description: t("features.securityDesc"),
    },
    {
      icon: Users,
      title: t("features.participants"),
      description: t("features.participantsDesc"),
    },
    {
      icon: Mic,
      title: t("features.voice"),
      description: t("features.voiceDesc"),
    },
    {
      icon: Globe,
      title: t("features.multilingual"),
      description: t("features.multilingualDesc"),
    },
    {
      icon: BarChart3,
      title: t("features.analytics"),
      description: t("features.analyticsDesc"),
    },
    {
      icon: Clock,
      title: t("features.recording"),
      description: t("features.recordingDesc"),
    },
    {
      icon: Award,
      title: t("features.gamification"),
      description: t("features.gamificationDesc"),
    },
  ];

  const reviews = [
    {
      name: "Nguyen Van Minh",
      role: "Giam doc Su kien, FPT Software",
      content:
        "Conference Hub da thay doi cach chung toi tuong tac voi khan gia. AI moderation giup tiet kiem hang gio lam viec. Thuc su cach mang!",
      rating: 5,
    },
    {
      name: "Tran Thi Lan",
      role: "CEO, VinTech Solutions",
      content:
        "Dong bo thoi gian thuc tuyet voi. Doi ngu lam viec tu xa cam thay ket noi nhu the dang o trong phong. Day la mot buoc ngoat cho cac su kien hybrid.",
      rating: 5,
    },
    {
      name: "Le Hoang Nam",
      role: "Truong phong To chuc, Vietnam Summit",
      content:
        "Chung toi da thu nhieu nen tang Q&A, nhung Conference Hub noi bat voi thiet ke tinh te va tinh nang manh me. Nguoi tham du rat thich!",
      rating: 5,
    },
    {
      name: "Pham Duc Anh",
      role: "CTO, Innovation Labs VN",
      content:
        "Tinh nang bao mat mang lai su tu tin khi su dung cho cac cuoc hop noi bo. Bao ve cap doanh nghiep voi su de su dung la su ket hop hiem co.",
      rating: 5,
    },
    {
      name: "Vo Thi Mai",
      role: "VP Marketing, TechVentures VN",
      content:
        "Bang dieu khien phan tich cung cap thong tin quy gia ve muc do tuong tac cua khan gia. Chung toi co the do luong thanh cong cua su kien bang du lieu cu the.",
      rating: 5,
    },
    {
      name: "Hoang Minh Tuan",
      role: "To chuc Hoi nghi, DevCon Vietnam",
      content:
        "Quan ly Q&A cho 5000+ nguoi tham du truoc day la ac mong. Conference Hub da lam cho no tro nen de dang. AI uu tien cau hoi tot nhat.",
      rating: 5,
    },
  ];

  const stats = [
    { value: "10K+", label: t("home.statSessions") },
    { value: "500K+", label: t("home.statQuestions") },
    { value: "99.9%", label: t("home.statUptime") },
    { value: "50+", label: "Quoc gia" },
  ];

  const useCases = [
    {
      title: "Hoi nghi & Su kien",
      description: "Quan ly Q&A cho hang ngan nguoi tham du mot cach de dang",
      icon: Users,
    },
    {
      title: "Webinar Truc tuyen",
      description: "Tuong tac thoi gian thuc voi khan gia toan cau",
      icon: Globe,
    },
    {
      title: "Dao tao Doanh nghiep",
      description: "Thu thap phan hoi va cau hoi tu nhan vien",
      icon: Briefcase,
    },
    {
      title: "Giao duc & Hoc tap",
      description: "Tao moi truong hoc tap tuong tac va hap dan",
      icon: Award,
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Hero Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full hero-gradient" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-accent/20 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Subtle Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(oklch(0.52 0.24 25 / 0.08) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10">
        {/* Navigation Header - Wisprflow Style */}
        <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
                  <Star className="w-5 h-5 text-primary-foreground vietnam-star" />
                </div>
                <span className="font-bold text-xl text-foreground tracking-tight">
                  Conference Hub
                </span>
              </div>

              {/* Desktop Menu */}
              <div className="hidden md:flex items-center gap-8">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* Auth Buttons */}
              <div className="hidden md:flex items-center gap-4">
                <LanguageSwitcher currentLocale={locale} />
                <SignInButton mode="modal">
                  <button className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    {t("nav.login")}
                  </button>
                </SignInButton>
                <SignInButton mode="modal">
                  <button className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-full transition-all shadow-lg shadow-primary/25 flex items-center gap-2">
                    {t("nav.register")}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </SignInButton>
              </div>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 text-foreground"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
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
                      className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors font-medium py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  ))}
                  <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-border/50">
                    <LanguageSwitcher currentLocale={locale} />
                    <SignInButton mode="modal">
                      <button className="w-full px-4 py-3 text-sm font-medium text-foreground border border-border rounded-full hover:bg-secondary transition-colors">
                        {t("nav.login")}
                      </button>
                    </SignInButton>
                    <SignInButton mode="modal">
                      <button className="w-full px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-full transition-all flex items-center justify-center gap-2">
                        {t("nav.register")}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </SignInButton>
                  </div>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Hero Section - Wisprflow Inspired */}
        <header className="pt-20 pb-16 px-6">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30 mb-8">
              <Star className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-foreground">
                {t("home.badge")}
              </span>
            </div>

            {/* Main Title */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-balance">
              <span className="text-gradient-gold">{t("home.heroTitle")}</span>
              <br />
              <span className="text-foreground">{t("home.heroTitleSub")}</span>
            </h1>

            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed text-balance">
              {t("home.heroDesc")}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <SignInButton mode="modal">
                <button className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full transition-all shadow-xl shadow-primary/30 flex items-center gap-3 text-lg group">
                  {t("nav.register")}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </SignInButton>
              <button className="px-8 py-4 bg-secondary hover:bg-secondary/80 text-foreground font-semibold rounded-full transition-all flex items-center gap-3 text-lg border border-border">
                <Play className="w-5 h-5" />
                Xem Demo
              </button>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-gradient-gold">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* Demo Visual Section */}
        <section className="px-6 pb-20">
          <div className="max-w-6xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden bg-card border border-border shadow-2xl shadow-primary/10">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
              <div className="relative p-8 md:p-12">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  {/* Left - Before/After Demo */}
                  <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      <Mic className="w-3 h-3" />
                      VOICE TO TEXT
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                        <p className="text-sm text-muted-foreground line-through">
                          &ldquo;Um, toi muon hoi ve... a... van de bao mat, no
                          nhu the nao... toi khong ro lam...&rdquo;
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <ArrowRight className="w-4 h-4" />
                        <span className="text-xs font-medium">
                          AI Tu dong Toi uu
                        </span>
                      </div>
                      <div className="p-4 rounded-xl bg-accent/10 border border-accent/30">
                        <p className="text-sm text-foreground font-medium">
                          &ldquo;Xin hoi ve cac bien phap bao mat ma nen tang ap
                          dung de bao ve du lieu nguoi dung?&rdquo;
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right - Speed Comparison */}
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-foreground">
                      Nhanh hon{" "}
                      <span className="text-gradient-gold">4 lan</span> so voi
                      go phim
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-20 text-sm text-muted-foreground">
                          Ban phim
                        </div>
                        <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-muted-foreground/30 rounded-full"
                            style={{ width: "25%" }}
                          />
                        </div>
                        <div className="w-20 text-sm font-bold text-muted-foreground">
                          45 wpm
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-20 text-sm text-primary font-medium">
                          Voice AI
                        </div>
                        <div className="flex-1 h-3 bg-primary/20 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full animate-pulse" />
                        </div>
                        <div className="w-20 text-sm font-bold text-primary">
                          180 wpm
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {["Tieng Viet", "English", "100+ ngon ngu"].map((lang) => (
                        <span
                          key={lang}
                          className="px-3 py-1.5 rounded-full bg-secondary text-xs font-medium text-foreground border border-border"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Join Session Section - Clean & Focused */}
        <section className="px-6 pb-24">
          <div className="max-w-xl mx-auto">
            <div className="bg-card rounded-3xl border border-border p-10 md:p-12 shadow-xl">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  <span className="text-gradient-gold">
                    {t("home.joinTitleHighlight")}
                  </span>{" "}
                  {t("home.joinTitle")
                    .replace(t("home.joinTitleHighlight"), "")
                    .trim()}
                </h2>
                <p className="text-muted-foreground">{t("home.joinDesc")}</p>
              </div>

              <form onSubmit={handleJoinRoom} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-3 text-center uppercase tracking-wider">
                    {t("home.roomCodeLabel")}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={t("home.roomCodePlaceholder")}
                      value={roomCode}
                      onChange={(e) =>
                        setRoomCode(e.target.value.toUpperCase())
                      }
                      className={`w-full px-6 py-5 rounded-2xl bg-secondary/50 border-2 focus:ring-4 focus:ring-primary/20 outline-none transition-all text-foreground placeholder:text-muted-foreground font-mono text-xl tracking-widest text-center ${
                        error
                          ? "border-destructive focus:ring-destructive/20"
                          : "border-border focus:border-primary"
                      }`}
                    />
                    {error && (
                      <p className="text-destructive text-sm mt-3 text-center">
                        {error}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    {t("home.roomCodeExamples")}{" "}
                    <span className="font-mono text-primary">CONF2026</span>,{" "}
                    <span className="font-mono text-primary">MEET-ABC</span>
                  </p>
                </div>

                <button
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground font-semibold py-5 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 text-lg shadow-lg shadow-primary/25 group"
                >
                  {loading ? (
                    <Loader2 className="animate-spin w-5 h-5" />
                  ) : (
                    <>
                      {t("home.joinButton")}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-muted-foreground">
                  {t("home.joinHint")}
                </p>
              </form>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="px-6 pb-24 bg-secondary/30">
          <div className="max-w-6xl mx-auto py-20">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Duoc <span className="text-gradient-gold">tin dung</span> boi
                chuyen gia
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Tu hoi nghi lon den webinar nho, Conference Hub ho tro moi loai
                su kien
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {useCases.map((useCase) => (
                <div
                  key={useCase.title}
                  className="bg-card rounded-2xl border border-border p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <useCase.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {useCase.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {useCase.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-6 pb-24">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {t("home.featuresTitle")}{" "}
                <span className="text-gradient-gold">Conference Hub</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t("home.featuresSubtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="bg-card rounded-2xl border border-border p-8 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section id="reviews" className="px-6 pb-24 bg-secondary/30">
          <div className="max-w-6xl mx-auto py-20">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                <span className="text-gradient-gold">
                  {t("home.reviewsTitle")}
                </span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t("home.reviewsSubtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((review, index) => (
                <div
                  key={index}
                  className="bg-card rounded-2xl border border-border p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-accent text-accent"
                      />
                    ))}
                  </div>
                  <blockquote className="text-foreground mb-6 leading-relaxed text-sm">
                    &ldquo;{review.content}&rdquo;
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">
                        {review.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="text-foreground font-semibold text-sm">
                        {review.name}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {review.role}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 pb-24">
          <div className="max-w-4xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent/80" />
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `radial-gradient(white 1px, transparent 1px)`,
                  backgroundSize: "24px 24px",
                }}
              />
              <div className="relative p-12 md:p-16 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                  Bat dau su dung ngay hom nay
                </h2>
                <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
                  Trai nghiem mien phi 14 ngay. Khong can the tin dung.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <SignInButton mode="modal">
                    <button className="px-8 py-4 bg-white hover:bg-white/90 text-primary font-semibold rounded-full transition-all flex items-center gap-3 shadow-xl">
                      Dang ky mien phi
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </SignInButton>
                  <div className="flex items-center gap-2 text-primary-foreground/80 text-sm">
                    <Check className="w-4 h-4" />
                    <span>Khong can cai dat</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feedback Section */}
        <section id="feedback" className="px-6 pb-24">
          <div className="max-w-3xl mx-auto">
            <div className="bg-card rounded-3xl border border-border p-10 md:p-12 shadow-xl">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  <span className="text-gradient-gold">
                    {t("home.feedbackTitle")}
                  </span>
                </h2>
                <p className="text-muted-foreground">
                  {t("home.feedbackSubtitle")}
                </p>
              </div>

              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder={t("home.feedbackName")}
                    className="w-full px-5 py-4 rounded-xl bg-secondary/50 border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all text-foreground placeholder:text-muted-foreground"
                  />
                  <input
                    type="email"
                    placeholder={t("home.feedbackEmail")}
                    className="w-full px-5 py-4 rounded-xl bg-secondary/50 border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <textarea
                  placeholder={t("home.feedbackMessage")}
                  rows={5}
                  className="w-full px-5 py-4 rounded-xl bg-secondary/50 border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all text-foreground placeholder:text-muted-foreground resize-none"
                />
                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 text-lg shadow-lg shadow-primary/25"
                >
                  <Send className="w-5 h-5" />
                  {t("home.feedbackSubmit")}
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border bg-card">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                    <Star className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-xl text-foreground">
                    Conference Hub
                  </span>
                </div>
                <p className="text-muted-foreground text-sm max-w-sm">
                  Nen tang Q&A thong minh cho hoi nghi va su kien. Duoc tin dung
                  boi hang ngan to chuc tren toan cau.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-4">San pham</h4>
                <div className="space-y-2">
                  {navItems.slice(0, 2).map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="block text-muted-foreground hover:text-foreground transition-colors text-sm"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-4">Lien he</h4>
                <div className="space-y-2">
                  {navItems.slice(2).map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="block text-muted-foreground hover:text-foreground transition-colors text-sm"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
              <div className="text-muted-foreground text-sm">
                {t("home.footerRights")}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Made with</span>
                <Star className="w-4 h-4 text-accent fill-accent" />
                <span>in Vietnam</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
