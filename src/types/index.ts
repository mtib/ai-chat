export interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
    starred?: boolean;
}

export interface ServerAssistantConfig {
    baseUrl: string;         // URL of the assistant server
    token: string;           // Authentication token for the server
    description?: string;    // Description of the assistant from server config
    shortDescription?: string; // Short description from server config
    embeddingModel?: string; // Embedding model used by the server
}

export interface Conversation {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    lastModified?: string; // ISO timestamp of when the conversation was last modified (message added/edited)
    messages: Message[];
    serverAssistant?: ServerAssistantConfig; // Optional server assistant configuration
}
