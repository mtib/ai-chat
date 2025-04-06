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
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);

    // Scroll to bottom when new messages are added or when the keyboard opens/closes
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isKeyboardOpen]);

    // Detect keyboard open/close on mobile
    useEffect(() => {
        if (!isMobile) return;

        const handleResize = () => {
            const heightReduction = window.outerHeight - window.innerHeight;
            const newIsKeyboardOpen = heightReduction > window.outerHeight * 0.25;

            if (newIsKeyboardOpen !== isKeyboardOpen) {
                setIsKeyboardOpen(newIsKeyboardOpen);

                // When keyboard opens, scroll to the bottom
                if (newIsKeyboardOpen) {
                    setTimeout(() => {
                        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                }
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMobile, isKeyboardOpen]);

    // Custom handler for when the input is focused
    const handleInputFocus = () => {
        setIsInputFocused(true);

        if (isMobile) {
            // Delay to allow keyboard to start appearing
            setTimeout(() => {
                // Scroll to the end of messages to show the input area
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

                // Also scroll the container if needed
                if (messagesContainerRef.current) {
                    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                }
            }, 150);
        }
    };

    const handleInputBlur = () => {
        setIsInputFocused(false);
    };

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
                ref={messagesContainerRef}
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

            <Box
                sx={{
                    position: 'sticky',
                    bottom: 0,
                    width: '100%',
                    backgroundColor: 'background.default',
                    zIndex: 2,
                    // Add padding to compensate for keyboard on mobile
                    paddingBottom: isMobile && isInputFocused ? 2 : 0,
                }}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
            >
                <ChatInputArea
                    onSendMessage={onSendMessage}
                    isTyping={isTyping}
                />
            </Box>
        </Box>
    );
};

export default ChatContainer;
