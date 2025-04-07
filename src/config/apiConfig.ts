/**
 * API configuration settings
 */

// OpenAI Configuration
export const ENV_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

export const OPENAI_CONFIG = {
    BASE_URL: 'https://api.openai.com/v1',
    ENDPOINTS: {
        CHAT_COMPLETION: '/chat/completions',
        IMAGE_GENERATION: '/images/generations',
    },
    DEFAULT_MODEL: 'gpt-4o-mini-2024-07-18',
    TEMPERATURE: 0.7,
    STORAGE_KEY: 'openai_api_key',
    STORAGE_ORG_KEY: 'openai_org_id',
    DEFAULT_MAX_TOKENS: 1000,
    // DALL-E 3 settings
    DALLE_MODEL: 'dall-e-3',
    DALLE_SIZE: '1024x1024',
    DALLE_QUALITY: 'standard',
};

// Default system prompt - changing to generic assistant from story-specific
export const SYSTEM_PROMPT = "I am a helpful AI assistant. I'll answer questions, provide information, and assist with various tasks.";
