import { useState, useEffect, useCallback } from 'react';
import { Conversation } from '../types';
import { loadConversations, saveConversationToFile, deleteConversation as deleteConversationFile, updateConversationTitle as updateConversationTitleFile } from '../utils/fileUtils';
import { filterConversations } from '../utils/searchUtils';
import {
    fetchConversationList,
    saveConversationList,
    fetchConversationFromServer,
    saveConversationToServer,
    deleteConversationFromServer
} from '../utils/apiUtils';
import { getJsonServerUrl, getJsonServerToken } from '../components/StorageServerModal';

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
    const [serverConfigured, setServerConfigured] = useState(false);

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
                // Check if a server is configured
                const serverUrl = getJsonServerUrl();
                const serverToken = getJsonServerToken();
                const isServerConfigured = !!(serverUrl && serverToken);
                setServerConfigured(isServerConfigured);

                // Get conversation list from server if configured
                let serverConversationIds: string[] = [];
                if (isServerConfigured) {
                    try {
                        serverConversationIds = await fetchConversationList();
                    } catch (error) {
                        console.error('Failed to fetch conversation list from server:', error);
                    }
                }

                // Load conversations from local storage
                const loadedConversations = await loadConversations();

                // Create a map of conversations by ID for easier lookup
                const conversationsMap = new Map<string, Conversation>();
                loadedConversations.forEach(conv => {
                    conversationsMap.set(conv.id, conv);
                });

                // If server is configured, fetch any server conversations not in local storage
                if (isServerConfigured && serverConversationIds.length > 0) {
                    const fetchPromises: Promise<void>[] = [];

                    for (const id of serverConversationIds) {
                        // If we don't have this conversation locally, fetch it from the server
                        const fetchPromise = fetchConversationFromServer(id)
                            .then(serverConversation => {
                                if (serverConversation) {
                                    // Add the fetched conversation to our map
                                    conversationsMap.set(id, serverConversation);
                                    // Save it to local storage for future use
                                    saveConversationToFile(serverConversation).catch(err => {
                                        console.error(`Failed to save fetched conversation ${id} to local storage:`, err);
                                    });
                                }
                            })
                            .catch(error => {
                                console.error(`Failed to fetch conversation ${id} from server:`, error);
                            });

                        fetchPromises.push(fetchPromise);
                    }

                    // Wait for all fetches to complete
                    await Promise.all(fetchPromises);

                    // Also check for conversations that exist locally but not on the server
                    // and push them to the server
                    const syncPromises: Promise<void>[] = [];

                    for (const [id, conversation] of conversationsMap.entries()) {
                        if (!serverConversationIds.includes(id)) {
                            const syncPromise = saveConversationToServer(conversation)
                                .then(success => {
                                    if (success) {
                                        // Add this ID to the server list
                                        serverConversationIds.push(id);
                                    }
                                })
                                .catch(error => {
                                    console.error(`Failed to sync conversation ${id} to server:`, error);
                                });

                            syncPromises.push(syncPromise);
                        }
                    }

                    // Wait for all syncs to complete
                    await Promise.all(syncPromises);

                    // Update the server conversation list if we added new IDs
                    const originalLength = serverConversationIds.length;
                    if (syncPromises.length > 0) {
                        await saveConversationList(serverConversationIds);
                    }
                }

                // Convert the map back to an array and sort
                const allConversations = Array.from(conversationsMap.values());
                const sortedConversations = sortConversationsByModified(allConversations);

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

            // Save the conversation to local storage
            await saveConversationToFile(newConversation);

            // Update server if configured
            if (serverConfigured) {
                // Save the full conversation to the server
                await saveConversationToServer(newConversation);

                // Update the conversation list
                const currentConversations = conversations.map(c => c.id);
                // Add the new conversation ID if it's not already there
                if (!currentConversations.includes(newConversation.id)) {
                    const updatedList = [...currentConversations, newConversation.id];
                    // Save the updated list to the server
                    await saveConversationList(updatedList);
                }
            }

            // Resort conversations with the new one
            setConversations(prev => sortConversationsByModified([...prev, newConversation!]));
            handleSetActiveConversation(newConversation);
            return newConversation;
        } catch (error) {
            console.error('Failed to create conversation:', error);
            return null;
        }
    }, [conversations, handleSetActiveConversation, serverConfigured]);

    // Update a conversation
    const handleUpdateConversation = useCallback((updatedConversation: Conversation) => {
        // Ensure we have lastModified timestamp
        const conversationWithTimestamp = {
            ...updatedConversation,
            lastModified: new Date().toISOString()
        };

        // Ensure we save the updated conversation to storage
        saveConversationToFile(conversationWithTimestamp).catch(err => {
            console.error('Failed to save updated conversation to local storage:', err);
        });

        // If server is configured, save the conversation to the server
        if (serverConfigured) {
            saveConversationToServer(conversationWithTimestamp).catch(err => {
                console.error('Failed to save updated conversation to server:', err);
            });
        }

        setConversations(prev => {
            const newList = prev.map(c =>
                c.id === conversationWithTimestamp.id ? conversationWithTimestamp : c
            );
            return sortConversationsByModified(newList);
        });

        if (activeConversation?.id === conversationWithTimestamp.id) {
            handleSetActiveConversation(conversationWithTimestamp);
        }
    }, [activeConversation, handleSetActiveConversation, serverConfigured]);

    // Delete a conversation
    const handleDeleteConversation = useCallback(async (conversationId: string): Promise<Conversation[]> => {
        try {
            // Delete from storage first
            const updatedConversations = await deleteConversationFile(conversationId);

            // Update server if configured
            if (serverConfigured) {
                // Delete the conversation from the server
                await deleteConversationFromServer(conversationId);

                // Update the conversation list
                const serverIds = await fetchConversationList();

                // Remove the deleted conversation ID
                const updatedServerIds = serverIds.filter(id => id !== conversationId);

                // If the list changed, save it back to the server
                if (updatedServerIds.length !== serverIds.length) {
                    await saveConversationList(updatedServerIds);
                }
            }

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
    }, [activeConversation, conversations, handleSetActiveConversation, serverConfigured]);

    // Update conversation title
    const handleUpdateTitle = useCallback(async (conversationId: string, newTitle: string) => {
        try {
            // Update the title in storage first
            const updatedConversation = await updateConversationTitleFile(conversationId, newTitle);

            if (!updatedConversation) {
                throw new Error("Failed to update conversation title");
            }

            // If server is configured, update the conversation on the server
            if (serverConfigured) {
                await saveConversationToServer(updatedConversation);
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
    }, [activeConversation, handleSetActiveConversation, serverConfigured]);

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
