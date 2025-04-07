import React, { useState } from 'react';
import { Box, Paper, useMediaQuery, Theme } from '@mui/material';
import { Conversation } from '../../types';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useChat } from '../../hooks/useChat';
import { useSnackbar } from 'notistack';
import { storeInAssistantMemory } from '../../utils/apiUtils';
import { getApiKey } from '../../utils/apiUtils';

interface ChatPanelProps {
    conversation: Conversation;
    onConversationUpdate: (updatedConversation: Conversation) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ conversation, onConversationUpdate }) => {
    const [isInputFocused, setIsInputFocused] = useState(false);
    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
    const { enqueueSnackbar } = useSnackbar();

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

    // Handler for the remember button
    const handleRememberContent = async () => {
        if (input.trim() && localConversation.serverAssistant) {
            const apiKey = getApiKey();

            // Show loading toast
            enqueueSnackbar("Remembering content...", {
                variant: "info",
                autoHideDuration: 1000
            });

            try {
                // Store the content in the assistant's memory
                const success = await storeInAssistantMemory(
                    localConversation.serverAssistant,
                    input.trim(),
                    apiKey
                );

                if (success) {
                    enqueueSnackbar("Content remembered successfully!", {
                        variant: "success"
                    });

                    // Clear the input on successful storage
                    setInput("");
                } else {
                    throw new Error("Failed to store content");
                }
            } catch (error) {
                console.error(error);
                enqueueSnackbar("Failed to remember content", {
                    variant: "error"
                });
            }
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
                onRemember={localConversation.serverAssistant ? handleRememberContent : undefined}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                disabled={loading}
                conversation={localConversation}
            />
        </Box>
    );
};

export default ChatPanel;
