'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Interaction, PollConfig } from '@/lib/types/interactions';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';

interface PollVotingProps {
  interaction: Interaction;
  respondentId?: string;
  respondentName?: string;
}

export function PollVoting({
  interaction,
  respondentId,
  respondentName,
}: PollVotingProps) {
  const t = useTranslations();
  const [selectedOptions, setSelectedOptions] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const config = interaction.config as PollConfig;

  const handleOptionToggle = (index: number) => {
    const newSelected = new Set(selectedOptions);
    if (!config.allow_multiple) {
      newSelected.clear();
    }

    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }

    setSelectedOptions(newSelected);
  };

  const handleSubmit = async () => {
    if (selectedOptions.size === 0) return;

    setLoading(true);
    try {
      // Submit each selected option
      const responses = Array.from(selectedOptions).map((optionIndex) => ({
        interaction_id: interaction.id,
        option_index: optionIndex,
        respondent_id: respondentId || null,
        respondent_name: respondentName || t('join.anonymous'),
        is_anonymous: !respondentId,
      }));

      const { error } = await supabase
        .from('poll_responses')
        .insert(responses);

      if (error) throw error;
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting poll response:', error);
      alert(t('poll.submitFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">
          {interaction.title}
        </h3>
        {interaction.description && (
          <p className="text-sm text-muted-foreground">
            {interaction.description}
          </p>
        )}
      </div>

      {!submitted ? (
        <div className="space-y-3">
          {config.options.map((option, index) => (
            <button
              key={option.id}
              onClick={() => handleOptionToggle(index)}
              disabled={loading}
              className={`w-full p-3 rounded-xl border-2 transition-all text-left font-medium ${
                selectedOptions.has(index)
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-secondary hover:border-primary/50'
              } disabled:opacity-50`}
            >
              {config.allow_multiple && (
                <input
                  type="checkbox"
                  checked={selectedOptions.has(index)}
                  readOnly
                  className="mr-3"
                />
              )}
              {!config.allow_multiple && (
                <input
                  type="radio"
                  checked={selectedOptions.has(index)}
                  readOnly
                  className="mr-3"
                />
              )}
              {option.text}
            </button>
          ))}

          <button
            onClick={handleSubmit}
            disabled={selectedOptions.size === 0 || loading}
            className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('poll.submitting')}
              </>
            ) : (
              t('poll.vote')
            )}
          </button>
        </div>
      ) : (
        <div className="text-center py-6 space-y-2">
          <p className="text-green-600 font-medium">{t('poll.thanks')}</p>
          <p className="text-sm text-muted-foreground">
            {config.show_results === 'live'
              ? t('poll.resultsLive')
              : t('poll.resultsClosed')}
          </p>
        </div>
      )}
    </div>
  );
}
