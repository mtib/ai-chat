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
        generateImage,
        editMessage,
        deleteMessage,
        retryMessage,
        toggleStarMessage
    } = useChat({ conversation, onConversationUpdate });

    // Handler for the image button
    const handleGenerateImage = () => {
        if (input.trim()) {
            generateImage(input);
        }
    };

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
                    conversationId={localConversation.id}
                />
            </Paper>

            <MessageInput
                value={input}
                onChange={setInput}
                onSubmit={handleSendMessage}
                onImage={handleGenerateImage}
                disabled={loading}
            />
        </Box>
    );
};

export default ChatPanel;
