'use client';

import { useState } from 'react';
import { Plus, Trash2, Send } from 'lucide-react';
import { PollConfig } from '@/lib/types/interactions';
import { useTranslations } from 'next-intl';

interface PollConfiguratorProps {
  initialConfig?: PollConfig;
  onSave: (config: PollConfig) => void;
  onCancel: () => void;
}

export function PollConfigurator({
  initialConfig,
  onSave,
  onCancel,
}: PollConfiguratorProps) {
  const t = useTranslations();
  const [config, setConfig] = useState<PollConfig>(
    initialConfig || {
      options: [
        { id: '1', text: t('pollConfig.optionLabel', {index: 1}) },
        { id: '2', text: t('pollConfig.optionLabel', {index: 2}) },
      ],
      allow_multiple: false,
      show_results: 'live',
      anonymous: true,
    }
  );

  const handleAddOption = () => {
    setConfig({
      ...config,
      options: [
        ...config.options,
        {
          id: Math.random().toString(),
          text: t('pollConfig.optionLabel', {index: config.options.length + 1}),
        },
      ],
    });
  };

  const handleRemoveOption = (id: string) => {
    setConfig({
      ...config,
      options: config.options.filter((opt) => opt.id !== id),
    });
  };

  const handleUpdateOption = (id: string, text: string) => {
    setConfig({
      ...config,
      options: config.options.map((opt) =>
        opt.id === id ? { ...opt, text } : opt
      ),
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <label className="text-sm font-semibold text-foreground block">
          {t('pollConfig.options')}
        </label>
        {config.options.map((option, idx) => (
          <div key={option.id} className="flex items-center gap-2">
            <input
              type="text"
              value={option.text}
              onChange={(e) => handleUpdateOption(option.id, e.target.value)}
              placeholder={t('pollConfig.optionLabel', {index: idx + 1})}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
            />
            <button
              onClick={() => handleRemoveOption(option.id)}
              className="text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors"
              disabled={config.options.length <= 2}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          onClick={handleAddOption}
          className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium"
        >
          <Plus className="w-4 h-4" />
          {t('pollConfig.addOption')}
        </button>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.allow_multiple}
            onChange={(e) =>
              setConfig({ ...config, allow_multiple: e.target.checked })
            }
            className="rounded border-border"
          />
          <span className="text-sm text-foreground">
            {t('pollConfig.allowMultiple')}
          </span>
        </label>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground block">
          {t('pollConfig.showResults')}
        </label>
        <select
          value={config.show_results}
          onChange={(e) =>
            setConfig({
              ...config,
              show_results: e.target.value as 'live' | 'end' | 'hidden',
            })
          }
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="live">{t('pollConfig.resultsLive')}</option>
          <option value="end">{t('pollConfig.resultsEnd')}</option>
          <option value="hidden">{t('pollConfig.resultsHidden')}</option>
        </select>
      </div>

      <div className="flex gap-2 justify-end pt-4 border-t border-border">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors text-sm font-medium"
        >
          {t('pollConfig.cancel')}
        </button>
        <button
          onClick={() => onSave(config)}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          {t('pollConfig.createPoll')}
        </button>
      </div>
    </div>
  );
}
