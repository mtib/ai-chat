import axios from 'axios';
import { saveConversationToFile } from './fileUtils';
import { Conversation, Message, ServerAssistantConfig } from '../types';
import { ENV_API_KEY, OPENAI_CONFIG, SYSTEM_PROMPT } from '../config/apiConfig';
import { findRelevantMessages } from './contextUtils';
import { generateEmbedding, getAssistantContext, storeAssistantContent } from './assistantServerUtils';
import { getJsonServerUrl, getJsonServerToken, getJsonServerProfile } from '../components/StorageServerModal';

// This should be stored securely and not in client-side code in production
// Consider using environment variables or a backend service
let OPENAI_API_KEY = ENV_API_KEY;
let OPENAI_ORG_ID = '';

// Cache for conversation list to avoid unnecessary fetches
let conversationListCache: string[] | null = null;

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
 * Proxies an image URL through the JSON server if configured
 */
export const proxyImageUrl = (imageUrl: string): string => {
    const serverUrl = getJsonServerUrl();
    const serverToken = getJsonServerToken();

    // If no server is configured, return the original URL
    if (!serverUrl || !serverToken) {
        return imageUrl;
    }

    try {
        // Create the proxy request configuration
        const proxyConfig = {
            url: imageUrl,
            method: "GET"
        };

        // Base64 encode the proxy configuration
        const encodedConfig = btoa(JSON.stringify(proxyConfig));

        // Base64 encode the auth token for URL parameter
        const encodedAuthToken = btoa(serverToken);

        // Return the proxied URL with auth parameter
        return `${serverUrl}/proxy/${encodedConfig}?auth=${encodedAuthToken}`;
    } catch (error) {
        console.error('Error creating proxy URL:', error);
        // Fall back to the original URL if something goes wrong
        return imageUrl;
    }
};

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

        const originalImageUrl = response.data.data[0].url;

        // Proxy the image URL if a JSON server is configured
        const imageUrl = proxyImageUrl(originalImageUrl);

        return {
            imageUrl,
            revisedPrompt: response.data.data[0].revised_prompt
        };
    } catch (error) {
        console.error('Error generating image with DALL-E:', error);
        const axiosError = error as any;
        throw new Error(axiosError.response?.data?.error?.message || 'Failed to generate image with DALL-E');
    }
};

/**
 * Removes Markdown image links from a string
 * Matches patterns like ![alt text](image-url) or just ![](image-url)
 */
