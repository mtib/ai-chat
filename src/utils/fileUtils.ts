// In a real app, you would use a backend server for file operations
// This is a simplified implementation for local storage
import { v4 as uuidv4 } from 'uuid';
import { Conversation, Message } from '../types';

// For now, we'll use localStorage as a substitute for real file operations
const STORAGE_KEY = 'story_crafter_conversations';

export const loadConversations = async (): Promise<Conversation[]> => {
    try {
        const conversationsJson = localStorage.getItem(STORAGE_KEY);
        if (!conversationsJson) {
            return [];
        }
        return JSON.parse(conversationsJson);
    } catch (error) {
        console.error('Error loading conversations:', error);
        return [];
    }
};

export const saveConversationToFile = async (conversation: Conversation): Promise<boolean> => {
    try {
        // Get all existing conversations
        const conversations = await loadConversations();

        // Find if this conversation already exists
        const index = conversations.findIndex(c => c.id === conversation.id);

        if (index !== -1) {
            // Update existing conversation
            conversations[index] = conversation;
        } else {
            // Add new conversation
            conversations.push(conversation);
        }

        // Save all conversations back to storage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));

        return true;
    } catch (error) {
        console.error('Error saving conversation to file:', error);
        throw error;
    }
};

export const deleteConversation = async (conversationId: string): Promise<Conversation[]> => {
    try {
        const conversations = await loadConversations();
        const updatedConversations = conversations.filter(c => c.id !== conversationId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConversations));
        return updatedConversations;
    } catch (error) {
        console.error('Error deleting conversation:', error);
        throw error;
    }
};

export const createNewConversation = async (title: string = 'New Story'): Promise<Conversation> => {
    const newConversation: Conversation = {
        id: uuidv4(),
        title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
            {
                role: 'system',
                content: 'Welcome to your new story! How would you like to begin?'
            }
        ]
    };

    await saveConversationToFile(newConversation);
    return newConversation;
};

export const updateConversationTitle = async (conversationId: string, newTitle: string): Promise<Conversation> => {
    const conversations = await loadConversations();
    const conversation = conversations.find(c => c.id === conversationId);

    if (!conversation) {
        throw new Error('Conversation not found');
    }

    conversation.title = newTitle;
    conversation.updatedAt = new Date().toISOString();

    await saveConversationToFile(conversation);
    return conversation;
};
