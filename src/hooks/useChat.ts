import { useState, useCallback } from 'react';
import { Conversation, Message } from '../types';
import { sendMessageToOpenAI, saveConversation } from '../utils/apiUtils';

interface UseChatProps {
    conversation: Conversation;
    onConversationUpdate?: (conversation: Conversation) => void;
}

/**
 * Custom hook for managing chat operations including sending messages,
 * editing messages, and retrying AI responses
 */
export const useChat = ({ conversation, onConversationUpdate }: UseChatProps) => {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [localConversation, setLocalConversation] = useState<Conversation>(conversation);
    const [editingMessage, setEditingMessage] = useState<{ index: number, content: string; } | null>(null);

    // Update local state when the conversation prop changes
    const updateConversation = useCallback((updatedConversation: Conversation) => {
        setLocalConversation(updatedConversation);
        if (onConversationUpdate) {
            onConversationUpdate(updatedConversation);
        }
    }, [onConversationUpdate]);

    // Send a message to OpenAI and update the conversation
    const sendMessage = useCallback(async (messageText: string) => {
        if (!messageText.trim()) return;

        // Add user message to the conversation immediately in UI
        const userMessage: Message = { role: 'user', content: messageText };
        const updatedConversation: Conversation = {
            ...localConversation,
            messages: [...localConversation.messages, userMessage],
        };

        // Update local state immediately for instant feedback
        setLocalConversation(updatedConversation);
        setInput('');
        setLoading(true);

        try {
            // Send message to OpenAI
            const aiResponse = await sendMessageToOpenAI(updatedConversation);

            // Add AI response to conversation
            const finalConversation: Conversation = {
                ...updatedConversation,
                messages: [...updatedConversation.messages, { role: 'assistant', content: aiResponse }],
            };

            // Save conversation to file
            await saveConversation(finalConversation);

            // Update the conversation state
            updateConversation(finalConversation);
        } catch (error) {
            console.error('Error sending message:', error);
            // Handle error - add a system message
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            const errorConversation: Conversation = {
                ...updatedConversation,
                messages: [
                    ...updatedConversation.messages,
                    { role: 'system', content: `Error: ${errorMessage}` },
                ],
            };

            updateConversation(errorConversation);
        } finally {
            setLoading(false);
        }
    }, [localConversation, updateConversation]);

    // Handle form submission
    const handleSendMessage = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    }, [input, sendMessage]);

    // Edit an existing message
    const editMessage = useCallback((index: number, content: string) => {
        const newMessages = [...localConversation.messages];
        const originalMessage = newMessages[index];

        // When editing an AI message, convert it to user message
        const role = originalMessage.role === 'assistant' ? 'user' : originalMessage.role;

        newMessages[index] = {
            role,
            content
        };

        const updatedConversation = {
            ...localConversation,
            messages: newMessages
        };

        updateConversation(updatedConversation);
        saveConversation(updatedConversation);
    }, [localConversation, updateConversation]);

    // Delete a message
    const deleteMessage = useCallback((index: number) => {
        const newMessages = [...localConversation.messages];
        newMessages.splice(index, 1);

        const updatedConversation = {
            ...localConversation,
            messages: newMessages
        };

        updateConversation(updatedConversation);
        saveConversation(updatedConversation);
    }, [localConversation, updateConversation]);

    // Retry an AI response
    const retryMessage = useCallback(async (index: number) => {
        const targetMessage = localConversation.messages[index];

        // We can only retry AI messages
        if (targetMessage.role !== 'assistant') {
            return;
        }

        // Remove this AI message and all messages after it
        const newMessages = localConversation.messages.slice(0, index);

        const updatedConversation = {
            ...localConversation,
            messages: newMessages
        };

        // Update local state
        setLocalConversation(updatedConversation);
        setLoading(true);

        try {
            // Send the context back to OpenAI to get a new response
            const aiResponse = await sendMessageToOpenAI(updatedConversation);

            // Add the new AI response
            const finalConversation = {
                ...updatedConversation,
                messages: [...newMessages, { role: 'assistant' as const, content: aiResponse }]
            };

            // Save and update
            await saveConversation(finalConversation);
            updateConversation(finalConversation);
        } catch (error) {
            console.error('Error retrying message:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

            const errorConversation = {
                ...updatedConversation,
                messages: [...newMessages, { role: 'system' as const, content: `Error: ${errorMessage}` }]
            };

            updateConversation(errorConversation);
        } finally {
            setLoading(false);
        }
    }, [localConversation, updateConversation]);

    return {
        input,
        loading,
        localConversation,
        editingMessage,
        setInput,
        setEditingMessage,
        handleSendMessage,
        editMessage,
        deleteMessage,
        retryMessage
    };
};
