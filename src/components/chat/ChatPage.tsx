import React, { useState } from 'react';
import { Box, TextField, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const ChatPage: React.FC = () => {
    const [newMessage, setNewMessage] = useState('');

    const handleSendMessage = (event: React.FormEvent) => {
        event.preventDefault();
        if (newMessage.trim()) {
            // Logic to send message
            setNewMessage('');
        }
    };

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
            position: 'relative'
        }}>
            <Box sx={{
                flexGrow: 1,
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                pb: 2
            }}>
                {/* Chat messages will be rendered here */}
            </Box>

            <Box sx={{
                position: 'sticky',
                bottom: 0,
                backgroundColor: (theme) => theme.palette.background.default,
                pt: 1
            }}>
                <form onSubmit={handleSendMessage} style={{ width: '100%' }}>
                    <Box sx={{
                        display: 'flex',
                        gap: 1,
                        width: '100%',
                        position: 'relative'
                    }}>
                        <TextField
                            multiline
                            maxRows={4}
                            fullWidth
                            placeholder="Type your message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onFocus={() => {
                                // Wait for keyboard to fully appear before scrolling
                                setTimeout(() => {
                                    window.scrollTo(0, document.body.scrollHeight);
                                }, 300);
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '20px',
                                }
                            }}
                        />
                        <IconButton
                            type="submit"
                            color="primary"
                            disabled={!newMessage.trim()}
                            sx={{
                                flexShrink: 0,
                                alignSelf: 'flex-end',
                                mb: '8px'
                            }}
                        >
                            <SendIcon />
                        </IconButton>
                    </Box>
                </form>
            </Box>
        </Box>
    );
};

export default ChatPage;
