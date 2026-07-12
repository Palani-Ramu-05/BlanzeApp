import envConfig from '@/core/config/envConfig';

export const AI_CONFIG = {
  apiBaseUrl: `${envConfig.API_BASE_URL}/ai-workspace`,
  endpoints: {
    chat: '/chat',
    stream: '/chat/stream',
    writing: '/studio/writing',
    voice: '/studio/voice',
    document: '/studio/document',
    image: '/studio/image',
    coding: '/studio/coding',
    translation: '/studio/translation',
    research: '/studio/research',
    speechToText: '/speech-to-text',
    textToSpeech: '/text-to-speech',
    voiceHistory: '/voice-history',
    voiceHistorySearch: '/voice-history/search',
    imageProcess: '/studio/image/process',
    ocr: '/ocr',
    detectLanguage: '/detect-language',
    upload: '/upload',
  },
}
