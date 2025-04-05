export interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface Conversation {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    messages: Message[];
}
