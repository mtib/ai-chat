// In a real app, you would use a backend server for file operations
// This is a simplified implementation for local storage
import { v4 as uuidv4 } from 'uuid';
import { Conversation, Message } from '../types';

// For now, we'll use localStorage as a substitute for real file operations
const STORAGE_KEY = 'conversation_ai_data';

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

        // Make sure lastModified is set to current time
        const updatedConversation = {
            ...conversation,
            lastModified: new Date().toISOString()
        };

        // Find if this conversation already exists
        const index = conversations.findIndex(c => c.id === conversation.id);

        if (index !== -1) {
            // Update existing conversation
            conversations[index] = updatedConversation;
        } else {
            // Add new conversation
            conversations.push(updatedConversation);
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

        // Save the updated conversations back to storage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConversations));

        return updatedConversations;
    } catch (error) {
        console.error('Error deleting conversation:', error);
        throw error;
    }
};

// This function is only used as a fallback and should not add default system messages
export const createNewConversation = async (title: string = 'New Conversation'): Promise<Conversation> => {
    const now = new Date().toISOString();
    const newConversation: Conversation = {
        id: uuidv4(),
        title,
        createdAt: now,
        updatedAt: now,
        lastModified: now,
        messages: []
    };

    await saveConversationToFile(newConversation);
    return newConversation;
};

export const updateConversationTitle = async (conversationId: string, newTitle: string): Promise<Conversation> => {
    try {
        const conversations = await loadConversations();
        const conversationIndex = conversations.findIndex(c => c.id === conversationId);

        if (conversationIndex === -1) {
            throw new Error('Conversation not found');
        }

        const now = new Date().toISOString();
        const conversation = {
            ...conversations[conversationIndex],
            title: newTitle,
            updatedAt: now,
            lastModified: now
        };

        // Update the conversation in the array
        conversations[conversationIndex] = conversation;

        // Save all conversations back to storage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));

        return conversation;
    } catch (error) {
        console.error('Error updating conversation title:', error);
        throw error;
    }
};

// Add the missing export function for exporting conversations to file
export const exportConversationToFile = async (conversation: Conversation): Promise<void> => {
    try {
        const dataStr = JSON.stringify(conversation, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileName = `${conversation.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileName);
        linkElement.click();
    } catch (error) {
        console.error('Error exporting conversation:', error);
        throw new Error('Failed to export conversation');
    }
};
