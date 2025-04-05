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
    messages: Message[];
}
