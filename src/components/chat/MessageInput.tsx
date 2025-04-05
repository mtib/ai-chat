import React from 'react';
import { Box, TextField, Button, ButtonGroup, Tooltip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PsychologyIcon from '@mui/icons-material/Psychology';
import ImageIcon from '@mui/icons-material/Image';

interface MessageInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    onImage: () => void; // New prop for image generation
    disabled: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ value, onChange, onSubmit, onImage, disabled }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            if (!disabled) {
                onSubmit(e as unknown as React.FormEvent);
            }
        }
    };

    // Determine which icon to show based on input state
    const primaryButtonIcon = value.trim() ? <SendIcon /> : <PsychologyIcon />;
    const primaryButtonTooltip = value.trim() ? "Send message" : "Generate AI prompt";

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
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                }}
            >
                <ButtonGroup
                    variant="contained"
                    orientation="vertical"
                    sx={{
                        height: '100%',
                    }}
                >
                    <Button
                        color="primary"
                        type="submit"
                        disabled={disabled}
                        endIcon={primaryButtonIcon}
                        sx={{
                            flexGrow: 1,
                            height: '50%',
                        }}
                    >
                        {value.trim() ? "Send" : "Prompt"}
                    </Button>
                    <Button
                        color="primary"
                        disabled={disabled || !value.trim()}
                        endIcon={<ImageIcon />}
                        onClick={(e) => {
                            e.preventDefault();
                            onImage();
                        }}
                        sx={{
                            flexGrow: 1,
                            height: '50%',
                        }}
                    >
                        Image
                    </Button>
                </ButtonGroup>
            </Box>
        </Box>
    );
};

export default MessageInput;
