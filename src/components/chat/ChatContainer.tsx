import React, { useEffect, useRef, useState } from 'react';
import { Box, useMediaQuery, Theme } from '@mui/material';
import ChatMessage from './ChatMessage';
import ChatInputArea from './ChatInputArea';
import { Message } from '../../types/chat';

interface ChatContainerProps {
    messages: Message[];
    onSendMessage: (message: string) => void;
    isTyping: boolean;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ messages, onSendMessage, isTyping }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    // Scroll to bottom when new messages are added
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Detect keyboard open/close on mobile
    useEffect(() => {
        if (!isMobile) return;

        const handleResize = () => {
            const heightReduction = window.outerHeight - window.innerHeight;
            const newIsKeyboardOpen = heightReduction > window.outerHeight * 0.3;

            setIsKeyboardOpen(newIsKeyboardOpen);

            // Ensure scroll position is maintained when keyboard opens/closes
            if (newIsKeyboardOpen) {
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMobile]);

    return (
        <Box
            ref={containerRef}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                height: '100%',
                position: 'relative',
            }}
        >
            <Box
                sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    p: { xs: 1, sm: 2 },
                    scrollBehavior: 'smooth',
                    WebkitOverflowScrolling: 'touch', // Improves scroll on iOS
                }}
            >
                {messages.map((message, index) => (
                    <ChatMessage key={index} message={message} />
                ))}
                <div ref={messagesEndRef} />
            </Box>
            <Box sx={{
                position: 'sticky',
                bottom: 0,
                width: '100%',
                backgroundColor: 'background.default',
                zIndex: 2
            }}>
                <ChatInputArea onSendMessage={onSendMessage} isTyping={isTyping} />
            </Box>
        </Box>
    );
};

export default ChatContainer;
