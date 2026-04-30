"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  MessageCircle,
  ArrowLeft,
  Star,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { QAAnalyticsDashboard } from "@/components/QAAnalyticsDashboard";
import Link from "next/link";
import { useTranslations } from "next-intl";

type TabType = "interactions" | "analytics";

interface TabDef {
  id: TabType;
  label: string;
  icon: React.ReactNode;
}

export default function SessionAdminPage() {
  const { id } = useParams();
  const t = useTranslations("adminPage");
  const [activeTab, setActiveTab] = useState<TabType>("interactions");
  const seminarId = Array.isArray(id) ? id[0] : id;

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
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="border-b border-border bg-card/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/session/${seminarId}`}
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
                HoiThao
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
          <span className="font-semibold text-foreground">{seminarId}</span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex flex-col h-[calc(100vh-140px)] bg-card rounded-2xl border border-border overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-border bg-card">
            <h2 className="text-lg font-bold text-foreground">
              {t("sessionAdmin")}
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
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-base font-semibold text-foreground">
                        Upcoming Interactions Feature
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        This page currently shows an introduction and preview
                        only. No interaction data is saved to Supabase yet.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                  <h4 className="font-semibold text-foreground">
                    What it will include
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      "Live Poll creation",
                      "Survey collection",
                      "Word cloud responses",
                      "Question classification controls",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground"
                      >
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                  <h4 className="font-semibold text-foreground">
                    Example UI preview
                  </h4>
                  <div className="rounded-lg border border-dashed border-border p-4 bg-secondary/20">
                    <p className="text-sm font-medium text-foreground">
                      Example Poll: "Which topic should we cover next?"
                    </p>
                    <div className="mt-3 space-y-2">
                      {[
                        "AI in education",
                        "Data analytics",
                        "Cloud deployment",
                      ].map((option, idx) => (
                        <div
                          key={option}
                          className="h-8 rounded-md bg-muted flex items-center justify-between px-3 text-xs text-foreground"
                        >
                          <span>
                            {idx + 1}. {option}
                          </span>
                          <span className="text-muted-foreground">demo</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === "analytics" && (
              <div className="max-w-4xl">
                <QAAnalyticsDashboard seminarId={seminarId as string} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
