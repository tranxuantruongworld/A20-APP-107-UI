'use client';

import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Interaction } from '@/lib/types/interactions';
import { supabase } from '@/lib/supabase';

interface WordCloudSubmissionProps {
  interaction: Interaction;
  respondentId?: string;
}

export function WordCloudSubmission({
  interaction,
  respondentId,
}: WordCloudSubmissionProps) {
  const [word, setWord] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || loading) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('wordcloud_responses')
        .insert({
          interaction_id: interaction.id,
          word: word.trim(),
          respondent_id: respondentId || null,
          is_anonymous: !respondentId,
        });

      if (error) throw error;
      
      setWord('');
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      console.error('Error submitting word:', error);
      alert('Failed to submit word');
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

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="Type a word or phrase..."
          maxLength={50}
          disabled={loading}
          className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={!word.trim() || loading}
          className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit
            </>
          )}
        </button>
      </form>

      {submitted && (
        <p className="text-center text-sm text-green-600 font-medium">
          Word submitted! It will appear in the cloud shortly.
        </p>
      )}
    </div>
  );
}
