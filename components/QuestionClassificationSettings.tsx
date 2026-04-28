'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { Toggle } from '@/components/ui/toggle';
import { Info } from 'lucide-react';

interface QuestionClassificationSettingsProps {
  seminarId: string;
  onSettingChange?: (enabled: boolean) => void;
}

export function QuestionClassificationSettings({
  seminarId,
  onSettingChange,
}: QuestionClassificationSettingsProps) {
  const [isEnabled, setIsEnabled] = useState(true); // Default enabled
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const t = useTranslations();

  useEffect(() => {
    loadSettings();
  }, [seminarId]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('seminars')
        .select('enable_question_classification')
        .eq('id', seminarId)
        .single();

      if (error) throw error;
      
      setIsEnabled(data?.enable_question_classification ?? true);
    } catch (error) {
      console.error('Error loading classification settings:', error);
      setIsEnabled(true); // Default to enabled on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (newValue: boolean) => {
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('seminars')
        .update({ enable_question_classification: newValue })
        .eq('id', seminarId);

      if (error) throw error;

      setIsEnabled(newValue);
      onSettingChange?.(newValue);
    } catch (error) {
      console.error('Error saving classification settings:', error);
      // Revert on error
      setIsEnabled(!newValue);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading settings...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-background border border-border">
        <div className="flex-1">
          <h3 className="font-medium text-foreground">{t('classification.enableLabel')}</h3>
          <p className="text-sm text-muted-foreground mt-1">{t('classification.enableDesc')}</p>
        </div>
        <Toggle
          pressed={isEnabled}
          onPressedChange={handleToggle}
          disabled={isSaving}
          aria-label="Toggle question classification"
          className="flex-shrink-0"
        />
      </div>

      {isEnabled && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-info/10 border border-info/20">
          <Info size={16} className="text-info flex-shrink-0 mt-0.5" />
          <p className="text-xs text-info">
            Questions will be automatically classified as greetings, professional questions, or other. Classification badges will be visible to all attendees by default.
          </p>
        </div>
      )}
    </div>
  );
}
