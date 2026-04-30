"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import {
  ArrowRight,
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
  QrCode,
  Upload,
  Brain,
  MessageCircle,
  Settings,
  Monitor,
  Tablet,
  Smartphone,
  PieChart,
  FileText,
  Volume2,
  Target,
  Layers,
  Video,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export default function Home() {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState("qa");
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
    { label: t("page.navFeatures"), href: "#features" },
    { label: t("page.navSolutions"), href: "#solutions" },
    { label: t("page.navHowItWorks"), href: "#how-it-works" },
    { label: t("page.navContact"), href: "#contact" },
  ];

  const interactiveFeatures = [
    {
      id: "qa",
      icon: MessageCircle,
      title: t("page.featureQATitle"),
      description: t("page.featureQADesc"),
      benefits: [
        t("page.featureQABenefit1"),
        t("page.featureQABenefit2"),
        t("page.featureQABenefit3"),
      ],
    },
    {
      id: "voice",
      icon: Mic,
      title: t("page.featureVoiceTitle"),
      description: t("page.featureVoiceDesc"),
      benefits: [
        t("page.featureVoiceBenefit1"),
        t("page.featureVoiceBenefit2"),
        t("page.featureVoiceBenefit3"),
      ],
    },
    {
      id: "upload",
      icon: Upload,
      title: t("page.featureUploadTitle"),
      description: t("page.featureUploadDesc"),
      benefits: [
        t("page.featureUploadBenefit1"),
        t("page.featureUploadBenefit2"),
        t("page.featureUploadBenefit3"),
      ],
    },
    {
      id: "analytics",
      icon: PieChart,
      title: t("page.featureAnalyticsTitle"),
      description: t("page.featureAnalyticsDesc"),
      benefits: [
        t("page.featureAnalyticsBenefit1"),
        t("page.featureAnalyticsBenefit2"),
        t("page.featureAnalyticsBenefit3"),
      ],
    },
  ];

  const solutions = [
    {
      icon: Users,
      title: t("page.sol1Title"),
      description: t("page.sol1Desc"),
      image: "events",
    },
    {
      icon: Video,
      title: t("page.sol2Title"),
      description: t("page.sol2Desc"),
      image: "webinar",
    },
    {
      icon: Briefcase,
      title: t("page.sol3Title"),
      description: t("page.sol3Desc"),
      image: "training",
    },
    {
      icon: Award,
      title: t("page.sol4Title"),
      description: t("page.sol4Desc"),
      image: "education",
    },
  ];

  const howItWorks = [
    {
      step: "01",
      title: t("page.step1Title"),
      description: t("page.step1Desc"),
      icon: Settings,
    },
    {
      step: "02",
      title: t("page.step2Title"),
      description: t("page.step2Desc"),
      icon: QrCode,
    },
    {
      step: "03",
      title: t("page.step3Title"),
      description: t("page.step3Desc"),
      icon: Mic,
    },
    {
      step: "04",
      title: t("page.step4Title"),
      description: t("page.step4Desc"),
      icon: Monitor,
    },
  ];

  const stats = [
    { value: "10K+", label: t("home.statSessions") },
    { value: "500K+", label: t("home.statQuestions") },
    { value: "99.9%", label: t("home.statUptime") },
    { value: "50+", label: t("page.statCountries") },
  ];

  const displayViews = [
    {
      icon: Monitor,
      label: t("page.projectorView"),
      desc: t("page.projectorDesc"),
    },
    {
      icon: Tablet,
      label: t("page.moderatorView"),
      desc: t("page.moderatorDesc"),
    },
    {
      icon: Smartphone,
      label: t("page.attendeeView"),
      desc: t("page.attendeeDesc"),
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
          backgroundImage: `radial-gradient(oklch(from var(--primary) l c h / 0.08) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10">
        {/* Navigation Header */}
        <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary p-2.5 shadow-lg shadow-primary/25">
                  <Star className="w-6 h-6 text-primary-foreground" />
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground">
                  HoiThao
                </h1>
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
                <ThemeSwitcher />
                <LanguageSwitcher currentLocale={locale} />
                <SignInButton mode="modal">
                  <button className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    {t("nav.login")}
                  </button>
                </SignInButton>
                <SignInButton mode="modal">
                  <button className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-full transition-all shadow-lg shadow-primary/25 flex items-center gap-2">
                    {t("page.startFree")}
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
                      className="text-muted-foreground hover:text-foreground transition-colors font-medium py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/50">
                    <ThemeSwitcher />
                    <LanguageSwitcher currentLocale={locale} />
                  </div>
                  <div className="flex flex-col gap-3 mt-3">
                    <SignInButton mode="modal">
                      <button className="w-full px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-full transition-all flex items-center justify-center gap-2">
                        {t("page.startFree")}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </SignInButton>
                  </div>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Hero Section */}
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

            <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed text-balance">
              {t("home.heroDesc")}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <SignInButton mode="modal">
                <button className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full transition-all shadow-xl shadow-primary/30 flex items-center gap-3 text-lg group">
                  {t("page.tryFree")}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </SignInButton>
              <Link
                href="#how-it-works"
                className="px-8 py-4 bg-secondary hover:bg-secondary/80 text-foreground font-semibold rounded-full transition-all flex items-center gap-3 text-lg border border-border"
              >
                <Play className="w-5 h-5" />
                {t("page.seeHowItWorks")}
              </Link>
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

        {/* Interactive Features Section */}
        <section id="features" className="px-6 py-24 bg-secondary/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Layers className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  {t("page.featuresBadge")}
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                {t("page.featuresHeading")}{" "}
                <span className="text-gradient-gold">
                  {t("page.featuresHeadingHighlight")}
                </span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                {t("home.featuresSubtitle")}
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 items-start">
              {/* Feature Tabs */}
              <div className="space-y-4">
                {interactiveFeatures.map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() => setActiveFeature(feature.id)}
                    className={`w-full text-left p-6 rounded-2xl border transition-all ${
                      activeFeature === feature.id
                        ? "bg-card border-primary/30 shadow-lg"
                        : "bg-card/50 border-border hover:border-primary/20"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                          activeFeature === feature.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        <feature.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground text-lg mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-muted-foreground text-sm mb-3">
                          {feature.description}
                        </p>
                        {activeFeature === feature.id && (
                          <div className="flex flex-wrap gap-2">
                            {feature.benefits.map((benefit) => (
                              <span
                                key={benefit}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/20 text-xs font-medium text-foreground"
                              >
                                <Check className="w-3 h-3 text-accent" />
                                {benefit}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Feature Demo Preview */}
              <div className="bg-card rounded-3xl border border-border p-8 shadow-xl sticky top-24">
                {activeFeature === "qa" && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">
                          {t("page.qaDemo")}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {t("page.qaDemoDesc")}
                        </p>
                      </div>
                    </div>
                    {/* Mock Q&A Cards */}
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="w-3 h-3 text-primary" />
                          </div>
                          <span className="text-xs font-bold text-foreground">
                            Nguyen Van A
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-foreground">
                            {t("page.qaDemoSimilar")}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">
                          {t("page.qaDemoQuestion")}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-accent/10 border border-accent/30">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-accent/30 text-foreground font-bold">
                            {t("page.qaDemoMatched")}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">
                          {t("page.qaDemoMatchedDesc")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeFeature === "voice" && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                        <Mic className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">
                          {t("page.featureVoiceTitle")}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          AI nhận diện realtime
                        </p>
                      </div>
                    </div>
                    {/* Voice Demo */}
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-xs font-bold text-primary">
                          {t("page.voiceDemoListening")}
                        </span>
                      </div>
                      <div className="h-12 flex items-center justify-center gap-1">
                        {[...Array(20)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1 bg-primary rounded-full animate-pulse"
                            style={{
                              height: `${Math.random() * 100}%`,
                              animationDelay: `${i * 0.05}s`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-accent/10 border border-accent/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-accent" />
                          <span className="text-xs font-bold text-foreground">
                            {t("page.voiceDemoAudience")}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t("page.voiceDemoAudienceDesc")}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-primary/10 border border-primary/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Mic className="w-4 h-4 text-primary" />
                          <span className="text-xs font-bold text-foreground">
                            {t("page.voiceDemoSpeaker")}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t("page.voiceDemoSpeakerDesc")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeFeature === "upload" && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                        <Upload className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">
                          {t("page.uploadDemoTitle")}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {t("page.uploadDemoSubtitle")}
                        </p>
                      </div>
                    </div>
                    {/* Upload Demo */}
                    <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-primary/30 transition-colors">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm font-medium text-foreground mb-1">
                        {t("page.uploadDemoDropzone")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("page.uploadDemoFormats")}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-accent" />
                        <span className="text-foreground">
                          {t("page.uploadDemoKeywords")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-accent" />
                        <span className="text-foreground">
                          {t("page.uploadDemoQuestions")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-accent" />
                        <span className="text-foreground">
                          {t("page.uploadDemoASR")}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activeFeature === "analytics" && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                        <PieChart className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">
                          {t("page.analyticsDemoTitle")}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {t("page.analyticsDemoSubtitle")}
                        </p>
                      </div>
                    </div>
                    {/* Analytics Demo */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                        <p className="text-2xl font-bold text-foreground">
                          247
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("page.analyticsDemoQuestions")}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                        <p className="text-2xl font-bold text-foreground">
                          89%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("page.analyticsDemoAnswered")}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                        <p className="text-2xl font-bold text-foreground">
                          1.2K
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("page.analyticsDemoInteractions")}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                        <p className="text-2xl font-bold text-foreground">
                          45m
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("page.analyticsDemoDuration")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* QR Code & Multiple Views Section */}
        <section className="px-6 py-24">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/20 border border-accent/30 mb-4">
                  <QrCode className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium text-foreground">
                    {t("page.qrBadge")}
                  </span>
                </div>
                <h2 className="text-4xl font-bold text-foreground mb-6">
                  {t("page.qrHeading")}{" "}
                  <span className="text-gradient-gold">QR Code</span>
                </h2>
                <p className="text-muted-foreground text-lg mb-8">
                  {t("page.qrDesc")}
                </p>
                <div className="space-y-4">
                  {displayViews.map((view) => (
                    <div
                      key={view.label}
                      className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <view.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">
                          {view.label}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {view.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-card rounded-3xl border border-border p-8 shadow-xl">
                <div className="aspect-square bg-secondary/50 rounded-2xl flex items-center justify-center mb-6">
                  <div className="w-48 h-48 bg-foreground/5 rounded-xl flex items-center justify-center">
                    <QrCode className="w-32 h-32 text-foreground/30" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-2">
                    {t("page.qrRoomCode")}
                  </p>
                  <p className="text-3xl font-mono font-bold text-primary tracking-widest">
                    CONF2026
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="px-6 py-24 bg-secondary/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  {t("page.howItWorksBadge")}
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                {t("page.howItWorksHeading")}{" "}
                <span className="text-gradient-gold">
                  {t("page.howItWorksHeadingHighlight")}
                </span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                {t("page.howItWorksDesc")}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {howItWorks.map((step, index) => (
                <div key={step.step} className="relative">
                  {index < howItWorks.length - 1 && (
                    <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-border -translate-y-1/2 z-0">
                      <ChevronRight className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="bg-card rounded-2xl border border-border p-6 relative z-10 h-full hover:border-primary/30 hover:shadow-lg transition-all">
                    <div className="text-5xl font-bold text-primary/20 mb-4">
                      {step.step}
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <step.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-foreground text-lg mb-2">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Solutions Section */}
        <section id="solutions" className="px-6 py-24">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/20 border border-accent/30 mb-4">
                <Briefcase className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-foreground">
                  {t("page.solutionsBadge")}
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                {t("page.solutionsHeading")}{" "}
                <span className="text-gradient-gold">
                  {t("page.solutionsHeadingHighlight")}
                </span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                {t("page.solutionsDesc")}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {solutions.map((solution) => (
                <div
                  key={solution.title}
                  className="group bg-card rounded-2xl border border-border p-6 hover:border-primary/30 hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <solution.icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-2">
                    {solution.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {solution.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Join Session Section */}
        <section className="px-6 py-24 bg-secondary/30">
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
                  {t("page.joinHeading")}
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
                </div>
                <button
                  type="submit"
                  disabled={loading || !roomCode.trim()}
                  className="w-full py-5 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-bold rounded-2xl transition-all flex items-center justify-center gap-3 text-lg shadow-lg shadow-primary/25"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t("page.searchingRoom")}
                    </>
                  ) : (
                    <>
                      {t("home.joinButton")}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              {t("page.ctaHeading")}{" "}
              <span className="text-gradient-gold">
                {t("page.ctaHeadingHighlight")}
              </span>{" "}
              {t("page.ctaHeadingEnd")}
            </h2>
            <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
              {t("page.ctaDesc")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <SignInButton mode="modal">
                <button className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full transition-all shadow-xl shadow-primary/30 flex items-center gap-3 text-lg group">
                  {t("page.startFree")}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </SignInButton>
              <Link
                href="#contact"
                className="px-8 py-4 bg-secondary hover:bg-secondary/80 text-foreground font-semibold rounded-full transition-all flex items-center gap-3 text-lg border border-border"
              >
                {t("page.ctaSales")}
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer id="contact" className="border-t border-border bg-card/50">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <div className="grid md:grid-cols-4 gap-12">
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                    <Star className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-xl text-foreground">
                    HoiThao
                  </span>
                </div>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  {t("home.heroDesc")}
                </p>
                <div className="flex items-center gap-4">
                  <ThemeSwitcher />
                  <LanguageSwitcher currentLocale={locale} />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-foreground mb-4">
                  {t("page.footerProduct")}
                </h4>
                <ul className="space-y-3 text-muted-foreground">
                  <li>
                    <Link
                      href="#features"
                      className="hover:text-foreground transition-colors"
                    >
                      {t("page.navFeatures")}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#solutions"
                      className="hover:text-foreground transition-colors"
                    >
                      {t("page.navSolutions")}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="hover:text-foreground transition-colors"
                    >
                      {t("page.footerPricing")}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="hover:text-foreground transition-colors"
                    >
                      API
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-foreground mb-4">
                  {t("page.footerContact")}
                </h4>
                <ul className="space-y-3 text-muted-foreground">
                  <li>hello@hoithao.vn</li>
                  <li>+84 123 456 789</li>
                  <li>Ha Noi, Viet Nam</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                2026 HoiThao. {t("home.footerRights")}
              </p>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <Link
                  href="#"
                  className="hover:text-foreground transition-colors"
                >
                  {t("page.footerTerms")}
                </Link>
                <Link
                  href="#"
                  className="hover:text-foreground transition-colors"
                >
                  {t("page.footerPrivacy")}
                </Link>
                <Link
                  href="#"
                  className="hover:text-foreground transition-colors"
                >
                  {t("page.footerCookie")}
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
