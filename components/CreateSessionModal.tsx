"use client";

import { useState, useCallback } from "react";
import {
  X,
  Upload,
  FileText,
  Sparkles,
  Mic,
  Settings,
  ChevronRight,
  Check,
  Loader2,
  AlertCircle,
  Brain,
  Zap,
  MessageCircle,
  Target,
  Play,
  Info,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSession: (config: SessionConfig) => void;
  isCreating?: boolean;
}

export interface SessionConfig {
  title: string;
  endTime?: string;
  description: string;
  enableVoiceAI: boolean;
  enableUpload: boolean;
  uploadedFile?: File;
  extractedKeywords?: string[];
  suggestedQuestions?: string[];
  voiceLanguage: string;
  moderationLevel: "strict" | "moderate" | "relaxed";
}

export function CreateSessionModal({
  isOpen,
  onClose,
  onCreateSession,
  isCreating = false,
}: CreateSessionModalProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<SessionConfig>({
    title: "",
    endTime: "",
    description: "",
    enableVoiceAI: true,
    enableUpload: false,
    voiceLanguage: "vi-VN",
    moderationLevel: "moderate",
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Mock AI extraction results
  const mockExtraction = {
    keywords: [
      "Machine Learning",
      "Neural Network",
      "Deep Learning",
      "AI Model",
      "Training Data",
      "Prediction",
      "Classification",
      "Natural Language",
      "Computer Vision",
      "Transformer",
    ],
    questions: [
      locale === "vi"
        ? "Machine Learning và Deep Learning khác nhau như thế nào?"
        : "What is the difference between Machine Learning and Deep Learning?",
      locale === "vi"
        ? "Làm thế nào để chọn mô hình AI phù hợp cho bài toán?"
        : "How do you choose the right AI model for a problem?",
      locale === "vi"
        ? "Dữ liệu huấn luyện cần bao nhiêu để đạt hiệu quả tốt?"
        : "How much training data is needed for strong results?",
      locale === "vi"
        ? "Các thách thức phổ biến khi triển khai AI là gì?"
        : "What are common challenges when deploying AI?",
      locale === "vi"
        ? "Kiến trúc Transformer hoạt động như thế nào?"
        : "How does Transformer architecture work?",
    ],
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (
      file &&
      (file.type === "application/pdf" ||
        file.name.endsWith(".pptx") ||
        file.name.endsWith(".ppt"))
    ) {
      processFile(file);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setUploadProgress(0);
    setConfig((prev) => ({ ...prev, uploadedFile: file, enableUpload: true }));

    // Simulate AI processing with progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Simulate AI extraction delay
    setTimeout(() => {
      setConfig((prev) => ({
        ...prev,
        extractedKeywords: mockExtraction.keywords,
        suggestedQuestions: mockExtraction.questions,
      }));
      setIsProcessing(false);
      clearInterval(progressInterval);
      setUploadProgress(100);
    }, 2500);
  };

  const handleCreate = () => {
    if (!config.title.trim()) {
      setConfig((prev) => ({
        ...prev,
        title: t("createSession.defaultSessionTitle", {
          date: new Date().toLocaleDateString(locale),
        }),
      }));
    }
    onCreateSession(config);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl bg-card rounded-3xl border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {t("createSession.title")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("createSession.subtitle")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicators */}
        <div className="px-6 pt-6">
          <div className="flex items-center gap-4 mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    step >= s
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
                <span
                  className={`text-sm font-medium ${step >= s ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {s === 1
                    ? t("createSession.step1")
                    : s === 2
                      ? t("createSession.step2")
                      : t("createSession.step3")}
                </span>
                {s < 3 && (
                  <div
                    className={`flex-1 h-0.5 ${step > s ? "bg-primary" : "bg-border"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[50vh] overflow-y-auto">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6 py-2">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("createSession.sessionName")}
                </label>
                <input
                  type="text"
                  placeholder={t("createSession.sessionNamePlaceholder")}
                  value={config.title}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("createSession.endTimeLabel")}
                </label>
                <input
                  type="datetime-local"
                  value={config.endTime || ""}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, endTime: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all text-foreground"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {t("createSession.endTimeHelp")}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("createSession.descriptionLabel")}
                </label>
                <textarea
                  placeholder={t("createSession.descriptionPlaceholder")}
                  value={config.description}
                  onChange={(e) => setConfig((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all text-foreground placeholder:text-muted-foreground min-h-[100px] resize-y"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      enableVoiceAI: !prev.enableVoiceAI,
                    }))
                  }
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    config.enableVoiceAI
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Mic className="w-6 h-6 text-primary" />
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        config.enableVoiceAI
                          ? "border-primary bg-primary"
                          : "border-border"
                      }`}
                    >
                      {config.enableVoiceAI && (
                        <Check className="w-4 h-4 text-primary-foreground" />
                      )}
                    </div>
                  </div>
                  <h3 className="font-bold text-foreground mb-1">
                    {t("createSession.voiceAI")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("createSession.voiceAIDesc")}
                  </p>
                </div>

                <div className="p-5 rounded-2xl border-2 border-border bg-secondary/20 relative overflow-hidden">
                  <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-accent/20 text-xs font-bold text-foreground">
                    {t("createSession.comingSoon")}
                  </div>
                  <div className="flex items-center justify-between mb-3 opacity-50">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                      <Target className="w-6 h-6 text-muted-foreground" />
                    </div>
                  </div>
                  <h3 className="font-bold text-foreground mb-1 opacity-50">
                    {t("createSession.livePoll")}
                  </h3>
                  <p className="text-sm text-muted-foreground opacity-50">
                    {t("createSession.livePollDesc")}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-accent/10 border border-accent/30 flex items-start gap-3">
                <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-foreground font-medium">
                    {t("createSession.voiceAI")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("createSession.voiceAIInfo")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Upload Presentation */}
          {step === 2 && (
            <div className="space-y-6 py-2">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {t("createSession.uploadTitle")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("createSession.uploadDesc")}
                </p>
              </div>

              {!config.uploadedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground mb-2">
                    {t("createSession.dragDrop")}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t("createSession.or")}
                  </p>
                  <label className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full cursor-pointer transition-all">
                    <FileText className="w-5 h-5" />
                    {t("createSession.selectFile")}
                    <input
                      type="file"
                      accept=".pdf,.ppt,.pptx"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-muted-foreground mt-4">
                    {t("createSession.supportedFormats")}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* File Info */}
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 border border-border">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {config.uploadedFile.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(config.uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-sm text-primary font-medium">
                          {uploadProgress}%
                        </span>
                      </div>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-accent/20 text-xs font-bold text-foreground">
                        {t("createSession.processed")}
                      </span>
                    )}
                  </div>

                  {isProcessing && (
                    <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-3 mb-4">
                        <Brain className="w-6 h-6 text-primary animate-pulse" />
                        <span className="font-bold text-foreground">
                          {t("createSession.processing")}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300 rounded-full"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-3">
                        {t("createSession.processingDesc")}
                      </p>
                    </div>
                  )}

                  {!isProcessing && config.extractedKeywords && (
                    <>
                      {/* Extracted Keywords */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-5 h-5 text-accent" />
                          <span className="font-bold text-foreground">
                            {t("createSession.extractedKeywords")}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-accent/20 text-xs font-bold text-foreground">
                            {config.extractedKeywords.length}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {config.extractedKeywords.map((keyword) => (
                            <span
                              key={keyword}
                              className="px-3 py-1.5 rounded-full bg-secondary text-sm font-medium text-foreground border border-border"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {t("createSession.keywordsHelp")}
                        </p>
                      </div>

                      {/* Suggested Questions */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <MessageCircle className="w-5 h-5 text-primary" />
                          <span className="font-bold text-foreground">
                            {t("createSession.suggestedQuestions")}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-primary/20 text-xs font-bold text-foreground">
                            {config.suggestedQuestions?.length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {config.suggestedQuestions?.map((question, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground"
                            >
                              {question}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {t("createSession.questionsHelp")}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              <button
                onClick={() => setStep(3)}
                className="w-full py-3 bg-secondary hover:bg-secondary/80 text-foreground font-medium rounded-xl transition-colors text-sm"
              >
                {t("createSession.skipStep")}
              </button>
            </div>
          )}

          {/* Step 3: Configuration */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  {t("createSession.voiceLanguage")}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { code: "vi-VN", label: t("createSession.vietnamese") },
                    { code: "en-US", label: t("createSession.english") },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          voiceLanguage: lang.code,
                        }))
                      }
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        config.voiceLanguage === lang.code
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <span className="font-medium text-foreground">
                        {lang.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  {t("createSession.moderationLevel")}
                </label>
                <div className="space-y-3">
                  {[
                    {
                      level: "strict" as const,
                      label: t("createSession.strict"),
                      desc: t("createSession.strictDesc"),
                    },
                    {
                      level: "moderate" as const,
                      label: t("createSession.moderate"),
                      desc: t("createSession.moderateDesc"),
                    },
                    {
                      level: "relaxed" as const,
                      label: t("createSession.relaxed"),
                      desc: t("createSession.relaxedDesc"),
                    },
                  ].map((item) => (
                    <button
                      key={item.level}
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          moderationLevel: item.level,
                        }))
                      }
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                        config.moderationLevel === item.level
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <div>
                        <span className="font-medium text-foreground">
                          {item.label}
                        </span>
                        <p className="text-sm text-muted-foreground">
                          {item.desc}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          config.moderationLevel === item.level
                            ? "border-primary bg-primary"
                            : "border-border"
                        }`}
                      >
                        {config.moderationLevel === item.level && (
                          <Check className="w-3 h-3 text-primary-foreground" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                <h4 className="font-bold text-foreground mb-3">
                  {t("createSession.summary")}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {t("createSession.sessionNameLabel")}
                    </span>
                    <span className="text-foreground font-medium">
                      {config.title ||
                        t("createSession.defaultSessionTitle", {
                          date: new Date().toLocaleDateString(locale),
                        })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {t("createSession.voiceAILabel")}
                    </span>
                    <span
                      className={`font-medium ${config.enableVoiceAI ? "text-accent" : "text-muted-foreground"}`}
                    >
                      {config.enableVoiceAI
                        ? t("createSession.on")
                        : t("createSession.off")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {t("createSession.endTimeLabel")}
                    </span>
                    <span className="text-foreground font-medium">
                      {config.endTime
                        ? new Date(config.endTime).toLocaleString(locale)
                        : t("createSession.noLimit")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {t("createSession.fileLabel")}
                    </span>
                    <span className="text-foreground font-medium">
                      {config.uploadedFile
                        ? config.uploadedFile.name
                        : t("createSession.noFile")}
                    </span>
                  </div>
                  {config.extractedKeywords && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {t("createSession.keywordsLabel")}
                      </span>
                      <span className="text-accent font-medium">
                        {config.extractedKeywords.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-secondary/30">
          <button
            onClick={() => step > 1 && setStep(step - 1)}
            disabled={step === 1}
            className="px-6 py-3 bg-secondary hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed text-foreground font-medium rounded-xl transition-colors"
          >
            {t("createSession.back")}
          </button>
          <div className="flex items-center gap-3">
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-primary/25"
              >
                {t("createSession.continue")}
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="px-6 py-3 bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground font-semibold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-primary/25"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t("createSession.creating")}
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    {t("createSession.startSession")}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
