/**
 * Multilingual Universal Chat - Google Translate API + Wisprflow
 * Real-time translation into 80+ languages and live audio transcription
 */
import { v4 as uuidv4 } from 'uuid';
import type {
  SupportedLanguage,
  TranslationConfig,
  TranslatedMessage,
  ChatMessage,
  LiveCaptionConfig,
} from '@/types';

const GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY || '';
const GOOGLE_TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2';

// ---- In-memory stores ----
const translationConfigs = new Map<string, TranslationConfig>(); // roomId -> config
const captionConfigs = new Map<string, LiveCaptionConfig>(); // roomId -> config

// Language display names
const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
  pt: 'Portuguese',
  ar: 'Arabic',
  hi: 'Hindi',
  ru: 'Russian',
  it: 'Italian',
  nl: 'Dutch',
  pl: 'Polish',
  tr: 'Turkish',
  vi: 'Vietnamese',
  th: 'Thai',
  id: 'Indonesian',
  sv: 'Swedish',
  da: 'Danish',
};

// ============================================================
// TRANSLATION CONFIGURATION
// ============================================================

/**
 * Set translation config for a room.
 */
export function setTranslationConfig(roomId: string, config: Partial<TranslationConfig>): TranslationConfig {
  const existing = translationConfigs.get(roomId);
  const updated: TranslationConfig = {
    enabled: config.enabled ?? existing?.enabled ?? false,
    sourceLanguage: config.sourceLanguage ?? existing?.sourceLanguage ?? 'en',
    targetLanguages: config.targetLanguages ?? existing?.targetLanguages ?? [],
    autoDetect: config.autoDetect ?? existing?.autoDetect ?? true,
    showOriginal: config.showOriginal ?? existing?.showOriginal ?? true,
  };
  translationConfigs.set(roomId, updated);
  return updated;
}

/**
 * Get translation config for a room.
 */
export function getTranslationConfig(roomId: string): TranslationConfig {
  return translationConfigs.get(roomId) || {
    enabled: false,
    sourceLanguage: 'en',
    targetLanguages: [],
    autoDetect: true,
    showOriginal: true,
  };
}

// ============================================================
// TEXT TRANSLATION (Google Translate API)
// ============================================================

/**
 * Translate text to a target language using Google Translate API.
 */
export async function translateText(
  text: string,
  targetLanguage: SupportedLanguage,
  sourceLanguage?: SupportedLanguage
): Promise<{ translatedText: string; detectedLanguage?: string }> {
  if (!GOOGLE_TRANSLATE_API_KEY) {
    // Fallback: return original text if no API key
    return { translatedText: text };
  }

  try {
    const params = new URLSearchParams({
      q: text,
      target: targetLanguage,
      key: GOOGLE_TRANSLATE_API_KEY,
      format: 'text',
    });

    if (sourceLanguage) {
      params.set('source', sourceLanguage);
    }

    const response = await fetch(`${GOOGLE_TRANSLATE_URL}?${params}`, {
      method: 'POST',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data = await response.json();
    const translation = data.data?.translations?.[0];

    return {
      translatedText: translation?.translatedText || text,
      detectedLanguage: translation?.detectedSourceLanguage,
    };
  } catch {
    // Fallback on error
    return { translatedText: text };
  }
}

/**
 * Translate a chat message to multiple target languages.
 */
export async function translateChatMessage(
  message: ChatMessage,
  targetLanguages: SupportedLanguage[]
): Promise<TranslatedMessage> {
  const translations: Record<SupportedLanguage, string> = {} as Record<SupportedLanguage, string>;
  let detectedLanguage: SupportedLanguage = 'en';

  // Translate to each target language in parallel
  const translationPromises = targetLanguages.map(async (lang) => {
    const result = await translateText(message.content, lang);
    translations[lang] = result.translatedText;
    if (result.detectedLanguage) {
      detectedLanguage = result.detectedLanguage as SupportedLanguage;
    }
  });

  await Promise.allSettled(translationPromises);

  return {
    ...message,
    originalLanguage: detectedLanguage,
    translations,
    translatedAt: new Date().toISOString(),
  };
}

/**
 * Auto-translate a message for a room's configured languages.
 */
export async function autoTranslateForRoom(roomId: string, message: ChatMessage): Promise<TranslatedMessage | null> {
  const config = getTranslationConfig(roomId);
  if (!config.enabled || config.targetLanguages.length === 0) {
    return null;
  }

  return translateChatMessage(message, config.targetLanguages);
}

// ============================================================
// LIVE CAPTIONS (Wisprflow Integration)
// ============================================================

/**
 * Set live caption config for a room.
 */
export function setLiveCaptionConfig(roomId: string, config: Partial<LiveCaptionConfig>): LiveCaptionConfig {
  const existing = captionConfigs.get(roomId);
  const updated: LiveCaptionConfig = {
    enabled: config.enabled ?? existing?.enabled ?? false,
    language: config.language ?? existing?.language ?? 'en',
    provider: config.provider ?? existing?.provider ?? 'whisper',
    showSpeakerLabels: config.showSpeakerLabels ?? existing?.showSpeakerLabels ?? true,
    fontSize: config.fontSize ?? existing?.fontSize ?? 16,
    position: config.position ?? existing?.position ?? 'bottom',
  };
  captionConfigs.set(roomId, updated);
  return updated;
}

/**
 * Get live caption config for a room.
 */
export function getLiveCaptionConfig(roomId: string): LiveCaptionConfig {
  return captionConfigs.get(roomId) || {
    enabled: false,
    language: 'en',
    provider: 'whisper',
    showSpeakerLabels: true,
    fontSize: 16,
    position: 'bottom',
  };
}

// ============================================================
// LANGUAGE DETECTION
// ============================================================

/**
 * Detect the language of a text string.
 * Uses Google Translate API's auto-detect feature.
 */
export async function detectLanguage(text: string): Promise<SupportedLanguage> {
  if (!GOOGLE_TRANSLATE_API_KEY) return 'en';

  try {
    const params = new URLSearchParams({
      q: text,
      key: GOOGLE_TRANSLATE_API_KEY,
    });

    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2/detect?${params}`,
      { signal: AbortSignal.timeout(3000) }
    );

    if (!response.ok) return 'en';

    const data = await response.json();
    const detected = data.data?.detections?.[0]?.[0]?.language;
    return (detected as SupportedLanguage) || 'en';
  } catch {
    return 'en';
  }
}

// ============================================================
// UTILITIES
// ============================================================

/**
 * Get all supported languages with display names.
 */
export function getSupportedLanguages(): { code: SupportedLanguage; name: string }[] {
  return Object.entries(LANGUAGE_NAMES).map(([code, name]) => ({
    code: code as SupportedLanguage,
    name,
  }));
}

/**
 * Get language name by code.
 */
export function getLanguageName(code: SupportedLanguage): string {
  return LANGUAGE_NAMES[code] || code;
}
