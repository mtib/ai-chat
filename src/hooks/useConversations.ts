import { useState, useEffect, useCallback } from 'react';
import { Conversation } from '../types';
import { loadConversations, saveConversationToFile, deleteConversation as deleteConversationFile } from '../utils/fileUtils';
import { filterConversations } from '../utils/searchUtils';

/**
 * Hook to manage conversations including loading, creating, updating, deleting
 * and filtering conversations based on search
 */
export const useConversations = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Load initial conversations
    useEffect(() => {
        const loadInitialConversations = async () => {
            setIsLoading(true);
            try {
                const loadedConversations = await loadConversations();
                setConversations(loadedConversations);
                if (loadedConversations.length > 0) {
                    setActiveConversation(loadedConversations[0]);
                }
            } catch (error) {
                console.error('Failed to load conversations:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialConversations();
    }, []);

    // Create a new conversation - Modified to accept a conversation parameter
    const handleCreateConversation = useCallback(async (newConversation?: Conversation) => {
        try {
            // Either use the provided conversation or create a default one
            if (!newConversation) {
                newConversation = {
                    id: Date.now().toString(),
                    title: `New Conversation ${conversations.length + 1}`,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    messages: []
                };
            }

            // Save the conversation to storage
            await saveConversationToFile(newConversation);

            setConversations(prev => [...prev, newConversation!]);
            setActiveConversation(newConversation);
            return newConversation;
        } catch (error) {
            console.error('Failed to create conversation:', error);
            return null;
        }
    }, [conversations.length]);

    // Update a conversation
    const handleUpdateConversation = useCallback((updatedConversation: Conversation) => {
        setConversations(prev =>
            prev.map(c => c.id === updatedConversation.id ? updatedConversation : c)
        );

        if (activeConversation?.id === updatedConversation.id) {
            setActiveConversation(updatedConversation);
        }
    }, [activeConversation]);

    // Delete a conversation
    const handleDeleteConversation = useCallback(async (conversationId: string): Promise<Conversation[]> => {
        try {
            const updatedConversations = await deleteConversationFile(conversationId);
            setConversations(updatedConversations);

            // If active conversation was deleted, select the first available or null
            if (activeConversation && activeConversation.id === conversationId) {
                setActiveConversation(updatedConversations.length > 0 ? updatedConversations[0] : null);
            }

            return updatedConversations;
        } catch (error) {
            console.error('Failed to delete conversation:', error);
            return conversations;
        }
    }, [activeConversation, conversations]);

    // Update conversation title
    const handleUpdateTitle = useCallback(async (conversationId: string, newTitle: string) => {
        try {
            const conversation = conversations.find(c => c.id === conversationId);
            if (!conversation) {
                throw new Error('Conversation not found');
            }

            const updatedConversation = {
                ...conversation,
                title: newTitle,
                updatedAt: new Date().toISOString()
            };

            await saveConversationToFile(updatedConversation);
            handleUpdateConversation(updatedConversation);
            return updatedConversation;
        } catch (error) {
            console.error('Failed to update conversation title:', error);
            return null;
        }
    }, [conversations, handleUpdateConversation]);

    // Filter conversations based on search query
    const filteredConversations = filterConversations(conversations, searchQuery);

    return {
        conversations,
        activeConversation,
        filteredConversations,
        searchQuery,
        isLoading,
        setActiveConversation,
        setSearchQuery,
        createConversation: handleCreateConversation,
        updateConversation: handleUpdateConversation,
        deleteConversation: handleDeleteConversation,
        updateConversationTitle: handleUpdateTitle
    };
};
