/**
 * API configuration settings
 */

// Check if there's an API key in environment variables
export const ENV_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

// OpenAI API related configuration
export const OPENAI_CONFIG = {
    BASE_URL: 'https://api.openai.com/v1',
    ENDPOINTS: {
        CHAT_COMPLETION: '/chat/completions'
    },
    DEFAULT_MODEL: 'gpt-4o-mini-2024-07-18',
    TEMPERATURE: 0.7,
    STORAGE_KEY: 'openai_api_key'
};

// System prompt to guide the AI in storytelling
export const SYSTEM_PROMPT =
    "You are a creative writing assistant specializing in storytelling. " +
    "Help the user create immersive worlds, compelling characters, interesting plot hooks, " +
    "and vivid scene descriptions. Respond in a creative and engaging manner. " +
    "Be descriptive and provide ideas that inspire imagination.";