export const removeMarkdownImageLinks = (text: string): string => {
    // Regex to match Markdown image links: ![alt text](url) or ![](url)
    return text.replace(/!\[.*?\]\(.*?\)/g, '');
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

        // Remove Markdown image links from all user messages
        messagesToSend = messagesToSend.map(msg => {
            return {
                ...msg,
                content: removeMarkdownImageLinks(msg.content)
            };
        });

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
 * Fetch the list of conversations from the JSON server
 */
export const fetchConversationList = async (): Promise<string[]> => {
    const serverUrl = getJsonServerUrl();
    const serverToken = getJsonServerToken();
    const profileId = getJsonServerProfile();

    // If no server is configured, return an empty array
    if (!serverUrl || !serverToken) {
        return [];
    }

    try {
        const response = await axios.get(
            `${serverUrl}/data/${profileId}/conversations`,
            {
                headers: {
                    'Authorization': `Bearer ${serverToken}`
                }
            }
        );

        // If we got a successful response and it's parseable JSON, update the cache
        if (response.data) {
            try {
                const conversationList = response.data;
                conversationListCache = conversationList;
                return conversationList;
            } catch (error) {
                console.error('Error parsing conversation list:', error);
                return [];
            }
        }

        return [];
    } catch (error) {
        console.error('Error fetching conversation list:', error);
        // If we get a 404, it means no conversation list exists yet
        const axiosError = error as any;
        if (axiosError.response?.status === 404) {
            return [];
        }
        throw error;
    }
};

/**
 * Save the list of conversations to the JSON server
 */
export const saveConversationList = async (conversationIds: string[]): Promise<boolean> => {
    const serverUrl = getJsonServerUrl();
    const serverToken = getJsonServerToken();
    const profileId = getJsonServerProfile();

    // If no server is configured, return false
    if (!serverUrl || !serverToken) {
        return false;
    }

    try {
        // Convert the conversation list to JSON
        const conversationListJson = JSON.stringify(conversationIds);

        // Send the conversation list to the server
        await axios.put(
            `${serverUrl}/data/${profileId}/conversations`,
            conversationListJson,
            {
                headers: {
                    'Authorization': `Bearer ${serverToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Update the cache
        conversationListCache = conversationIds;

        return true;
    } catch (error) {
        console.error('Error saving conversation list:', error);
        return false;
    }
};

/**
 * Fetch a conversation from the JSON server
 */
export const fetchConversationFromServer = async (conversationId: string): Promise<Conversation | null> => {
    const serverUrl = getJsonServerUrl();
    const serverToken = getJsonServerToken();
    const profileId = getJsonServerProfile();

    // If no server is configured, return null
    if (!serverUrl || !serverToken) {
        return null;
    }

    try {
        const response = await axios.get(
            `${serverUrl}/data/${profileId}/conversation/${conversationId}`,
            {
                headers: {
                    'Authorization': `Bearer ${serverToken}`
                }
            }
        );

        // If we got a successful response and it's parseable JSON
        if (response.data) {
            try {
                const conversation = response.data;
                return conversation;
            } catch (error) {
                console.error(`Error parsing conversation ${conversationId}:`, error);
                return null;
            }
        }

        return null;
    } catch (error) {
        console.error(`Error fetching conversation ${conversationId}:`, error);
        // If we get a 404, it means the conversation doesn't exist
        const axiosError = error as any;
        if (axiosError.response?.status === 404) {
            return null;
        }
        throw error;
    }
};

/**
 * Save a conversation to the JSON server
 */
export const saveConversationToServer = async (conversation: Conversation): Promise<boolean> => {
    const serverUrl = getJsonServerUrl();
    const serverToken = getJsonServerToken();
    const profileId = getJsonServerProfile();

    // If no server is configured, return false
    if (!serverUrl || !serverToken) {
        return false;
    }

    try {
        // Convert the conversation to JSON
        const conversationJson = JSON.stringify(conversation);

        // Send the conversation to the server
        await axios.put(
            `${serverUrl}/data/${profileId}/conversation/${conversation.id}`,
            conversationJson,
            {
                headers: {
                    'Authorization': `Bearer ${serverToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return true;
    } catch (error) {
        console.error(`Error saving conversation ${conversation.id} to server:`, error);
        return false;
    }
};

/**
 * Delete a conversation from the JSON server
 */
export const deleteConversationFromServer = async (conversationId: string): Promise<boolean> => {
    const serverUrl = getJsonServerUrl();
    const serverToken = getJsonServerToken();
    const profileId = getJsonServerProfile();

    // If no server is configured, return false
    if (!serverUrl || !serverToken) {
        return false;
    }

    try {
        // Delete by putting an empty string to the key
        await axios.put(
            `${serverUrl}/data/${profileId}/conversation/${conversationId}`,
            "",
            {
                headers: {
                    'Authorization': `Bearer ${serverToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return true;
    } catch (error) {
        console.error(`Error deleting conversation ${conversationId} from server:`, error);
        return false;
    }
};

/**
 * Initialize the conversation system by fetching the conversation list from the server
 * This should be called when the application starts
 */
export const initializeConversationSystem = async (): Promise<void> => {
    try {
        // Fetch the conversation list from the server
        await fetchConversationList();
    } catch (error) {
        console.error('Error initializing conversation system:', error);
    }
};

/**
 * Saves a conversation to storage
 */
export const saveConversation = async (conversation: Conversation): Promise<boolean> => {
    try {
        // First save the conversation to local storage
        await saveConversationToFile(conversation);

        // If server is configured, save the conversation to the server
        const serverUrl = getJsonServerUrl();
        const serverToken = getJsonServerToken();

        if (serverUrl && serverToken) {
            // Save the full conversation to the server
            await saveConversationToServer(conversation);

            // Fetch the current list if we don't have it cached
            let conversationList = conversationListCache;
            if (!conversationList) {
                conversationList = await fetchConversationList();
            }

            // Add the conversation ID to the list if it's not already there
            if (!conversationList.includes(conversation.id)) {
                conversationList.push(conversation.id);

                // Save the updated list
                await saveConversationList(conversationList);
            }
        }

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
