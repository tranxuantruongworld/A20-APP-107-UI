'use client';

import { useState } from 'react';
import { X, ChevronRight, MessageCircle, BarChart3, FileText, Pickaxe, Cloud } from 'lucide-react';

interface Guide {
  id: string;
  title: string;
  description: string;
  steps: {
    title: string;
    description: string;
    tip?: string;
  }[];
  icon: React.ReactNode;
}

interface OnboardingGuideProps {
  onClose?: () => void;
}

const GUIDES: Guide[] = [
  {
    id: 'qa-essentials',
    title: 'Q&A Essentials',
    description: 'Master the core Q&A features to maximize audience engagement',
    icon: <MessageCircle className="w-5 h-5" />,
    steps: [
      {
        title: 'Enable Question Classification',
        description:
          'Toggle question classification to automatically tag questions as greetings or professional inquiries. This helps you prioritize and manage different types of questions.',
        tip: 'Enabled by default - attendees see badges next to questions',
      },
      {
        title: 'Monitor in Real-time',
        description:
          'Watch the question feed update live as attendees submit questions. Use the analytics dashboard to track engagement metrics.',
        tip: 'Questions are moderated by AI before appearing publicly',
      },
      {
        title: 'Answer Questions',
        description:
          'Select a question and provide your answer. Answered questions move to the answered section and can be pinned for visibility.',
        tip: 'You can also use voice input to answer questions with transcription',
      },
    ],
  },
  {
    id: 'polls-surveys',
    title: 'Polls & Surveys',
    description: 'Gather quick feedback and conduct surveys in real-time',
    icon: <BarChart3 className="w-5 h-5" />,
    steps: [
      {
        title: 'Create a Poll',
        description:
          'Set up multiple choice polls with customizable options. Choose whether to show results live or after voting closes.',
        tip: 'Live results encourage engagement - try this for quick feedback',
      },
      {
        title: 'Launch to Audience',
        description:
          'Activate the poll from your admin panel. Attendees see it on their screens and vote in real-time.',
        tip: 'Only one interaction can be active at a time',
      },
      {
        title: 'View Results',
        description:
          'Watch response counts and percentages update as votes come in. Close the poll when ready to move on.',
        tip: 'Results are displayed as both numbers and percentages',
      },
    ],
  },
  {
    id: 'wordcloud',
    title: 'Word Clouds',
    description: 'Visualize audience thoughts with interactive word clouds',
    icon: <Cloud className="w-5 h-5" />,
    steps: [
      {
        title: 'Start a Word Cloud',
        description:
          'Ask your audience to submit single words or short phrases. Words appear larger if mentioned more often.',
        tip: 'Great for brainstorming, word association, or quick reactions',
      },
      {
        title: 'Monitor Submissions',
        description:
          'View words as they arrive and see the cloud build in real-time with dynamic sizing based on frequency.',
        tip: 'You can filter out unwanted words during the session',
      },
      {
        title: 'Share Results',
        description:
          'Screenshot or share the final word cloud with your audience. Use it to discuss trends and themes.',
        tip: 'Export the word cloud data for follow-up analysis',
      },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics & Insights',
    description: 'Understand audience engagement with real-time metrics',
    icon: <BarChart3 className="w-5 h-5" />,
    steps: [
      {
        title: 'Dashboard Overview',
        description:
          'View key metrics including total questions, response rates, participant count, and question classification breakdown.',
        tip: 'Metrics update every 5 seconds during your session',
      },
      {
        title: 'Classification Insights',
        description:
          'See the percentage of professional vs. casual questions. Use this to gauge topic relevance and audience interest.',
        tip: 'High greeting % might indicate icebreaker phase; high professional % shows engagement',
      },
      {
        title: 'Export Reports',
        description:
          'Generate session reports with all metrics and question/response data for post-event analysis.',
        tip: 'Great for understanding what resonated with your audience',
      },
    ],
  },
];

export function OnboardingGuide({ onClose }: OnboardingGuideProps) {
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const guide = selectedGuide ? GUIDES.find((g) => g.id === selectedGuide) : null;
  const step = guide ? guide.steps[currentStep] : null;

  return (
    <div className="bg-gradient-to-b from-background to-secondary/20 rounded-2xl border border-border p-6 space-y-4 max-h-[500px] overflow-y-auto">
      {!selectedGuide ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground">Get Started</h3>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="space-y-2">
            {GUIDES.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  setSelectedGuide(g.id);
                  setCurrentStep(0);
                }}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="text-primary group-hover:scale-110 transition-transform">
                    {g.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {g.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {g.description}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        </>
      ) : guide && step ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setSelectedGuide(null)}
              className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
            >
              ← Back
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-primary">{guide.icon}</div>
              <h3 className="text-lg font-bold text-foreground">{guide.title}</h3>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  Step {currentStep + 1} of {guide.steps.length}: {step.title}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
                {step.tip && (
                  <p className="text-xs text-primary/80 bg-primary/10 rounded-lg p-2 mt-3 border border-primary/20">
                    💡 {step.tip}
                  </p>
                )}
              </div>

              {/* Progress bar */}
              <div className="flex gap-1">
                {guide.steps.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      idx <= currentStep ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                ))}
              </div>

              {/* Navigation */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentStep(
                      Math.min(guide.steps.length - 1, currentStep + 1)
                    )
                  }
                  disabled={currentStep === guide.steps.length - 1}
                  className="ml-auto px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Next
                  {currentStep < guide.steps.length - 1 && (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
