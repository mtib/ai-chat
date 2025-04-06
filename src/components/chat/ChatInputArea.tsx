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
    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
    const [isFocused, setIsFocused] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() && !isTyping) {
            onSendMessage(message);
            setMessage('');
        }
    };

    // Scroll input into view when focused on mobile
    useEffect(() => {
        if (isMobile && isFocused && textFieldRef.current) {
            // Use a small timeout to ensure keyboard has opened
            setTimeout(() => {
                textFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
    }, [isFocused, isMobile]);

    return (
        <Box
            component="form"
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
            }}
        >
            <TextField
                ref={textFieldRef}
                fullWidth
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
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
