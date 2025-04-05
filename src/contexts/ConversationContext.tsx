import React, { createContext, useContext, ReactNode } from 'react';
import { Conversation } from '../types';
import { useConversations } from '../hooks/useConversations';

interface ConversationContextType {
    conversations: Conversation[];
    activeConversation: Conversation | null;
    filteredConversations: Conversation[];
    searchQuery: string;
    isLoading: boolean;
    setActiveConversation: (conversation: Conversation | null) => void;
    setSearchQuery: (query: string) => void;
    createConversation: (conversation?: Conversation) => Promise<Conversation | null>;
    updateConversation: (conversation: Conversation) => void;
    deleteConversation: (id: string) => Promise<Conversation[]>;
    updateConversationTitle: (id: string, title: string) => Promise<Conversation | null>;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export const ConversationProvider: React.FC<{ children: ReactNode; }> = ({ children }) => {
    const conversationState = useConversations();

    return (
        <ConversationContext.Provider value={conversationState}>
            {children}
        </ConversationContext.Provider>
    );
};

export const useConversationContext = () => {
    const context = useContext(ConversationContext);
    if (context === undefined) {
        throw new Error('useConversationContext must be used within a ConversationProvider');
    }
    return context;
};
