import React, { useState } from 'react';
import { Box, Paper, useMediaQuery, Theme } from '@mui/material';
import { Conversation } from '../../types';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useChat } from '../../hooks/useChat';

interface ChatPanelProps {
    conversation: Conversation;
    onConversationUpdate: (updatedConversation: Conversation) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ conversation, onConversationUpdate }) => {
    const [isInputFocused, setIsInputFocused] = useState(false);
    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

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

    const handleInputFocus = () => {
        setIsInputFocused(true);
    };

    const handleInputBlur = () => {
        setIsInputFocused(false);
    };

    // Extended handler to blur input after sending a message
    const handleSendWithBlur = (e: React.FormEvent) => {
        handleSendMessage(e);
        setIsInputFocused(false);
    };

    // Determine if the message list should be hidden
    const hideMessageList = isMobile && isInputFocused;

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden'
        }}>
            {!hideMessageList && (
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
            )}

            <MessageInput
                value={input}
                onChange={setInput}
                onSubmit={handleSendWithBlur}
                onImage={handleGenerateImage}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                disabled={loading}
            />
        </Box>
    );
};

export default ChatPanel;
