// filepath: /Users/mtib/Code/dnd-writer/src/utils/assistantServerUtils.ts
import axios from 'axios';
import { ServerAssistantConfig } from '../types';

/**
 * Fetches the configuration from the assistant server
 */
export const fetchAssistantConfig = async (
    baseUrl: string,
    token: string
): Promise<{
    prompt: string;
    description: string;
    short_description: string;
    embedding: string;
    size: number;
}> => {
    try {
        const response = await axios.get(`${baseUrl}/config`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching assistant config:', error);
        const axiosError = error as any;
        throw new Error(axiosError.response?.data?.error?.message || 'Failed to fetch assistant configuration');
    }
};

/**
 * Gets relevant context from the assistant server based on the query
 */
export const getAssistantContext = async (
    serverConfig: ServerAssistantConfig,
    queryEmbedding: number[]
): Promise<string[]> => {
    try {
        const response = await axios.post(
            `${serverConfig.baseUrl}/search`,
            { embedding: queryEmbedding },
            {
                headers: {
                    'Authorization': `Bearer ${serverConfig.token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.payload;
    } catch (error) {
        console.error('Error getting assistant context:', error);
        const axiosError = error as any;
        throw new Error(axiosError.response?.data?.error?.message || 'Failed to get context from assistant server');
    }
};

/**
 * Generates an embedding for the given text using OpenAI's API
 */
export const generateEmbedding = async (
    text: string,
    apiKey: string,
    model: string = 'text-embedding-3-small'
): Promise<number[]> => {
    try {
        const response = await axios.post(
            'https://api.openai.com/v1/embeddings',
            {
                model: model,
                input: text,
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.data[0].embedding;
    } catch (error) {
        console.error('Error generating embedding:', error);
        const axiosError = error as any;
        throw new Error(axiosError.response?.data?.error?.message || 'Failed to generate text embedding');
    }
};

/**
 * Test connection to the assistant server
 */
export const testAssistantConnection = async (
    baseUrl: string,
    token: string
): Promise<boolean> => {
    try {
        await fetchAssistantConfig(baseUrl, token);
        return true;
    } catch (error) {
        console.error('Error testing assistant connection:', error);
        return false;
    }
};
