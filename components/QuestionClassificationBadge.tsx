'use client';

import { MessageCircle, HelpCircle, SmilePlus } from 'lucide-react';
import { QuestionType, getClassificationStyles } from '@/lib/classification';
import { useTranslations } from 'next-intl';

interface ClassificationBadgeProps {
  type: QuestionType;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function QuestionClassificationBadge({
  type,
  showLabel = true,
  size = 'md',
}: ClassificationBadgeProps) {
  const t = useTranslations();
  const styles = getClassificationStyles(type);

  const iconMap = {
    greeting: SmilePlus,
    professional: HelpCircle,
    unknown: MessageCircle,
  };

  const Icon = iconMap[type];

  const sizeMap = {
    sm: { icon: 12, text: 'text-xs', padding: 'px-2 py-1' },
    md: { icon: 14, text: 'text-sm', padding: 'px-3 py-1.5' },
    lg: { icon: 16, text: 'text-base', padding: 'px-4 py-2' },
  };

  const sizeConfig = sizeMap[size];
  const labelKey = type === 'greeting' ? 'classification.greeting' : type === 'professional' ? 'classification.professional' : 'classification.unknown';

  return (
    <div
      className={`${styles.bg} ${styles.border} border ${styles.text} inline-flex items-center gap-1.5 ${sizeConfig.padding} rounded-full ${sizeConfig.text} font-semibold`}
    >
      <Icon size={sizeConfig.icon} className={styles.icon} />
      {showLabel && <span>{t(labelKey)}</span>}
    </div>
  );
}
