export interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
    starred?: boolean;
}

export interface Conversation {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    lastModified?: string; // ISO timestamp of when the conversation was last modified (message added/edited)
    messages: Message[];
}
