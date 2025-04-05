import React from 'react';
import { Box, Paper } from '@mui/material';
import { Conversation } from '../../types';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useChat } from '../../hooks/useChat';

interface ChatPanelProps {
    conversation: Conversation;
    onConversationUpdate: (updatedConversation: Conversation) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ conversation, onConversationUpdate }) => {
    const {
        input,
        loading,
        localConversation,
        editingMessage,
        setInput,
        setEditingMessage,
        handleSendMessage,
        editMessage,
        deleteMessage,
        retryMessage,
        toggleStarMessage
    } = useChat({ conversation, onConversationUpdate });

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden'
        }}>
            <Paper
                elevation={3}
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    mb: 2,
                    backgroundColor: 'background.paper'
                }}
            >
                <MessageList
                    messages={localConversation.messages}
                    onEditMessage={editMessage}
                    onDeleteMessage={deleteMessage}
                    onRetryMessage={retryMessage}
                    onToggleStarMessage={toggleStarMessage}
                    editingMessage={editingMessage}
                    setEditingMessage={setEditingMessage}
                    loading={loading}
                />
            </Paper>

            <MessageInput
                value={input}
                onChange={setInput}
                onSubmit={handleSendMessage}
                disabled={loading}
            />
        </Box>
    );
};

export default ChatPanel;
