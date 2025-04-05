import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    useTheme
} from '@mui/material';
import { getApiKey, setApiKey } from '../utils/apiUtils';
import { ENV_API_KEY } from '../config/apiConfig';

/**
 * Modal component for setting and managing OpenAI API key
 */
const ApiKeyModal: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [apiKey, setApiKeyState] = useState('');
    const [error, setError] = useState('');
    const [hasEnvKey, setHasEnvKey] = useState(false);
    const theme = useTheme();

    useEffect(() => {
        // Check if API key is already set
        const key = getApiKey();
        const envKey = ENV_API_KEY;

        setHasEnvKey(!!envKey);

        if (!key && !envKey) {
            setOpen(true);
        } else {
            setApiKeyState(key);
        }
    }, []);

    const handleSave = useCallback(() => {
        if (!apiKey) {
            setError('Please enter your OpenAI API key');
            return;
        }

        setApiKey(apiKey);
        setError('');
        setOpen(false);
    }, [apiKey]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        }
    }, [handleSave]);

    const handleOpen = useCallback(() => {
        setOpen(true);
    }, []);

    return (
        <>
            <Button
                variant="outlined"
                color="secondary"
                size="small"
                onClick={handleOpen}
                sx={{
                    m: 1
                }}
            >
                {hasEnvKey ? 'API Key (Environment)' : 'Change API Key'}
            </Button>

            <Dialog
                open={open}
                onClose={() => { }}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { bgcolor: theme.palette.background.paper }
                }}
            >
                <DialogTitle>OpenAI API Key</DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Enter your OpenAI API key to use this application.
                            Your key will be stored locally in your browser.
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            If you don't have an API key, you can get one from{' '}
                            <a
                                href="https://platform.openai.com/account/api-keys"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: theme.palette.primary.main }}
                            >
                                OpenAI's website
                            </a>.
                        </Typography>

                        {hasEnvKey && (
                            <Alert severity="info" sx={{ mb: 2 }}>
                                An API key is already set via environment variables. Any key you enter here will override it.
                            </Alert>
                        )}

                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                        <TextField
                            label="OpenAI API Key"
                            fullWidth
                            variant="outlined"
                            value={apiKey}
                            onChange={(e) => setApiKeyState(e.target.value)}
                            placeholder="sk-..."
                            type="password"
                            autoFocus
                            onKeyDown={handleKeyDown}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleSave} variant="contained" color="primary">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ApiKeyModal;
