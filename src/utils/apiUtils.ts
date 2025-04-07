import axios from 'axios';
import { saveConversationToFile } from './fileUtils';
import { Conversation, Message, ServerAssistantConfig } from '../types';
import { ENV_API_KEY, OPENAI_CONFIG, SYSTEM_PROMPT } from '../config/apiConfig';
import { findRelevantMessages } from './contextUtils';
import { generateEmbedding, getAssistantContext, storeAssistantContent } from './assistantServerUtils';

// This should be stored securely and not in client-side code in production
// Consider using environment variables or a backend service
let OPENAI_API_KEY = ENV_API_KEY;
let OPENAI_ORG_ID = '';

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
 * Sets the OpenAI Organization ID and saves it to local storage
 */
export const setOrgId = (orgId: string): void => {
    OPENAI_ORG_ID = orgId;
    localStorage.setItem(OPENAI_CONFIG.STORAGE_ORG_KEY, orgId);
};

/**
 * Gets the OpenAI Organization ID from memory or local storage
 */
export const getOrgId = (): string => {
    if (!OPENAI_ORG_ID) {
        OPENAI_ORG_ID = localStorage.getItem(OPENAI_CONFIG.STORAGE_ORG_KEY) || '';
    }
    return OPENAI_ORG_ID;
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
    const orgId = getOrgId();

    if (!apiKey) {
        throw new Error('API key not set. Please set your OpenAI API key.');
    }

    try {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        };

        // Add Organization header if org ID is set
        if (orgId) {
            headers['OpenAI-Organization'] = orgId;
        }

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
            { headers }
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
 * Can incorporate assistant server context if provided
 */
export const sendMessageToOpenAI = async (conversation: Conversation): Promise<string> => {
    const apiKey = getApiKey();
    const orgId = getOrgId();

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

            // If this conversation has a server assistant, get context from the server
            if (conversation.serverAssistant) {
                try {
                    // Generate embedding for the user message
                    const embedding = await generateEmbedding(
                        lastMessage.content,
                        apiKey,
                        conversation.serverAssistant.embeddingModel || 'text-embedding-3-small'
                    );

                    // Get relevant context from the assistant server
                    const assistantContext = await getAssistantContext(conversation.serverAssistant, embedding);

                    // If we got context back, add it as a new temporary system message
                    if (assistantContext && assistantContext.length > 0) {
                        // Create a context message that will only be sent to the API
                        const contextStr = assistantContext.join('\n\n');
                        const contextMessage: Message = {
                            role: 'system',
                            content: `Relevant context for this query:\n${contextStr}\n\nUse this context to inform your response to the user's question.`
                        };

                        // Insert the context message just before the user's message
                        const userMsgIndex = messagesToSend.findIndex(msg =>
                            msg.role === 'user' && msg.content === lastMessage.content
                        );

                        if (userMsgIndex !== -1) {
                            // Insert before the user message
                            messagesToSend.splice(userMsgIndex, 0, contextMessage);
                        } else {
                            // If we can't find the exact user message, add it at the end
                            messagesToSend.push(contextMessage);
                        }
                    }
                } catch (error) {
                    console.error('Error incorporating assistant context:', error);
                    // Continue without the assistant context if there's an error
                }
            }
        } else {
            // If the last message isn't from a user, use the whole conversation or add default system prompt
            messagesToSend = hasSystemMessage
                ? [...conversation.messages]
                : [{ role: 'system', content: SYSTEM_PROMPT }, ...conversation.messages];
        }

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        };

        // Add Organization header if org ID is set
        if (orgId) {
            headers['OpenAI-Organization'] = orgId;
        }

        const response = await axios.post(
            `${OPENAI_CONFIG.BASE_URL}${OPENAI_CONFIG.ENDPOINTS.CHAT_COMPLETION}`,
            {
                model: OPENAI_CONFIG.DEFAULT_MODEL,
                messages: messagesToSend,
                temperature: OPENAI_CONFIG.TEMPERATURE,
            },
            { headers }
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

/**
 * Stores information in a server assistant's memory
 */
export const storeInAssistantMemory = async (
    serverAssistant: ServerAssistantConfig,
    text: string,
    apiKey: string
): Promise<boolean> => {
    try {
        // Generate embedding for the text
        const embedding = await generateEmbedding(
            text,
            apiKey,
            serverAssistant.embeddingModel || 'text-embedding-3-small'
        );

        // Store the embedding and text in the assistant's memory using the dedicated function
        return await storeAssistantContent(serverAssistant, text, embedding);
    } catch (error) {
        console.error('Error storing in assistant memory:', error);
        return false;
    }
};
