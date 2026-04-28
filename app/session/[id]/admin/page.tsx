"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Settings,
  BarChart3,
  MessageCircle,
  FileText,
  HelpCircle,
  Plus,
  ArrowLeft,
  Star,
} from "lucide-react";
import { InteractionSelector } from "@/components/InteractionSelector";
import { PollConfigurator } from "@/components/PollConfigurator";
import { InteractionsList } from "@/components/InteractionsList";
import { QAAnalyticsDashboard } from "@/components/QAAnalyticsDashboard";
import { MaterialsUpload } from "@/components/MaterialsUpload";
import { OnboardingGuide } from "@/components/OnboardingGuide";
import { QuestionClassificationSettings } from "@/components/QuestionClassificationSettings";
import { createInteraction, INTERACTION_TEMPLATES } from "@/lib/interactions";
import { InteractionType, PollConfig } from "@/lib/types/interactions";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useTranslations } from "next-intl";

type TabType =
  | "interactions"
  | "analytics"
  | "settings"
  | "materials"
  | "guide";

interface TabDef {
  id: TabType;
  label: string;
  icon: React.ReactNode;
}

export default function SessionAdminPage() {
  const { id } = useParams();
  const router = useRouter();
  const t = useTranslations("adminPage");
  const [activeTab, setActiveTab] = useState<TabType>("interactions");
  const [showSelector, setShowSelector] = useState(false);
  const [creatingType, setCreatingType] = useState<InteractionType | null>(
    null,
  );
  const [seminar, setSeminar] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchSeminar = async () => {
      const { data } = await supabase
        .from("seminars")
        .select("*")
        .eq("id", id)
        .single();
      if (data) setSeminar(data);
      setLoading(false);
    };

    fetchSeminar();
  }, [id]);

  const tabs: TabDef[] = [
    {
      id: "interactions",
      label: t("tabInteractions"),
      icon: <MessageCircle className="w-4 h-4" />,
    },
    {
      id: "analytics",
      label: t("tabAnalytics"),
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: "settings",
      label: t("tabSettings"),
      icon: <Settings className="w-4 h-4" />,
    },
    {
      id: "materials",
      label: t("tabMaterials"),
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: "guide",
      label: t("tabGuide"),
      icon: <HelpCircle className="w-4 h-4" />,
    },
  ];

  async function handleSelectInteractionType(type: InteractionType) {
    setCreatingType(type);
    setShowSelector(false);
  }

  async function handleCreatePoll(config: PollConfig) {
    const success = await createInteraction(
      id as string,
      "poll",
      "New Poll",
      undefined,
      config,
    );
    if (success) {
      setCreatingType(null);
    } else {
      alert(t("failedToCreatePoll"));
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="border-b border-border bg-card/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/session/${id}`}
            className="w-10 h-10 rounded-xl bg-secondary hover:bg-primary/10 hover:text-primary flex items-center justify-center text-foreground transition-all border border-border"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
              <Star className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-foreground text-lg tracking-tight">
                hoi thao
              </span>
              <p className="text-xs text-muted-foreground">{t("adminPanel")}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            LIVE
          </div>
          <span className="font-semibold text-foreground">
            {seminar?.title}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex flex-col h-[calc(100vh-140px)] bg-card rounded-2xl border border-border overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-border bg-card">
            <h2 className="text-lg font-bold text-foreground">
              {seminar?.title ? `${seminar.title} - Admin` : t("sessionAdmin")}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {t("manageDesc")}
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex overflow-x-auto border-b border-border bg-secondary/30 px-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* Interactions Tab */}
            {activeTab === "interactions" && (
              <div className="space-y-4 max-w-4xl">
                {!showSelector && !creatingType && (
                  <button
                    onClick={() => setShowSelector(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    {t("addNewInteraction")}
                  </button>
                )}
                {showSelector && (
                  <div className="rounded-lg border border-border bg-card p-4">
                    <InteractionSelector
                      onSelect={handleSelectInteractionType}
                    />
                  </div>
                )}
                {creatingType === "poll" && (
                  <div className="rounded-lg border border-border bg-card p-4">
                    <PollConfigurator
                      initialConfig={
                        INTERACTION_TEMPLATES.poll.config as PollConfig
                      }
                      onSave={handleCreatePoll}
                      onCancel={() => setCreatingType(null)}
                    />
                  </div>
                )}
                <div>
                  <InteractionsList seminarId={id as string} />
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === "analytics" && (
              <div className="max-w-4xl">
                <QAAnalyticsDashboard seminarId={id as string} />
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="space-y-4 max-w-4xl">
                <QuestionClassificationSettings
                  seminarId={id as string}
                  onSettingChange={() => {}}
                />
                <div className="rounded-lg border border-border bg-card p-4 space-y-4">
                  <h3 className="font-semibold text-foreground">
                    {t("advancedSettings")}
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded border-border"
                      />
                      <span className="text-sm text-foreground">
                        {t("enablePolls")}
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-border"
                      />
                      <span className="text-sm text-foreground">
                        {t("enableSurveys")}
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-border"
                      />
                      <span className="text-sm text-foreground">
                        {t("enableWordCloud")}
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-border"
                      />
                      <span className="text-sm text-foreground">
                        {t("allowAnonymousQuestions")}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Materials Tab */}
            {activeTab === "materials" && (
              <div className="max-w-4xl">
                <MaterialsUpload seminarId={id as string} />
              </div>
            )}

            {/* Guide Tab */}
            {activeTab === "guide" && (
              <div className="max-w-4xl">
                <OnboardingGuide onClose={() => setActiveTab("interactions")} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
