import React, { useRef, useEffect, useState } from 'react';
import { Box, TextField, Button, Paper, Typography, Avatar, CircularProgress, IconButton, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { Conversation } from '../types';
import { useChat } from '../hooks/useChat';

interface ChatPanelProps {
    conversation: Conversation;
    onConversationUpdate?: (conversation: Conversation) => void;
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
        retryMessage
    } = useChat({ conversation, onConversationUpdate });

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedMessageIndex, setSelectedMessageIndex] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollToBottom();
    }, [localConversation?.messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>, index: number) => {
        setAnchorEl(event.currentTarget);
        setSelectedMessageIndex(index);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
        setSelectedMessageIndex(null);
    };

    const handleDeleteMessage = () => {
        if (selectedMessageIndex === null) return;
        deleteMessage(selectedMessageIndex);
        handleCloseMenu();
    };

    const handleEditMessage = () => {
        if (selectedMessageIndex === null) return;

        setEditingMessage({
            index: selectedMessageIndex,
            content: localConversation.messages[selectedMessageIndex].content
        });
        handleCloseMenu();
    };

    const handleEditSave = () => {
        if (!editingMessage) return;
        editMessage(editingMessage.index, editingMessage.content);
        setEditingMessage(null);
    };

    const handleEditKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            handleEditSave();
        }
    };

    const handleRetryMessage = () => {
        if (selectedMessageIndex === null) return;
        retryMessage(selectedMessageIndex);
        handleCloseMenu();
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
                {localConversation.title}
            </Typography>

            {/* Messages area */}
            <Paper
                elevation={3}
                sx={{
                    flexGrow: 1,
                    p: 2,
                    mb: 2,
                    overflowY: 'auto',
                    maxHeight: 'calc(100vh - 240px)',
                    bgcolor: 'background.paper'
                }}
            >
                {localConversation.messages.map((message, index) => (
                    <Box
                        key={index}
                        sx={{
                            display: 'flex',
                            mb: 2,
                            flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                            position: 'relative'
                        }}
                    >
                        <Avatar
                            sx={{
                                bgcolor: message.role === 'user' ? 'primary.main' : 'secondary.main',
                                mr: message.role === 'user' ? 0 : 2,
                                ml: message.role === 'user' ? 2 : 0,
                            }}
                        >
                            {message.role === 'user' ? 'U' : 'AI'}
                        </Avatar>
                        <Paper
                            elevation={1}
                            sx={{
                                p: 2,
                                maxWidth: '70%',
                                bgcolor: message.role === 'user' ? 'primary.dark' : 'background.default',
                                borderRadius: 2,
                                position: 'relative',
                                pr: message.role !== 'system' ? 4 : 2  // Add padding for the menu button
                            }}
                        >
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                {message.content}
                            </Typography>

                            {/* Only show options for user and assistant messages */}
                            {message.role !== 'system' && (
                                <IconButton
                                    size="small"
                                    onClick={(e) => handleOpenMenu(e, index)}
                                    sx={{
                                        position: 'absolute',
                                        right: 8,
                                        top: 8,
                                        opacity: 0.5,
                                        '&:hover': {
                                            opacity: 1
                                        }
                                    }}
                                >
                                    <MoreVertIcon fontSize="small" />
                                </IconButton>
                            )}
                        </Paper>
                    </Box>
                ))}
                <div ref={messagesEndRef} />
            </Paper>

            {/* Message actions menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
            >
                <MenuItem onClick={handleEditMessage}>
                    <EditIcon fontSize="small" sx={{ mr: 1 }} />
                    Edit
                </MenuItem>
                <MenuItem onClick={handleDeleteMessage}>
                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                    Remove
                </MenuItem>
                {selectedMessageIndex !== null &&
                    localConversation.messages[selectedMessageIndex]?.role === 'assistant' && (
                        <MenuItem onClick={handleRetryMessage}>
                            <RestartAltIcon fontSize="small" sx={{ mr: 1 }} />
                            Retry
                        </MenuItem>
                    )}
            </Menu>

            {/* Edit message dialog */}
            <Dialog open={editingMessage !== null} onClose={() => setEditingMessage(null)}>
                <DialogTitle>
                    Edit Message
                    {editingMessage && localConversation.messages[editingMessage.index].role === 'assistant' && (
                        <Typography variant="caption" display="block" color="text.secondary">
                            Note: This AI response will be converted to a user message
                        </Typography>
                    )}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        maxRows={10}
                        value={editingMessage?.content || ''}
                        onChange={(e) => setEditingMessage(prev =>
                            prev ? { ...prev, content: e.target.value } : null
                        )}
                        variant="outlined"
                        margin="dense"
                        onKeyDown={handleEditKeyDown}
                        helperText="Press Ctrl+Enter to save"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditingMessage(null)}>Cancel</Button>
                    <Button onClick={handleEditSave} color="primary" variant="contained">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Input area */}
            <Box component="form" onSubmit={handleSendMessage} sx={{ display: 'flex' }}>
                <TextField
                    fullWidth
                    placeholder="Describe your scene, ask for ideas, or request story development..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    multiline
                    maxRows={4}
                    disabled={loading}
                    sx={{ mr: 1 }}
                />
                <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    disabled={loading || !input.trim()}
                    endIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                >
                    Send
                </Button>
            </Box>
        </Box>
    );
};

export default ChatPanel;
