'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Interaction } from '@/lib/types/interactions';
import { supabase } from '@/lib/supabase';
import { PollVoting } from './PollVoting';
import { WordCloudSubmission } from './WordCloudSubmission';
import { useTranslations } from 'next-intl';

interface ActiveInteractionDisplayProps {
  seminarId: string;
  respondentId?: string;
  respondentName?: string;
  onInteractionChange?: (interaction: Interaction | null) => void;
}

export function ActiveInteractionDisplay({
  seminarId,
  respondentId,
  respondentName,
  onInteractionChange,
}: ActiveInteractionDisplayProps) {
  const t = useTranslations();
  const [activeInteraction, setActiveInteraction] = useState<Interaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveInteraction();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`interactions-${seminarId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'seminars',
          filter: `id=eq.${seminarId}`,
        },
        (payload) => {
          if (payload.new.current_interaction_id) {
            fetchActiveInteraction();
          } else {
            setActiveInteraction(null);
            onInteractionChange?.(null);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [seminarId]);

  async function fetchActiveInteraction() {
    try {
      const { data, error } = await supabase
        .from('interactions')
        .select('*')
        .eq('seminar_id', seminarId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

      setActiveInteraction((data as Interaction) || null);
      onInteractionChange?.(data as Interaction || null);
    } catch (error) {
      console.error('Error fetching active interaction:', error);
      setActiveInteraction(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (!activeInteraction) {
    return null;
  }

  // Render based on interaction type
  switch (activeInteraction.type) {
    case 'poll':
      return (
        <PollVoting
          interaction={activeInteraction}
          respondentId={respondentId}
          respondentName={respondentName}
        />
      );

    case 'wordcloud':
      return (
        <WordCloudSubmission
          interaction={activeInteraction}
          respondentId={respondentId}
        />
      );

    case 'survey':
      return (
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {t('interactions.surveyComingSoon')}
          </p>
        </div>
      );

    case 'assessment':
      return (
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {t('interactions.quizComingSoon')}
          </p>
        </div>
      );

    default:
      return null;
  }
}
