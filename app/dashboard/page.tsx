"use client";
import { useEffect, useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  PlusCircle,
  History,
  Calendar,
  MessageCircle,
  ChevronRight,
  Loader2,
  Star,
  LayoutDashboard,
  Users,
  Clock,
  Zap,
  TrendingUp,
  ArrowUpRight,
  Mic,
  Play,
  Upload,
  Brain,
  Volume2,
  FileText,
  Settings,
  X,
  Check,
  Info,
  Sparkles,
  Target,
  QrCode,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  CreateSessionModal,
  SessionConfig,
} from "@/components/CreateSessionModal";

export default function Dashboard() {
  const router = useRouter();
  const { user } = useUser();
  const [seminars, setSeminars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showDemoFlow, setShowDemoFlow] = useState(true);
  const t = useTranslations();
  const locale = useLocale();

  useEffect(() => {
    if (!user) return;

    const fetchSeminars = async () => {
      const { data, error } = await supabase
        .from("seminars")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error) setSeminars(data || []);
      setLoading(false);
    };

    fetchSeminars();
  }, [user]);

  const handleCreateSession = async (config: SessionConfig) => {
    if (!user) return;
    setIsCreating(true);

    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const title =
      config.title ||
      `Phien ${new Date().toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })}`;

    const { data, error } = await supabase
      .from("seminars")
      .insert([
        {
          title,
          description: config.description,
          code: roomCode,
          user_id: user.id,
          status: "live",
          enable_voice_ai: config.enableVoiceAI,
          enable_upload: config.enableUpload,
          voice_language: config.voiceLanguage,
          moderation_level: config.moderationLevel,
          extracted_keywords: config.extractedKeywords || null,
          suggested_questions: config.suggestedQuestions || null,
        },
      ])
      .select()
      .single();

    setIsCreating(false);
    setShowCreateModal(false);

    if (error) {
      console.error("Error creating session:", error.message);
      return;
    }

    router.push(`/session/${data.id}`);
  };

  const liveSessions = seminars.filter((s) => s.status === "live").length;
  const totalQuestions = seminars.reduce(
    (acc, s) => acc + (s.question_count || 0),
    0,
  );

  const demoSteps = [
    {
      step: 1,
      icon: Settings,
      title: "Tao phien & Upload slide",
      description:
        "Tao phien moi, upload ban thuyet trinh de AI trich xuat keyword va cau hoi goi y",
      detail:
        "AI se phan tich noi dung slide va trich xuat cac tu khoa quan trong, dong thoi tao ra cac cau hoi mau giup khan gia co dinh huong dat cau hoi.",
    },
    {
      step: 2,
      icon: QrCode,
      title: "Chia se QR Code",
      description:
        "Hien thi QR code hoac chia se ma phong de khan gia tham gia",
      detail:
        "Khan gia quet QR hoac nhap ma phong tren dien thoai de gui cau hoi. Co the gui an danh hoac dang ky ten.",
    },
    {
      step: 3,
      icon: Mic,
      title: "Bat Voice AI",
      description:
        "Bat mic de AI nhan dien giong noi dien gia va khan gia trong thoi gian thuc",
      detail:
        "He thong se tu dong phan biet giong noi cua dien gia (nguoi dang trinh bay) va khan gia (nguoi dat cau hoi). Cau hoi se duoc ghi nhan va cau tra loi se duoc ghep tu dong.",
    },
    {
      step: 4,
      icon: Brain,
      title: "AI tu dong xu ly",
      description:
        "AI phan loai, gom nhom cau hoi tuong tu va ghep cau tra loi tu dong",
      detail:
        "Cac cau hoi giong nhau se duoc gom lai, cau hoi duoc nhieu nguoi quan tam se duoc uu tien. Khi dien gia tra loi, AI se tu dong khop cau tra loi voi cau hoi tuong ung.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
              <Star className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">
              Conference Hub
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-primary font-medium text-sm flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              {t("nav.dashboard")}
            </Link>
            <LanguageSwitcher currentLocale={locale} />
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10 ring-2 ring-primary/20",
                },
              }}
            />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/20 border border-accent/30 text-xs font-medium text-foreground mb-4">
              <Star className="w-3 h-3 text-accent" />
              Dashboard
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {t("dashboard.welcomeBack")}{" "}
              <span className="text-gradient-gold">
                {user?.firstName || t("dashboard.defaultHost")}
              </span>
            </h1>
            <p className="text-muted-foreground text-lg">
              {t("dashboard.subtitle")}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-full font-semibold flex items-center gap-3 transition-all shadow-lg shadow-primary/25 active:scale-95 group"
          >
            <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            {t("dashboard.createSession")}
          </button>
        </div>

        {/* Demo Flow Section */}
        <div className="mb-10">
          <button
            onClick={() => setShowDemoFlow(!showDemoFlow)}
            className="flex items-center gap-3 mb-4 group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-foreground">
                Huong dan su dung Voice Hoi thao
              </h3>
              <p className="text-sm text-muted-foreground">
                Xem cach Voice AI hoat dong trong phien hoi thao
              </p>
            </div>
            {showDemoFlow ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground ml-auto" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground ml-auto" />
            )}
          </button>

          {showDemoFlow && (
            <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
              {/* Flow Diagram */}
              <div className="grid md:grid-cols-4 gap-4">
                {demoSteps.map((item, index) => (
                  <div key={item.step} className="relative">
                    {index < demoSteps.length - 1 && (
                      <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-border -translate-y-1/2 z-0">
                        <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="relative z-10 p-4 rounded-xl bg-secondary/50 border border-border h-full hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <item.icon className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-xs font-bold text-primary">
                          Buoc {item.step}
                        </span>
                      </div>
                      <h4 className="font-bold text-foreground text-sm mb-2">
                        {item.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Detailed Demo */}
              <div className="border-t border-border pt-6">
                <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent" />
                  Demo chi tiet: Cach Voice AI phan loai cau hoi va tra loi
                </h4>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Speaker Detection */}
                  <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                        <Mic className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">
                          Dien gia
                        </span>
                        <p className="text-sm text-foreground font-medium">
                          Nguoi dang trinh bay
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-card border border-border">
                        <p className="text-sm text-foreground italic">
                          &quot;Cam on cau hoi cua ban. Ve van de bao mat, chung
                          toi su dung ma hoa AES-256...&quot;
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-foreground font-bold">
                            Cau tra loi
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Tu dong ghep voi cau hoi ve bao mat
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Audience Detection */}
                  <div className="p-5 rounded-2xl bg-accent/5 border border-accent/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                        <Users className="w-6 h-6 text-foreground" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-accent uppercase tracking-wider">
                          Khan gia
                        </span>
                        <p className="text-sm text-foreground font-medium">
                          Nguoi tham du
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-card border border-border">
                        <p className="text-sm text-foreground italic">
                          &quot;Toi muon hoi ve van de bao mat du lieu nguoi
                          dung?&quot;
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-foreground font-bold">
                            Cau hoi moi
                          </span>
                          <span className="text-xs text-muted-foreground">
                            +3 nguoi cung hoi tuong tu
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Matching Demo */}
                <div className="mt-6 p-5 rounded-2xl bg-secondary/50 border border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <Brain className="w-6 h-6 text-primary" />
                    <span className="font-bold text-foreground">
                      AI tu dong khop cau tra loi
                    </span>
                  </div>
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="flex-1 p-4 rounded-xl bg-card border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-accent" />
                        <span className="text-xs font-bold text-muted-foreground">
                          CAU HOI
                        </span>
                      </div>
                      <p className="text-sm text-foreground">
                        &quot;Lam sao de dam bao du lieu khong bi ro ri?&quot;
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                      <ArrowRight className="w-4 h-4 text-foreground" />
                    </div>
                    <div className="flex-1 p-4 rounded-xl bg-accent/10 border border-accent/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Check className="w-4 h-4 text-accent" />
                        <span className="text-xs font-bold text-accent">
                          AI MATCHED
                        </span>
                      </div>
                      <p className="text-sm text-foreground">
                        &quot;...chung toi su dung ma hoa AES-256 va audit log
                        cho moi truy cap...&quot;
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-card rounded-2xl border border-border p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Calendar className="w-7 h-7 text-primary" />
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3" />
                <span>+12%</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">
              {seminars.length}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.totalSessions")}
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 hover:border-accent/30 hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                <Zap className="w-7 h-7 text-accent" />
              </div>
              {liveSessions > 0 && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/20 text-xs font-bold text-foreground">
                  <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">
              {liveSessions}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.liveNow")}
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <MessageCircle className="w-7 h-7 text-primary" />
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3" />
                <span>+8%</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">
              {totalQuestions}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.totalQuestions")}
            </p>
          </div>
        </div>

        {/* Feature Cards for Upcoming Features */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Upload Presentation Feature */}
          <div className="bg-card rounded-2xl border border-border p-6 relative overflow-hidden group hover:border-primary/30 transition-colors">
            <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-primary/10 text-xs font-bold text-primary">
              Moi
            </div>
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <Upload className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground text-lg mb-2">
                  Upload ban thuyet trinh
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  AI se trich xuat keyword tu slide de cai thien do chinh xac
                  nhan dien giong noi va tao cau hoi goi y cho khan gia.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1.5 rounded-full bg-secondary text-xs font-medium text-foreground border border-border">
                    PDF
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-secondary text-xs font-medium text-foreground border border-border">
                    PPT
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-secondary text-xs font-medium text-foreground border border-border">
                    PPTX
                  </span>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Thu ngay
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Voice AI Feature */}
          <div className="bg-card rounded-2xl border border-border p-6 relative overflow-hidden group hover:border-accent/30 transition-colors">
            <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-accent/20 text-xs font-bold text-foreground">
              Voice AI
            </div>
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center shrink-0 group-hover:bg-accent/30 transition-colors">
                <Mic className="w-7 h-7 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground text-lg mb-2">
                  Voice Hoi thao
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Tu dong nhan dien giong noi, phan biet dien gia va khan gia.
                  AI se ghep cau tra loi voi cau hoi tuong ung.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1.5 rounded-full bg-secondary text-xs font-medium text-foreground border border-border">
                    Tieng Viet
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-secondary text-xs font-medium text-foreground border border-border">
                    English
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-secondary text-xs font-medium text-foreground border border-border">
                    Realtime
                  </span>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent/80 transition-colors"
                >
                  Bat dau su dung
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-3 text-xl font-semibold text-foreground">
              <History className="w-5 h-5 text-primary" />
              {t("dashboard.yourSessions")}
            </h2>
            {seminars.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {seminars.length} phien
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin w-8 h-8 text-primary" />
            </div>
          ) : seminars.length === 0 ? (
            <div className="bg-card rounded-3xl border-2 border-dashed border-border py-20 text-center">
              <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-foreground font-semibold text-lg mb-2">
                {t("dashboard.noSessions")}
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                {t("dashboard.noSessionsHint")}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full transition-all shadow-lg shadow-primary/25"
              >
                <PlusCircle className="w-4 h-4" />
                Tao phien dau tien
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {seminars.map((item) => (
                <div
                  key={item.id}
                  onClick={() => router.push(`/session/${item.id}`)}
                  className="bg-card rounded-2xl border border-border p-6 flex items-center justify-between group cursor-pointer hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center gap-5">
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
                        item.status === "live"
                          ? "bg-accent/20 text-accent"
                          : "bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                      }`}
                    >
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-lg group-hover:text-primary transition-colors">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs font-mono bg-primary/10 text-primary px-3 py-1.5 rounded-lg uppercase font-bold tracking-wider border border-primary/20">
                          {item.code}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(item.created_at).toLocaleDateString(
                            locale,
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                        </span>
                        {item.metadata?.enableVoiceAI && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Mic className="w-3.5 h-3.5" />
                            Voice AI
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {item.status === "live" && (
                      <span className="text-xs bg-accent/20 text-foreground px-4 py-2 rounded-full font-bold flex items-center gap-2 border border-accent/30">
                        <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                        {t("dashboard.live")}
                      </span>
                    )}
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Session Modal */}
      <CreateSessionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateSession={handleCreateSession}
        isCreating={isCreating}
      />
    </div>
  );
}
