'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users, MessageCircle, Loader2, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AnalyticsData {
  total_questions: number;
  greeting_count: number;
  professional_count: number;
  answered_count: number;
  pending_count: number;
  unique_participants: number;
  engagement_rate: number;
  questions_per_minute: number;
  avg_response_time?: number;
}

interface QAAnalyticsDashboardProps {
  seminarId: string;
}

export function QAAnalyticsDashboard({ seminarId }: QAAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionDuration, setSessionDuration] = useState(0);

  useEffect(() => {
    fetchAnalytics();
    const timer = setInterval(fetchAnalytics, 5000); // Update every 5 seconds
    return () => clearInterval(timer);
  }, [seminarId]);

  async function fetchAnalytics() {
    try {
      // Get seminar info for timing
      const { data: seminarData } = await supabase
        .from('seminars')
        .select('created_at')
        .eq('id', seminarId)
        .single();

      if (seminarData?.created_at) {
        const duration = Math.floor(
          (Date.now() - new Date(seminarData.created_at).getTime()) / 1000 / 60
        );
        setSessionDuration(Math.max(duration, 1));
      }

      // Get questions stats
      const { data: questions } = await supabase
        .from('questions')
        .select('id, question_type, is_answered, author_id, created_at')
        .eq('seminar_id', seminarId);

      if (questions && questions.length > 0) {
        const uniqueParticipants = new Set(
          questions.map((q) => q.author_id).filter(Boolean)
        ).size;

        const greetingCount = questions.filter(
          (q) => q.question_type === 'greeting'
        ).length;
        const professionalCount = questions.filter(
          (q) => q.question_type === 'professional'
        ).length;
        const answeredCount = questions.filter(
          (q) => q.is_answered === true
        ).length;
        const pendingCount = questions.length - answeredCount;

        const qpm = sessionDuration > 0 ? questions.length / sessionDuration : 0;

        setAnalytics({
          total_questions: questions.length,
          greeting_count: greetingCount,
          professional_count: professionalCount,
          answered_count: answeredCount,
          pending_count: pendingCount,
          unique_participants: uniqueParticipants,
          engagement_rate: uniqueParticipants > 0 ? (uniqueParticipants / 100) * 100 : 0,
          questions_per_minute: qpm,
        });
      } else {
        setAnalytics({
          total_questions: 0,
          greeting_count: 0,
          professional_count: 0,
          answered_count: 0,
          pending_count: 0,
          unique_participants: 0,
          engagement_rate: 0,
          questions_per_minute: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
      </div>
    );
  }

  const metrics = [
    {
      label: 'Total Questions',
      value: analytics.total_questions,
      icon: MessageCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Answered',
      value: analytics.answered_count,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Pending',
      value: analytics.pending_count,
      icon: BarChart3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-500/10',
    },
    {
      label: 'Participants',
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
          Question Classification
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-muted-foreground">
                Professional Questions
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
                Casual Greetings
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
          Session Performance
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Questions/min</span>
            <span className="font-semibold text-foreground">
              {analytics.questions_per_minute.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Response Rate</span>
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
            <span className="text-sm text-muted-foreground">Session Duration</span>
            <span className="font-semibold text-foreground">
              {sessionDuration} min
            </span>
          </div>
        </div>
      </div>

      {/* Export Button */}
      <button className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors text-foreground font-medium text-sm">
        <Download className="w-4 h-4" />
        Export Report
      </button>
    </div>
  );
}
