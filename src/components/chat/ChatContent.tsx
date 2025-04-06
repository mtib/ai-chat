import React from 'react';
import { Box, Typography } from '@mui/material';
import ChatPanel from './ChatPanel';
import { useConversationContext } from '../../contexts/ConversationContext';

const ChatContent: React.FC = () => {
    const { activeConversation, updateConversation } = useConversationContext();

    return (
        <>
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
        </>
    );
};

export default ChatContent;
