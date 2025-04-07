// filepath: /Users/mtib/Code/dnd-writer/src/components/sidebar/ServerAssistantConfig.tsx
import React, { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    CircularProgress,
    Alert,
    InputAdornment,
    IconButton
} from '@mui/material';
import { ServerAssistantConfig } from '../../types';
import { testAssistantConnection } from '../../utils/assistantServerUtils';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

interface ServerAssistantConfigProps {
    onConfigured: (config: ServerAssistantConfig) => void;
    onCancel: () => void;
}

const ServerAssistantConfigComponent: React.FC<ServerAssistantConfigProps> = ({
    onConfigured,
    onCancel
}) => {
    const [baseUrl, setBaseUrl] = useState('');
    const [token, setToken] = useState('');
    const [testing, setTesting] = useState(false);
    const [error, setError] = useState('');
    const [showToken, setShowToken] = useState(false);

    const handleTest = async () => {
        if (!baseUrl || !token) {
            setError('Please enter both URL and token');
            return;
        }

        setTesting(true);
        setError('');

        try {
            // Ensure URL has proper format
            const formattedUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
            const isConnected = await testAssistantConnection(formattedUrl, token);

            if (isConnected) {
                onConfigured({
                    baseUrl: formattedUrl,
                    token
                });
            } else {
                setError('Could not connect to server assistant. Please check URL and token.');
            }
        } catch (err) {
            setError(`Connection error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setTesting(false);
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Configure Server Assistant</Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enter the details of your assistant server to connect to your knowledge base.
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <TextField
                label="Server URL"
                fullWidth
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://your-assistant-server.com"
                variant="outlined"
                margin="normal"
            />

            <TextField
                label="API Token"
                fullWidth
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="your-api-token"
                variant="outlined"
                margin="normal"
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                onClick={() => setShowToken(!showToken)}
                                edge="end"
                            >
                                {showToken ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </InputAdornment>
                    )
                }}
            />

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                    variant="outlined"
                    onClick={onCancel}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleTest}
                    disabled={testing || !baseUrl || !token}
                    startIcon={testing ? <CircularProgress size={20} /> : null}
                >
                    {testing ? 'Testing Connection' : 'Connect'}
                </Button>
            </Box>
        </Box>
    );
};

export default ServerAssistantConfigComponent;
