import axios from 'axios';
import { saveConversationToFile } from './fileUtils';
import { Conversation, Message } from '../types';
import { ENV_API_KEY, OPENAI_CONFIG, SYSTEM_PROMPT } from '../config/apiConfig';
import { findRelevantMessages } from './contextUtils';

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
 * Interface for DALL-E image generation response
 */
export interface ImageResponse {
    imageUrl: string;
    revisedPrompt?: string;
}

/**
 * Generates an image using DALL-E 3
 */
export const generateImageWithDALLE = async (prompt: string): Promise<ImageResponse> => {
    const apiKey = getApiKey();

    if (!apiKey) {
        throw new Error('API key not set. Please set your OpenAI API key.');
    }

    try {
        const response = await axios.post(
            `${OPENAI_CONFIG.BASE_URL}${OPENAI_CONFIG.ENDPOINTS.IMAGE_GENERATION}`,
            {
                model: OPENAI_CONFIG.DALLE_MODEL,
                prompt: prompt,
                n: 1,
                size: OPENAI_CONFIG.DALLE_SIZE,
                quality: OPENAI_CONFIG.DALLE_QUALITY,
                response_format: "url"
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                }
            }
        );

        return {
            imageUrl: response.data.data[0].url,
            revisedPrompt: response.data.data[0].revised_prompt
        };
    } catch (error) {
        console.error('Error generating image with DALL-E:', error);
        const axiosError = error as any;
        throw new Error(axiosError.response?.data?.error?.message || 'Failed to generate image with DALL-E');
    }
};

/**
 * Sends a message to OpenAI API and returns the response
 * Uses context selection to manage token usage
 */
export const sendMessageToOpenAI = async (conversation: Conversation): Promise<string> => {
    const apiKey = getApiKey();

    if (!apiKey) {
        throw new Error('API key not set. Please set your OpenAI API key.');
    }

    try {
        // Get the latest user message to use for context selection
        const lastMessage = conversation.messages[conversation.messages.length - 1];

        // If the conversation already has a system message, use the existing messages
        const hasSystemMessage = conversation.messages.some(msg => msg.role === 'system');

        let messagesToSend: Message[];

        // Only apply context selection if the last message is from the user
        if (lastMessage && lastMessage.role === 'user') {
            // Use our context selection algorithm to get the most relevant messages
            messagesToSend = findRelevantMessages(conversation, lastMessage.content);

            // If there's no system message yet, add the default one at the beginning
            if (!hasSystemMessage) {
                messagesToSend = [
                    { role: 'system', content: SYSTEM_PROMPT },
                    ...messagesToSend
                ];
            }
        } else {
            // If the last message isn't from a user, use the whole conversation or add default system prompt
            messagesToSend = hasSystemMessage
                ? [...conversation.messages]
                : [{ role: 'system', content: SYSTEM_PROMPT }, ...conversation.messages];
        }

        const response = await axios.post(
            `${OPENAI_CONFIG.BASE_URL}${OPENAI_CONFIG.ENDPOINTS.CHAT_COMPLETION}`,
            {
                model: OPENAI_CONFIG.DEFAULT_MODEL,
                messages: messagesToSend,
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
