import React, { useRef, useState } from 'react';
import { Box, Button, ButtonGroup, Tooltip, useMediaQuery, Theme, Paper, TextField } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PsychologyIcon from '@mui/icons-material/Psychology';
import ImageIcon from '@mui/icons-material/Image';

interface MessageInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    onImage: () => void;
    disabled: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ value, onChange, onSubmit, onImage, disabled }) => {
    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
    const [isFocused, setIsFocused] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    const primaryButtonText = value.trim() ? "Send" : "Prompt";

    return (
        <Box
            component="form"
            onSubmit={onSubmit}
            sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1, sm: 0 },
                maxHeight: { xs: 'auto', sm: '120px' },
                height: { sm: '100%' },
            }}
        >
            <Paper
                elevation={isFocused ? 3 : 1}
                sx={{
                    display: 'flex',
                    flexGrow: 1,
                    mr: { xs: 0, sm: 1 },
                    position: 'relative',
                    border: isFocused ? '1px solid #1976d2' : '1px solid rgba(0, 0, 0, 0.23)',
                    borderRadius: 1,
                    overflow: 'hidden',
                }}
            >
                <TextField
                    multiline
                    fullWidth
                    variant="standard"
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    disabled={disabled}
                    placeholder={isMobile ? "Message..." : "Type your message... (Ctrl+Enter to send)"}
                    InputProps={{
                        disableUnderline: true,
                        sx: {
                            fontFamily: 'Sono, monospace',
                            padding: '0px',
                            height: '100%',
                            '& textarea': {
                                padding: '8px 14px',
                                minHeight: '18px',
                                maxHeight: isMobile ? '150px' : '100%',
                                overflowY: 'auto',
                                wordBreak: 'break-word',
                                cursor: disabled ? 'not-allowed' : 'text',
                                opacity: disabled ? 0.7 : 1,
                                backgroundColor: disabled ? 'rgba(0, 0, 0, 0.05)' : 'inherit'
                            }
                        }
                    }}
                />
            </Paper>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'row', sm: 'column' },
                    gap: 1,
                    height: { sm: '100%' },
                }}
            >
                <ButtonGroup
                    variant="contained"
                    orientation={isMobile ? "horizontal" : "vertical"}
                    sx={{
                        height: '100%',
                        width: { xs: '100%', sm: 'auto' },
                        minWidth: { xs: '100%', sm: '120px' },
                    }}
                >
                    <Button
                        color="primary"
                        type="submit"
                        disabled={disabled}
                        endIcon={primaryButtonIcon}
                        sx={{
                            flexGrow: 1,
                            width: isMobile ? '70%' : '100%',
                        }}
                    >
                        {primaryButtonText}
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
                            width: isMobile ? '30%' : '100%',
                        }}
                    >
                        {!isMobile && "Image"}
                    </Button>
                </ButtonGroup>
            </Box>
        </Box>
    );
};

export default MessageInput;
