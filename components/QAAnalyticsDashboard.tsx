'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users, MessageCircle, Loader2, Download } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface AnalyticsData {
  total_questions: number;
  greeting_count: number;
  professional_count: number;
  answered_count: number;
  pending_count: number;
  unique_participants: number;
  engagement_rate: number;
  questions_per_minute: number;
  session_duration_minutes: number;
  avg_response_time?: number;
}

interface QAAnalyticsDashboardProps {
  seminarId: string;
}

export function QAAnalyticsDashboard({ seminarId }: QAAnalyticsDashboardProps) {
  const t = useTranslations();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/seminars/${seminarId}/analytics`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to fetch analytics.');
      }

      setAnalytics(data as AnalyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialTimer = setTimeout(() => {
      void fetchAnalytics();
    }, 0);
    const timer = setInterval(() => {
      void fetchAnalytics();
    }, 5000);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(timer);
    };
  }, [seminarId]);

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
      </div>
    );
  }

  const metrics = [
    {
      label: t('analytics.totalQuestions'),
      value: analytics.total_questions,
      icon: MessageCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: t('analytics.answered'),
      value: analytics.answered_count,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
    },
    {
      label: t('analytics.pending'),
      value: analytics.pending_count,
      icon: BarChart3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-500/10',
    },
    {
      label: t('analytics.participants'),
      value: analytics.unique_participants,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {metric.label}
                </span>
                <div className={`${metric.bgColor} p-2 rounded-lg`}>
                  <Icon className={`w-4 h-4 ${metric.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {metric.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Classification Breakdown */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          {t('analytics.questionClassification')}
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-muted-foreground">
                {t('analytics.professionalQuestions')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">
                {analytics.professional_count}
              </span>
              <span className="text-xs text-muted-foreground">
                {analytics.total_questions > 0
                  ? Math.round(
                      (analytics.professional_count / analytics.total_questions) *
                        100
                    )
                  : 0}
                %
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-sm text-muted-foreground">
                {t('analytics.casualGreetings')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">
                {analytics.greeting_count}
              </span>
              <span className="text-xs text-muted-foreground">
                {analytics.total_questions > 0
                  ? Math.round(
                      (analytics.greeting_count / analytics.total_questions) * 100
                    )
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          {t('analytics.sessionPerformance')}
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('analytics.questionsPerMinute')}</span>
            <span className="font-semibold text-foreground">
              {analytics.questions_per_minute.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('analytics.responseRate')}</span>
            <span className="font-semibold text-foreground">
              {analytics.total_questions > 0
                ? Math.round(
                    (analytics.answered_count / analytics.total_questions) * 100
                  )
                : 0}
              %
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('analytics.sessionDuration')}</span>
            <span className="font-semibold text-foreground">
              {t('analytics.durationMinutes', {
                count: analytics.session_duration_minutes,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Export Button */}
      <button className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors text-foreground font-medium text-sm">
        <Download className="w-4 h-4" />
        {t('analytics.exportReport')}
      </button>
    </div>
  );
}
