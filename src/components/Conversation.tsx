import React, { useState, useRef, useEffect } from 'react';
import { Conversation as ConversationType, Message } from '../types';
import MessageItem from './chat/MessageItem'; // Updated import
import { findRelevantMessages, calculateLiveRelevanceScores } from '../utils/contextUtils';

interface ConversationProps {
    conversation: ConversationType;
    onSendMessage: (message: string) => void;
    onStarMessage: (messageId: string) => void;
    onDeleteMessage: (messageId: string) => void;
    isLoading?: boolean;
}

export const Conversation: React.FC<ConversationProps> = ({
    conversation,
    onSendMessage,
    onStarMessage,
    onDeleteMessage,
    isLoading = false,
}) => {
    const [message, setMessage] = useState('');
    const [relevanceScores, setRelevanceScores] = useState<Map<number, number>>(new Map());
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [editingMessage, setEditingMessage] = useState<{ index: number, content: string; } | null>(null);

    // Update relevance scores when message input changes or conversation messages change
    useEffect(() => {
        if (message.trim().length > 2) {
            const scores = calculateLiveRelevanceScores(conversation, message);
            setRelevanceScores(scores);
        } else {
            setRelevanceScores(new Map());
        }
    }, [message, conversation.messages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation.messages]);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (message.trim() && !isLoading) {
                onSendMessage(message);
                setMessage('');
            }
        }
    };

    const handleEditMessage = (index: number, content: string) => {
        // This function would be connected to the proper message handling logic
        console.log(`Editing message at index ${index} with content: ${content}`);
    };

    const handleRetryMessage = (index: number) => {
        // This function would be connected to the proper retry logic
        console.log(`Retrying message at index ${index}`);
    };

    const handleToggleStarMessage = (index: number) => {
        onStarMessage(index.toString());
    };

    return (
        <div className="flex flex-col h-screen">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {conversation.messages.map((msg, index) => (
                    <MessageItem
                        key={`message-${index}`}
                        message={msg}
                        index={index}
                        onEdit={handleEditMessage}
                        onDelete={() => onDeleteMessage(index.toString())}
                        onRetry={handleRetryMessage}
                        onToggleStar={handleToggleStarMessage}
                        isEditing={editingMessage?.index === index}
                        editContent={editingMessage?.content || ''}
                        setEditingMessage={setEditingMessage}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="border-t p-4">
                <textarea
                    className="w-full p-2 border rounded resize-none"
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    disabled={isLoading}
                />
                <div className="flex justify-between mt-2">
                    <button
                        className={`px-4 py-2 bg-blue-600 text-white rounded ${isLoading || !message.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                            }`}
                        onClick={() => {
                            if (message.trim() && !isLoading) {
                                onSendMessage(message);
                                setMessage('');
                            }
                        }}
                        disabled={isLoading || !message.trim()}
                    >
                        {isLoading ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
};
