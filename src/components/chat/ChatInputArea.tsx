import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, Button, useMediaQuery, Theme } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

interface ChatInputAreaProps {
    onSendMessage: (message: string) => void;
    isTyping: boolean;
}

const ChatInputArea: React.FC<ChatInputAreaProps> = ({ onSendMessage, isTyping }) => {
    const [message, setMessage] = useState('');
    const textFieldRef = useRef<HTMLDivElement>(null);
    const inputContainerRef = useRef<HTMLFormElement>(null);
    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
    const [isFocused, setIsFocused] = useState(false);
    const [wasKeyboardJustOpened, setWasKeyboardJustOpened] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() && !isTyping) {
            onSendMessage(message);
            setMessage('');
        }
    };

    // Handle input focus changes
    const handleFocus = () => {
        setIsFocused(true);
        if (isMobile) {
            setWasKeyboardJustOpened(true);

            // Use a timeout to ensure this happens after keyboard appears
            setTimeout(() => {
                // Scroll to the input field
                textFieldRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });

                // Also scroll the viewport to show the input properly
                window.scrollTo(0, document.body.scrollHeight);
            }, 300);
        }
    };

    const handleBlur = () => {
        setIsFocused(false);
    };

    // Effects for handling keyboard visibility
    useEffect(() => {
        if (wasKeyboardJustOpened && isFocused && isMobile) {
            const timer = setTimeout(() => {
                textFieldRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });

                // Reset the flag after handling the keyboard open event
                setWasKeyboardJustOpened(false);
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [wasKeyboardJustOpened, isFocused, isMobile]);

    // Subscribe to window resize events to detect keyboard
    useEffect(() => {
        if (!isMobile) return;

        const handleResize = () => {
            const heightReduction = window.outerHeight - window.innerHeight;
            const keyboardIsLikelyOpen = heightReduction > window.outerHeight * 0.25;

            if (keyboardIsLikelyOpen && isFocused) {
                // If keyboard just appeared, scroll to make input visible
                setTimeout(() => {
                    textFieldRef.current?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }, 150);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMobile, isFocused]);

    return (
        <Box
            component="form"
            ref={inputContainerRef}
            onSubmit={handleSubmit}
            sx={{
                display: 'flex',
                padding: { xs: '8px', md: '16px' },
                backgroundColor: 'background.paper',
                borderTop: '1px solid',
                borderColor: 'divider',
                position: 'sticky',
                bottom: 0,
                zIndex: 10,
                marginTop: 'auto',
                // Add extra space at the bottom on mobile for better visibility
                paddingBottom: isMobile && isFocused ? '16px' : '8px',
            }}
        >
            <TextField
                ref={textFieldRef}
                fullWidth
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                disabled={isTyping}
                multiline
                maxRows={4}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '20px',
                    },
                    mr: 1,
                }}
            />
            <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={!message.trim() || isTyping}
                sx={{
                    borderRadius: '50%',
                    minWidth: '40px',
                    width: '40px',
                    height: '40px',
                    alignSelf: 'flex-end',
                }}
            >
                <SendIcon />
            </Button>
        </Box>
    );
};

export default ChatInputArea;
