import { Interaction, InteractionType, PollConfig, SurveyConfig } from './types/interactions';
import { supabase } from './supabase';

export const INTERACTION_TEMPLATES = {
  poll: {
    title: 'Quick Poll',
    description: 'Ask a question with multiple choice options',
    config: {
      options: [
        { id: '1', text: 'Option 1' },
        { id: '2', text: 'Option 2' },
        { id: '3', text: 'Option 3' },
      ],
      allow_multiple: false,
      show_results: 'live' as const,
      anonymous: true,
    },
  },
  survey: {
    title: 'Feedback Survey',
    description: 'Collect detailed feedback from participants',
    config: {
      questions: [
        {
          key: 'q1',
          text: 'How would you rate this session?',
          type: 'rating' as const,
          required: true,
        },
        {
          key: 'q2',
          text: 'What did you like most?',
          type: 'text' as const,
          required: false,
        },
      ],
      allow_anonymous: true,
      show_results: true,
      allow_partial_submission: true,
    },
  },
  wordcloud: {
    title: 'Word Cloud',
    description: 'Collect single words or short phrases',
    config: {
      max_word_length: 30,
      min_word_length: 1,
      allow_duplicates: true,
      show_live: true,
    },
  },
  assessment: {
    title: 'Quick Quiz',
    description: 'Test knowledge with questions',
    config: {
      questions: [
        {
          id: '1',
          text: 'What is 2 + 2?',
          type: 'multiple_choice' as const,
          options: ['3', '4', '5', '6'],
          correct_answer: 1,
          explanation: 'Basic arithmetic: 2 + 2 = 4',
        },
      ],
      show_correct_answer: 'after_submission' as const,
      allow_retake: true,
      pass_threshold: 70,
    },
  },
};

export async function createInteraction(
  seminarId: string,
  type: InteractionType,
  title: string,
  description?: string,
  config?: any
): Promise<Interaction | null> {
  try {
    const { data, error } = await supabase
      .from('interactions')
      .insert({
        seminar_id: seminarId,
        type,
        title,
        description,
        config: config || {},
        is_active: false,
        display_order: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Interaction;
  } catch (error) {
    console.error('Error creating interaction:', error);
    return null;
  }
}

export async function activateInteraction(
  interactionId: string,
  seminarId: string
): Promise<boolean> {
  try {
    // Deactivate all other interactions for this seminar
    await supabase
      .from('interactions')
      .update({ is_active: false })
      .eq('seminar_id', seminarId);

    // Activate the selected interaction
    const { error } = await supabase
      .from('interactions')
      .update({
        is_active: true,
        activated_at: new Date().toISOString(),
      })
      .eq('id', interactionId);

    if (error) throw error;

    // Update current_interaction_id in seminars table
    await supabase
      .from('seminars')
      .update({ current_interaction_id: interactionId })
      .eq('id', seminarId);

    return true;
  } catch (error) {
    console.error('Error activating interaction:', error);
    return false;
  }
}

export async function closeInteraction(interactionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('interactions')
      .update({
        is_active: false,
        closed_at: new Date().toISOString(),
      })
      .eq('id', interactionId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error closing interaction:', error);
    return false;
  }
}

export async function getInteractionResponses(
  interactionId: string,
  type: InteractionType
) {
  try {
    let tableName = '';
    switch (type) {
      case 'poll':
        tableName = 'poll_responses';
        break;
      case 'survey':
        tableName = 'survey_responses';
        break;
      case 'wordcloud':
        tableName = 'wordcloud_responses';
        break;
      default:
        return null;
    }

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('interaction_id', interactionId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching responses:', error);
    return null;
  }
}

export function calculatePollAnalytics(responses: any[], totalOptions: number) {
  const results: Record<number, number> = {};

  for (let i = 0; i < totalOptions; i++) {
    results[i] = 0;
  }

  responses.forEach((response) => {
    results[response.option_index]++;
  });

  return {
    total_responses: responses.length,
    results,
    percentages: Object.fromEntries(
      Object.entries(results).map(([key, count]: [string, any]) => [
        key,
        responses.length > 0 ? ((count / responses.length) * 100).toFixed(1) : 0,
      ])
    ),
  };
}

export function calculateWordCloudData(responses: any[]) {
  const wordFrequency: Record<string, number> = {};

  responses.forEach((response) => {
    const word = response.word.toLowerCase();
    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
  });

  // Sort by frequency and return formatted for word cloud
  return Object.entries(wordFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 50)
    .map(([word, count]) => ({
      word,
      value: count,
      size: Math.min(Math.max(Math.log(count) * 30, 14), 48), // Dynamic sizing
    }));
}
