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
    useTheme,
    Divider
} from '@mui/material';

// Storage keys for localStorage
const URL_STORAGE_KEY = 'json_server_url';
const TOKEN_STORAGE_KEY = 'json_server_token';

/**
 * Gets the JSON Server URL from localStorage or returns an empty string
 */
export const getJsonServerUrl = (): string => {
    return localStorage.getItem(URL_STORAGE_KEY) || '';
};

/**
 * Sets the JSON Server URL and saves it to localStorage
 */
export const setJsonServerUrl = (url: string): void => {
    localStorage.setItem(URL_STORAGE_KEY, url);
};

/**
 * Gets the JSON Server auth token from localStorage
 */
export const getJsonServerToken = (): string => {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || '';
};

/**
 * Sets the JSON Server auth token and saves it to localStorage
 */
export const setJsonServerToken = (token: string): void => {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

/**
 * Modal component for setting and managing the JSON Server URL and authentication
 */
const StorageServerModal: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [serverUrl, setServerUrl] = useState('');
    const [authToken, setAuthToken] = useState('');
    const [error, setError] = useState('');
    const theme = useTheme();

    useEffect(() => {
        // Load saved values when component mounts
        const url = getJsonServerUrl();
        const token = getJsonServerToken();
        setServerUrl(url);
        setAuthToken(token);
    }, []);

    const handleSave = useCallback(() => {
        if (!serverUrl.trim()) {
            setError('Please enter a valid server URL');
            return;
        }

        if (!authToken.trim()) {
            setError('Please enter an authentication token');
            return;
        }

        try {
            // Validate URL format
            new URL(serverUrl);

            // Save the URL and token
            setJsonServerUrl(serverUrl);
            setJsonServerToken(authToken);
            setError('');
            setOpen(false);
        } catch (err) {
            setError('Please enter a valid URL including the protocol (e.g., http://localhost:7781)');
        }
    }, [serverUrl, authToken]);

    const handleTest = useCallback(async () => {
        if (!serverUrl.trim()) {
            setError('Please enter a server URL to test');
            return;
        }

        if (!authToken.trim()) {
            setError('Please enter an authentication token to test the connection');
            return;
        }

        try {
            // Validate URL format
            new URL(serverUrl);

            // Test connection to the server with authentication
            try {
                const response = await fetch(`${serverUrl}/health`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.auth === 'valid') {
                        setError('');
                        alert('Connection successful! Server is reachable and authentication is valid.');
                    } else {
                        setError('Server is reachable but authentication validation failed.');
                    }
                } else {
                    if (response.status === 401 || response.status === 403) {
                        setError('Authentication failed. Please check your token.');
                    } else {
                        setError(`Server responded with status: ${response.status}`);
                    }
                }
            } catch (err) {
                setError('Failed to connect to server. Please check the URL and ensure the server is running.');
            }
        } catch (err) {
            setError('Please enter a valid URL including the protocol (e.g., http://localhost:7781)');
        }
    }, [serverUrl, authToken]);

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
                    width: '100%',
                    mb: 1
                }}
            >
                Storage Server
            </Button>

            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { bgcolor: theme.palette.background.paper }
                }}
            >
                <DialogTitle>Storage Server Configuration</DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Configure the URL of the JSON server used for storing data and proxying requests.
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            The server should be running on your local machine or accessible on your network.
                            If not configured, the application will attempt to determine the URL dynamically.
                        </Typography>

                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                        <TextField
                            label="JSON Server URL"
                            fullWidth
                            variant="outlined"
                            value={serverUrl}
                            onChange={(e) => setServerUrl(e.target.value)}
                            placeholder="http://localhost:7781"
                            autoFocus
                            onKeyDown={handleKeyDown}
                            sx={{ mb: 2 }}
                        />

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Authentication Token (Required)
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Enter the bearer token required to authenticate with the server.
                        </Typography>

                        <TextField
                            label="Authentication Token"
                            fullWidth
                            variant="outlined"
                            value={authToken}
                            onChange={(e) => setAuthToken(e.target.value)}
                            placeholder="Enter your token"
                            type="password"
                            onKeyDown={handleKeyDown}
                            sx={{ mb: 2 }}
                        />

                        <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>
                            The server must be running for features like image proxying to work correctly.
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleTest} variant="outlined" color="secondary">
                        Test Connection
                    </Button>
                    <Button onClick={handleSave} variant="contained" color="primary">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default StorageServerModal;
