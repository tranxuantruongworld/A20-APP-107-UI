'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  MessageCircle,
  Pickaxe,
  BarChart3,
  FileText,
  Cloud,
} from 'lucide-react';
import { InteractionType } from '@/lib/types/interactions';

interface InteractionSelectorProps {
  onSelect: (type: InteractionType) => void;
  disabled?: boolean;
}

const INTERACTION_ICONS: Record<InteractionType, React.ReactNode> = {
  qa: <MessageCircle className="w-6 h-6" />,
  poll: <BarChart3 className="w-6 h-6" />,
  survey: <FileText className="w-6 h-6" />,
  assessment: <Pickaxe className="w-6 h-6" />,
  wordcloud: <Cloud className="w-6 h-6" />,
};

export function InteractionSelector({
  onSelect,
  disabled = false,
}: InteractionSelectorProps) {
  const [expandedType, setExpandedType] = useState<InteractionType | null>(null);
  const t = useTranslations();

  const interactionTypes: InteractionType[] = [
    'poll',
    'survey',
    'assessment',
    'wordcloud',
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-foreground">
        {t('interactions.addInteraction')}
      </p>

      <div className="grid grid-cols-2 gap-2">
        {interactionTypes.map((type) => (
          <button
            key={type}
            onClick={() => {
              onSelect(type);
              setExpandedType(type);
            }}
            disabled={disabled}
            className="group relative overflow-hidden rounded-xl border border-border bg-card p-3 text-left transition-all hover:border-primary/50 hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col gap-2">
              <div className="text-primary group-hover:scale-110 transition-transform">
                {INTERACTION_ICONS[type]}
              </div>
              <p className="text-sm font-medium text-foreground">
                {t(`interactions.labels.${type}`)}
              </p>
            </div>
          </button>
        ))}
      </div>

      {expandedType && (
        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {t('interactions.descriptionTitle', {
              type: t(`interactions.labels.${expandedType}`),
            })}
          </p>
          <p className="text-sm text-foreground">
            {t(`interactions.descriptions.${expandedType}`)}
          </p>
        </div>
      )}
    </div>
  );
}
