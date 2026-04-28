/**
 * Question Classification Utility
 * Classifies questions as greeting, professional, or unknown
 * Phase 1: Foundation with keyword-based detection
 * Future: Will be replaced with ML model
 */

export type QuestionType = 'greeting' | 'professional' | 'unknown';

interface ClassificationConfig {
  enableClassification: boolean;
  greetingKeywords?: string[];
  professionalKeywords?: string[];
}

// Default greeting keywords (English and Vietnamese)
const DEFAULT_GREETING_KEYWORDS = [
  'hi',
  'hello',
  'hey',
  'bye',
  'goodbye',
  'thanks',
  'thank you',
  'bạn đẹp trai',
  'xin chào',
  'chào bạn',
  'tạm biệt',
  'cảm ơn',
  'thanks you',
  'howdy',
  'greetings',
  'good morning',
  'good afternoon',
  'good evening',
  'welcome',
  'see you',
];

// Default professional/question keywords
const DEFAULT_PROFESSIONAL_KEYWORDS = [
  'what',
  'how',
  'why',
  'when',
  'where',
  'which',
  'can',
  'could',
  'would',
  'will',
  'shall',
  'do you',
  'does',
  'is it',
  'are there',
  'have you',
  'question',
  'clarify',
  'explain',
  'understand',
  'know',
  'think',
  'opinion',
  'suggest',
  'recommend',
  'experience',
  'example',
  'detail',
  'procedure',
  'process',
  'method',
  'strategy',
  'solution',
  'approach',
  'help',
  'assistance',
  'cách',
  'làm sao',
  'tại sao',
  'khi nào',
  'ở đâu',
  'cái nào',
  'có thể',
  'nên',
  'bạn',
  'giải thích',
  'hiểu',
  'biết',
  'ý kiến',
  'gợi ý',
  'kinh nghiệm',
  'ví dụ',
  'chi tiết',
  'quy trình',
  'phương pháp',
  'chiến lược',
];

/**
 * Classify a question as greeting, professional, or unknown
 * @param questionText - The question text to classify
 * @param config - Classification configuration
 * @returns The classified type
 */
export function classifyQuestion(
  questionText: string,
  config: ClassificationConfig = { enableClassification: true }
): QuestionType {
  if (!config.enableClassification) {
    return 'unknown';
  }

  const lowerText = questionText.toLowerCase().trim();

  // Get keywords from config or use defaults
  const greetingKeywords = config.greetingKeywords || DEFAULT_GREETING_KEYWORDS;
  const professionalKeywords =
    config.professionalKeywords || DEFAULT_PROFESSIONAL_KEYWORDS;

  // Check for greeting keywords
  for (const keyword of greetingKeywords) {
    if (lowerText.includes(keyword)) {
      // Check if it's a standalone greeting (not part of a longer question)
      const words = lowerText.split(/\s+/);
      if (words.length <= 3) {
        // Short message, likely a greeting
        return 'greeting';
      }
    }
  }

  // Check for professional/question keywords
  for (const keyword of professionalKeywords) {
    if (lowerText.includes(keyword)) {
      return 'professional';
    }
  }

  return 'unknown';
}

/**
 * Get classification statistics from a list of questions
 * @param questions - Array of questions with question_type field
 * @returns Classification statistics
 */
export function getClassificationStats(
  questions: Array<{ question_type?: QuestionType }>
) {
  const stats = {
    greeting: 0,
    professional: 0,
    unknown: 0,
    total: questions.length,
  };

  for (const question of questions) {
    const type = question.question_type || 'unknown';
    stats[type]++;
  }

  return stats;
}

/**
 * Get display label for question type
 * @param type - The question type
 * @returns Localized label (key for translation)
 */
export function getClassificationLabel(type: QuestionType): string {
  const labels: Record<QuestionType, string> = {
    greeting: 'classification.greeting',
    professional: 'classification.professional',
    unknown: 'classification.unknown',
  };
  return labels[type];
}

/**
 * Get color/styling hint for question type
 * @param type - The question type
 * @returns Tailwind color classes
 */
export function getClassificationStyles(type: QuestionType): {
  bg: string;
  border: string;
  text: string;
  icon: string;
} {
  const styles = {
    greeting: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      icon: 'text-blue-600',
    },
    professional: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      icon: 'text-purple-600',
    },
    unknown: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-700',
      icon: 'text-gray-600',
    },
  };
  return styles[type];
}
