import { useState, useCallback, useEffect } from 'react';
import { Conversation, Message } from '../types';
import { sendMessageToOpenAI, saveConversation, generateImageWithDALLE } from '../utils/apiUtils';

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
    useEffect(() => {
        setLocalConversation(conversation);
    }, [conversation]);

    // Update local state when the conversation prop changes
    const updateConversation = useCallback((updatedConversation: Conversation) => {
        // Always update lastModified when conversation is updated
        const now = new Date().toISOString();
        const conversationWithTimestamp = {
            ...updatedConversation,
            lastModified: now
        };

        setLocalConversation(conversationWithTimestamp);
        if (onConversationUpdate) {
            onConversationUpdate(conversationWithTimestamp);
        }
    }, [onConversationUpdate]);

    // Toggle star status of a message
    const toggleStarMessage = useCallback((index: number) => {
        const newMessages = [...localConversation.messages];
        const message = newMessages[index];

        // Toggle the starred property
        newMessages[index] = {
            ...message,
            starred: !message.starred
        };

        const updatedConversation = {
            ...localConversation,
            messages: newMessages,
            lastModified: new Date().toISOString() // Update lastModified
        };

        updateConversation(updatedConversation);
        saveConversation(updatedConversation);
    }, [localConversation, updateConversation]);

    // Send a message to OpenAI and update the conversation
    const sendMessage = useCallback(async (messageText: string) => {
        if (!messageText.trim()) return;

        // Add user message to the conversation immediately in UI
        const userMessage: Message = { role: 'user', content: messageText };
        const now = new Date().toISOString();
        const updatedConversation: Conversation = {
            ...localConversation,
            messages: [...localConversation.messages, userMessage],
            lastModified: now
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
                lastModified: new Date().toISOString() // Update timestamp again after getting response
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
                lastModified: new Date().toISOString()
            };

            updateConversation(errorConversation);
        } finally {
            setLoading(false);
        }
    }, [localConversation, updateConversation]);

    // Generate image using DALL-E 3
    const generateImage = useCallback(async (prompt: string) => {
        if (!prompt.trim()) return;

        // Add user message to the conversation immediately in UI
        const userMessage: Message = { role: 'user', content: prompt };
        const now = new Date().toISOString();
        const updatedConversation: Conversation = {
            ...localConversation,
            messages: [...localConversation.messages, userMessage],
            lastModified: now
        };

        // Update local state immediately for instant feedback
        setLocalConversation(updatedConversation);
        setInput('');
        setLoading(true);

        try {
            // Generate image with DALL-E
            const imageResponse = await generateImageWithDALLE(prompt);

            // Add image response to conversation
            const finalConversation: Conversation = {
                ...updatedConversation,
                messages: [
                    ...updatedConversation.messages,
                    {
                        role: 'assistant',
                        content: `![Generated image](${imageResponse.imageUrl})\n\n${imageResponse.revisedPrompt || 'Image generated successfully.'}`
                    }
                ],
                lastModified: new Date().toISOString()
            };

            // Save conversation to file
            await saveConversation(finalConversation);

            // Update the conversation state
            updateConversation(finalConversation);
        } catch (error) {
            console.error('Error generating image:', error);
            // Handle error - add a system message
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            const errorConversation: Conversation = {
                ...updatedConversation,
                messages: [
                    ...updatedConversation.messages,
                    { role: 'system', content: `Error generating image: ${errorMessage}` },
                ],
                lastModified: new Date().toISOString()
            };

            updateConversation(errorConversation);
        } finally {
            setLoading(false);
        }
    }, [localConversation, updateConversation]);

    // Generate prompt based on conversation context without user input
    const handleGeneratePrompt = useCallback(async () => {
        // Skip if there are no messages or if we're already loading
        if (localConversation.messages.length === 0 || loading) return;

        setLoading(true);

        try {
            // Send to API
            const suggestedPrompt = await sendMessageToOpenAI(localConversation);

            // Add the AI's response as an assistant message
            const finalConversation: Conversation = {
                ...localConversation,
                messages: [...localConversation.messages, { role: 'assistant', content: suggestedPrompt }],
                lastModified: new Date().toISOString()
            };

            // Save conversation to file
            await saveConversation(finalConversation);

            // Update the conversation state
            updateConversation(finalConversation);
        } catch (error) {
            console.error('Error generating prompt:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            const errorConversation: Conversation = {
                ...localConversation,
                messages: [
                    ...localConversation.messages,
                    { role: 'system', content: `Error generating prompt: ${errorMessage}` },
                ],
                lastModified: new Date().toISOString()
            };

            updateConversation(errorConversation);
        } finally {
            setLoading(false);
        }
    }, [localConversation, loading, updateConversation]);

    // Handle form submission - now decides between send or prompt based on input
    const handleSendMessage = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            sendMessage(input);
        } else {
            handleGeneratePrompt();
        }
    }, [input, sendMessage, handleGeneratePrompt]);

    // Edit an existing message
    const editMessage = useCallback((index: number, content: string) => {
        const newMessages = [...localConversation.messages];
        const originalMessage = newMessages[index];

        // When editing an AI message, convert it to user message
        const role = originalMessage.role === 'assistant' ? 'user' : originalMessage.role;

        // Preserve the starred status when editing
        newMessages[index] = {
            role,
            content,
            starred: originalMessage.starred
        };

        const updatedConversation = {
            ...localConversation,
            messages: newMessages,
            lastModified: new Date().toISOString()
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
            messages: newMessages,
            lastModified: new Date().toISOString()
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
            messages: newMessages,
            lastModified: new Date().toISOString()
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
                messages: [...newMessages, { role: 'assistant' as const, content: aiResponse }],
                lastModified: new Date().toISOString()
            };

            // Save and update
            await saveConversation(finalConversation);
            updateConversation(finalConversation);
        } catch (error) {
            console.error('Error retrying message:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

            const errorConversation = {
                ...updatedConversation,
                messages: [...newMessages, { role: 'system' as const, content: `Error: ${errorMessage}` }],
                lastModified: new Date().toISOString()
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
        handleGeneratePrompt,
        generateImage,
        editMessage,
        deleteMessage,
        retryMessage,
        toggleStarMessage
    };
};
