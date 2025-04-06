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

    // Sort conversations by lastModified timestamp (most recent first)
    const sortConversationsByModified = (convs: Conversation[]): Conversation[] => {
        return [...convs].sort((a, b) => {
            const timeA = a.lastModified || a.updatedAt;
            const timeB = b.lastModified || b.updatedAt;
            return new Date(timeB).getTime() - new Date(timeA).getTime();
        });
    };

    // Load initial conversations
    useEffect(() => {
        const loadInitialConversations = async () => {
            setIsLoading(true);
            try {
                const loadedConversations = await loadConversations();
                // Sort conversations by lastModified timestamp
                const sortedConversations = sortConversationsByModified(loadedConversations);
                setConversations(sortedConversations);

                // Try to restore previously active conversation from localStorage
                const savedActiveId = localStorage.getItem(ACTIVE_CONVERSATION_KEY);
                if (savedActiveId && sortedConversations.length > 0) {
                    const savedConversation = sortedConversations.find(c => c.id === savedActiveId);
                    if (savedConversation) {
                        setActiveConversation(savedConversation);
                    } else {
                        // Fallback to first conversation if saved one not found
                        setActiveConversation(sortedConversations[0]);
                    }
                } else if (sortedConversations.length > 0) {
                    // Default to first conversation
                    setActiveConversation(sortedConversations[0]);
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
            const now = new Date().toISOString();

            // Either use the provided conversation or create a default one
            if (!newConversation) {
                newConversation = {
                    id: Date.now().toString(),
                    title: `New Conversation ${conversations.length + 1}`,
                    createdAt: now,
                    updatedAt: now,
                    lastModified: now,
                    messages: []
                };
            } else if (!newConversation.lastModified) {
                // Add lastModified if not present
                newConversation = {
                    ...newConversation,
                    lastModified: now
                };
            }

            // Save the conversation to storage
            await saveConversationToFile(newConversation);

            // Resort conversations with the new one
            setConversations(prev => sortConversationsByModified([...prev, newConversation!]));
            handleSetActiveConversation(newConversation);
            return newConversation;
        } catch (error) {
            console.error('Failed to create conversation:', error);
            return null;
        }
    }, [conversations.length, handleSetActiveConversation]);

    // Update a conversation
    const handleUpdateConversation = useCallback((updatedConversation: Conversation) => {
        // Ensure we have lastModified timestamp
        const conversationWithTimestamp = {
            ...updatedConversation,
            lastModified: new Date().toISOString()
        };

        // Ensure we save the updated conversation to storage
        saveConversationToFile(conversationWithTimestamp).catch(err => {
            console.error('Failed to save updated conversation:', err);
        });

        setConversations(prev => {
            const newList = prev.map(c =>
                c.id === conversationWithTimestamp.id ? conversationWithTimestamp : c
            );
            return sortConversationsByModified(newList);
        });

        if (activeConversation?.id === conversationWithTimestamp.id) {
            handleSetActiveConversation(conversationWithTimestamp);
        }
    }, [activeConversation, handleSetActiveConversation]);

    // Delete a conversation
    const handleDeleteConversation = useCallback(async (conversationId: string): Promise<Conversation[]> => {
        try {
            // Delete from storage first
            const updatedConversations = await deleteConversationFile(conversationId);

            // Sort the resulting conversations
            const sortedConversations = sortConversationsByModified(updatedConversations);

            // Update the conversations state
            setConversations(sortedConversations);

            // Handle active conversation change if it was deleted
            if (activeConversation && activeConversation.id === conversationId) {
                const newActiveConversation = sortedConversations.length > 0 ? sortedConversations[0] : null;
                handleSetActiveConversation(newActiveConversation);
            }

            return sortedConversations;
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

            // Update local state and resort
            setConversations(prev => {
                const newList = prev.map(c => c.id === conversationId ? updatedConversation : c);
                return sortConversationsByModified(newList);
            });

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
