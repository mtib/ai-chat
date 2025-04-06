import { useState, useEffect, useCallback } from 'react';
import { Conversation } from '../types';
import { loadConversations, saveConversationToFile, deleteConversation as deleteConversationFile, updateConversationTitle as updateConversationTitleFile } from '../utils/fileUtils';
import { filterConversations } from '../utils/searchUtils';

// Storage key for active conversation ID
const ACTIVE_CONVERSATION_KEY = 'active_conversation_id';

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

                // Try to restore previously active conversation from localStorage
                const savedActiveId = localStorage.getItem(ACTIVE_CONVERSATION_KEY);
                if (savedActiveId && loadedConversations.length > 0) {
                    const savedConversation = loadedConversations.find(c => c.id === savedActiveId);
                    if (savedConversation) {
                        setActiveConversation(savedConversation);
                    } else {
                        // Fallback to first conversation if saved one not found
                        setActiveConversation(loadedConversations[0]);
                    }
                } else if (loadedConversations.length > 0) {
                    // Default to first conversation
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

    // Custom setter for active conversation that also saves to localStorage
    const handleSetActiveConversation = useCallback((conversation: Conversation | null) => {
        setActiveConversation(conversation);
        if (conversation) {
            localStorage.setItem(ACTIVE_CONVERSATION_KEY, conversation.id);
        } else {
            localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
        }
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
            handleSetActiveConversation(newConversation);
            return newConversation;
        } catch (error) {
            console.error('Failed to create conversation:', error);
            return null;
        }
    }, [conversations.length, handleSetActiveConversation]);

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
            handleSetActiveConversation(updatedConversation);
        }
    }, [activeConversation, handleSetActiveConversation]);

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
                handleSetActiveConversation(newActiveConversation);
            }

            return updatedConversations;
        } catch (error) {
            console.error('Failed to delete conversation:', error);
            return conversations;
        }
    }, [activeConversation, conversations, handleSetActiveConversation]);

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
                handleSetActiveConversation(updatedConversation);
            }

            return updatedConversation;
        } catch (error) {
            console.error('Failed to update conversation title:', error);
            return null;
        }
    }, [activeConversation, handleSetActiveConversation]);

    // Filter conversations based on search query
    const filteredConversations = filterConversations(conversations, searchQuery);

    return {
        conversations,
        activeConversation,
        filteredConversations,
        searchQuery,
        isLoading,
        setActiveConversation: handleSetActiveConversation,
        setSearchQuery,
        createConversation: handleCreateConversation,
        updateConversation: handleUpdateConversation,
        deleteConversation: handleDeleteConversation,
        updateConversationTitle: handleUpdateTitle
    };
};
