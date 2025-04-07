import React from 'react';
import { Box, Typography } from '@mui/material';
import ChatPanel from './ChatPanel';
import { useConversationContext } from '../../contexts/ConversationContext';
import { SnackbarProvider } from 'notistack';

const ChatContent: React.FC = () => {
    const { activeConversation, updateConversation } = useConversationContext();

    return (
        <SnackbarProvider
            maxSnack={3}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            autoHideDuration={4000}
        >
            {activeConversation ? (
                <ChatPanel
                    conversation={activeConversation}
                    onConversationUpdate={updateConversation}
                />
            ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography variant="h6" color="text.secondary" fontFamily="Sono" align='center'>
                        Create a new conversation or select an existing one
                    </Typography>
                </Box>
            )}
        </SnackbarProvider>
    );
};

export default ChatContent;
