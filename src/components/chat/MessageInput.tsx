import React from 'react';
import { Box, TextField, Button, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

interface MessageInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    disabled: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ value, onChange, onSubmit, disabled }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            if (value.trim() && !disabled) {
                onSubmit(e as unknown as React.FormEvent);
            }
        }
    };

    return (
        <Box component="form" onSubmit={onSubmit} sx={{ display: 'flex', minHeight: '100px' }}>
            <TextField
                fullWidth
                placeholder="Type your message... (Ctrl+Enter to send)"
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                multiline
                minRows={3}
                maxRows={6}
                disabled={disabled}
                sx={{ mr: 1 }}
                InputProps={{
                    sx: {
                        fontFamily: 'Sono',
                    }
                }}
            />
            <Button
                variant="contained"
                color="primary"
                type="submit"
                disabled={disabled || !value.trim()}
                endIcon={<SendIcon />}
                sx={{ alignSelf: 'stretch' }}
            >
                Send
            </Button>
        </Box>
    );
};

export default MessageInput;
