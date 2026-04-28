'use client';

import { useEffect, useState } from 'react';
import { Play, X, BarChart3, Loader2 } from 'lucide-react';
import { Interaction, InteractionType } from '@/lib/types/interactions';
import { supabase } from '@/lib/supabase';
import { activateInteraction, closeInteraction } from '@/lib/interactions';

interface InteractionsListProps {
  seminarId: string;
  currentInteractionId?: string;
}

const TYPE_COLORS: Record<InteractionType, string> = {
  qa: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  poll: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  survey: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  assessment: 'bg-green-500/10 text-green-600 border-green-500/20',
  wordcloud: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
};

const TYPE_NAMES: Record<InteractionType, string> = {
  qa: 'Q&A',
  poll: 'Poll',
  survey: 'Survey',
  assessment: 'Quiz',
  wordcloud: 'Word Cloud',
};

export function InteractionsList({
  seminarId,
  currentInteractionId,
}: InteractionsListProps) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchInteractions();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`interactions-${seminarId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interactions',
          filter: `seminar_id=eq.${seminarId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setInteractions((prev) => [...prev, payload.new as Interaction]);
          } else if (payload.eventType === 'UPDATE') {
            setInteractions((prev) =>
              prev.map((i) => (i.id === payload.new.id ? (payload.new as Interaction) : i))
            );
          } else if (payload.eventType === 'DELETE') {
            setInteractions((prev) => prev.filter((i) => i.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [seminarId]);

  async function fetchInteractions() {
    try {
      const { data, error } = await supabase
        .from('interactions')
        .select('*')
        .eq('seminar_id', seminarId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setInteractions((data || []) as Interaction[]);
    } catch (error) {
      console.error('Error fetching interactions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleActivate(id: string) {
    setActivatingId(id);
    const success = await activateInteraction(id, seminarId);
    if (!success) {
      alert('Failed to activate interaction');
    }
    setActivatingId(null);
  }

  async function handleClose(id: string) {
    const success = await closeInteraction(id);
    if (!success) {
      alert('Failed to close interaction');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (interactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">
          No interactions created yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {interactions.map((interaction) => (
        <div
          key={interaction.id}
          className={`rounded-lg border p-3 transition-all ${
            interaction.is_active
              ? 'border-primary/50 bg-primary/5'
              : 'border-border bg-card'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-medium border ${
                    TYPE_COLORS[interaction.type]
                  }`}
                >
                  {TYPE_NAMES[interaction.type]}
                </span>
                {interaction.is_active && (
                  <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-green-500/10 text-green-600 border border-green-500/20">
                    Active
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-foreground truncate">
                {interaction.title}
              </p>
              {interaction.description && (
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {interaction.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 ml-2">
              {!interaction.is_active && (
                <button
                  onClick={() => handleActivate(interaction.id)}
                  disabled={activatingId === interaction.id}
                  className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors disabled:opacity-50"
                  title="Activate this interaction"
                >
                  {activatingId === interaction.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>
              )}
              {interaction.is_active && (
                <button
                  onClick={() => handleClose(interaction.id)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                  title="Close this interaction"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
                <BarChart3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
