import axios from 'axios';
import { saveConversationToFile } from './fileUtils';
import { Conversation, Message } from '../types';
import { ENV_API_KEY, OPENAI_CONFIG, SYSTEM_PROMPT } from '../config/apiConfig';

// This should be stored securely and not in client-side code in production
// Consider using environment variables or a backend service
let OPENAI_API_KEY = ENV_API_KEY;

/**
 * Sets the OpenAI API key and saves it to local storage
 */
export const setApiKey = (key: string): void => {
    OPENAI_API_KEY = key;
    localStorage.setItem(OPENAI_CONFIG.STORAGE_KEY, key);
};

/**
 * Gets the OpenAI API key from memory or local storage
 */
export const getApiKey = (): string => {
    if (!OPENAI_API_KEY) {
        OPENAI_API_KEY = localStorage.getItem(OPENAI_CONFIG.STORAGE_KEY) || ENV_API_KEY || '';
    }
    return OPENAI_API_KEY;
};

/**
 * Sends a message to OpenAI API and returns the response
 */
export const sendMessageToOpenAI = async (conversation: Conversation): Promise<string> => {
    const apiKey = getApiKey();

    if (!apiKey) {
        throw new Error('API key not set. Please set your OpenAI API key.');
    }

    try {
        // Format the messages for OpenAI API
        const messages: Message[] = conversation.messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // Add a system message to guide the AI
        const systemMessage: Message = {
            role: "system",
            content: SYSTEM_PROMPT
        };

        const response = await axios.post(
            `${OPENAI_CONFIG.BASE_URL}${OPENAI_CONFIG.ENDPOINTS.CHAT_COMPLETION}`,
            {
                model: OPENAI_CONFIG.DEFAULT_MODEL,
                messages: [systemMessage, ...messages],
                temperature: OPENAI_CONFIG.TEMPERATURE,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                }
            }
        );

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        const axiosError = error as any; // Type assertion for axios error
        throw new Error(axiosError.response?.data?.error?.message || 'Failed to communicate with OpenAI');
    }
};

/**
 * Saves a conversation to storage
 */
export const saveConversation = async (conversation: Conversation): Promise<boolean> => {
    try {
        await saveConversationToFile(conversation);
        return true;
    } catch (error) {
        console.error('Error saving conversation:', error);
        return false;
    }
};
