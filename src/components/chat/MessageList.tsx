import React, { useRef, useEffect } from 'react';
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
}

const MessageList: React.FC<MessageListProps> = ({
    messages,
    onEditMessage,
    onDeleteMessage,
    onRetryMessage,
    onToggleStarMessage,
    editingMessage,
    setEditingMessage,
    loading
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            overflow: 'auto',
            p: 2
        }}>
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
