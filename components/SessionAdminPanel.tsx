'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Settings,
  BarChart3,
  MessageCircle,
  FileText,
  HelpCircle,
  Plus,
} from 'lucide-react';
import { InteractionSelector } from './InteractionSelector';
import { PollConfigurator } from './PollConfigurator';
import { InteractionsList } from './InteractionsList';
import { QAAnalyticsDashboard } from './QAAnalyticsDashboard';
import { MaterialsUpload } from './MaterialsUpload';
import { OnboardingGuide } from './OnboardingGuide';
import { QuestionClassificationSettings } from './QuestionClassificationSettings';
import { createInteraction, INTERACTION_TEMPLATES } from '@/lib/interactions';
import { InteractionType, PollConfig } from '@/lib/types/interactions';

interface SessionAdminPanelProps {
  seminarId: string;
  seminarTitle?: string;
}

type TabType =
  | 'interactions'
  | 'analytics'
  | 'settings'
  | 'materials'
  | 'guide';

interface TabDef {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

export function SessionAdminPanel({
  seminarId,
  seminarTitle,
}: SessionAdminPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('interactions');
  const [showSelector, setShowSelector] = useState(false);
  const [creatingType, setCreatingType] = useState<InteractionType | null>(null);
  const t = useTranslations();

  const tabs: TabDef[] = [
    {
      id: 'interactions',
      label: t('adminPage.tabInteractions'),
      icon: <MessageCircle className="w-4 h-4" />,
    },
    {
      id: 'analytics',
      label: t('adminPage.tabAnalytics'),
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: t('adminPage.tabSettings'),
      icon: <Settings className="w-4 h-4" />,
    },
    {
      id: 'materials',
      label: t('adminPage.tabMaterials'),
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'guide',
      label: t('adminPage.tabGuide'),
      icon: <HelpCircle className="w-4 h-4" />,
    },
  ];

  async function handleSelectInteractionType(type: InteractionType) {
    setCreatingType(type);
    setShowSelector(false);
  }

  async function handleCreatePoll(config: PollConfig) {
    const success = await createInteraction(
      seminarId,
      'poll',
      t('adminPage.newPoll'),
      undefined,
      config
    );

    if (success) {
      setCreatingType(null);
      // Interactions list will update via real-time subscription
    } else {
      alert(t('adminPage.failedToCreatePoll'));
    }
  }

  return (
    <div className="flex flex-col h-full bg-background rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-card">
        <h2 className="text-lg font-bold text-foreground">
          {seminarTitle
            ? `${seminarTitle} - ${t('adminPage.adminPanel')}`
            : t('adminPage.sessionAdmin')}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {t('adminPage.manageDesc')}
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
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.badge && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-primary text-primary-foreground">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* Interactions Tab */}
        {activeTab === 'interactions' && (
          <div className="space-y-4">
            {!showSelector && !creatingType && (
              <button
                onClick={() => setShowSelector(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                {t('adminPage.addNewInteraction')}
              </button>
            )}

            {showSelector && (
              <div className="rounded-lg border border-border bg-card p-4">
                <InteractionSelector
                  onSelect={handleSelectInteractionType}
                />
              </div>
            )}

            {creatingType === 'poll' && (
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
              <InteractionsList seminarId={seminarId} />
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div>
            <QAAnalyticsDashboard seminarId={seminarId} />
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <QuestionClassificationSettings
              seminarId={seminarId}
              onSettingChange={(enabled) => {
                // Trigger any needed state updates
              }}
            />
            <div className="rounded-lg border border-border bg-card p-4 space-y-4">
              <h3 className="font-semibold text-foreground">
                {t('adminPage.advancedSettings')}
              </h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-border"
                  />
                  <span className="text-sm text-foreground">
                    {t('adminPage.enablePolls')}
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-border"
                  />
                  <span className="text-sm text-foreground">
                    {t('adminPage.enableSurveys')}
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-border"
                  />
                  <span className="text-sm text-foreground">
                    {t('adminPage.enableWordCloud')}
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-border"
                  />
                  <span className="text-sm text-foreground">
                    {t('adminPage.allowAnonymousQuestions')}
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Materials Tab */}
        {activeTab === 'materials' && (
          <div>
            <MaterialsUpload seminarId={seminarId} />
          </div>
        )}

        {/* Guide Tab */}
        {activeTab === 'guide' && (
          <OnboardingGuide onClose={() => setActiveTab('interactions')} />
        )}
      </div>
    </div>
  );
}
