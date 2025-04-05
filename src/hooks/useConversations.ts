import { useState, useEffect, useCallback } from 'react';
import { Conversation } from '../types';
import { loadConversations, saveConversationToFile, deleteConversation as deleteConversationFile, updateConversationTitle as updateConversationTitleFile } from '../utils/fileUtils';
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
        // Ensure we save the updated conversation to storage
        saveConversationToFile(updatedConversation).catch(err => {
            console.error('Failed to save updated conversation:', err);
        });

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
            // Delete from storage first
            const updatedConversations = await deleteConversationFile(conversationId);

            // Update the conversations state
            setConversations(updatedConversations);

            // Handle active conversation change if it was deleted
            if (activeConversation && activeConversation.id === conversationId) {
                const newActiveConversation = updatedConversations.length > 0 ? updatedConversations[0] : null;
                setActiveConversation(newActiveConversation);
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
            // Update the title in storage first
            const updatedConversation = await updateConversationTitleFile(conversationId, newTitle);

            if (!updatedConversation) {
                throw new Error("Failed to update conversation title");
            }

            // Update local state
            setConversations(prev =>
                prev.map(c => c.id === conversationId ? updatedConversation : c)
            );

            // Update active conversation if needed
            if (activeConversation?.id === conversationId) {
                setActiveConversation(updatedConversation);
            }

            return updatedConversation;
        } catch (error) {
            console.error('Failed to update conversation title:', error);
            return null;
        }
    }, [activeConversation]);

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
