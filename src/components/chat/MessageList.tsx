import React, { useRef, useEffect, useLayoutEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { Message } from '../../types';
import MessageItem from './MessageItem';

interface MessageListProps {
    messages: Message[];
    onEditMessage: (index: number, content: string) => void;
    onDeleteMessage: (index: number) => void;
    onRetryMessage: (index: number) => void;
    onToggleStarMessage: (index: number) => void;
    editingMessage: { index: number, content: string; } | null;
    setEditingMessage: React.Dispatch<React.SetStateAction<{ index: number, content: string; } | null>>;
    loading: boolean;
    conversationId: string; // Added to identify the conversation
}

const MessageList: React.FC<MessageListProps> = ({
    messages,
    onEditMessage,
    onDeleteMessage,
    onRetryMessage,
    onToggleStarMessage,
    editingMessage,
    setEditingMessage,
    loading,
    conversationId
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const prevMessagesLengthRef = useRef<number>(messages.length);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const initialScrollRestored = useRef<boolean>(false);

    // Get the storage key for this conversation's scroll position
    const getScrollPosKey = () => `scroll_pos_${conversationId}`;

    // Save scroll position when user scrolls
    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollTop, scrollHeight } = scrollContainerRef.current;
            localStorage.setItem(getScrollPosKey(), scrollTop.toString());
        }
    };

    // Restore scroll position on initial load
    useLayoutEffect(() => {
        if (!initialScrollRestored.current && scrollContainerRef.current && messages.length > 0) {
            const savedScrollPos = localStorage.getItem(getScrollPosKey());

            if (savedScrollPos) {
                scrollContainerRef.current.scrollTop = parseInt(savedScrollPos);
                initialScrollRestored.current = true;
            }
        }
    }, [messages, conversationId]);

    // Scroll to bottom only when new messages are added
    useEffect(() => {
        if (messages.length > prevMessagesLengthRef.current) {
            scrollToBottom();
        }
        prevMessagesLengthRef.current = messages.length;
    }, [messages]);

    // Set up scroll event listener
    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', handleScroll);
            return () => {
                scrollContainer.removeEventListener('scroll', handleScroll);
            };
        }
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <Box
            ref={scrollContainerRef}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                overflow: 'auto',
                p: 2
            }}
        >
            {messages.map((message, index) => (
                <MessageItem
                    key={`message-${index}`}
                    message={message}
                    index={index}
                    onEdit={onEditMessage}
                    onDelete={onDeleteMessage}
                    onRetry={onRetryMessage}
                    onToggleStar={onToggleStarMessage}
                    isEditing={editingMessage?.index === index}
                    editContent={editingMessage?.content || ''}
                    setEditingMessage={setEditingMessage}
                />
            ))}

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <CircularProgress size={24} />
                </Box>
            )}

            <div ref={messagesEndRef} />
        </Box>
    );
};

export default MessageList;
