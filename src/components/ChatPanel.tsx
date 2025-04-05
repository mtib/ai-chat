import React, { useRef, useEffect, useState } from 'react';
import { Box, TextField, Button, Paper, Typography, Avatar, CircularProgress, IconButton, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, Snackbar, Alert } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Markdown from 'markdown-to-jsx';
import { Conversation } from '../types';
import { useChat } from '../hooks/useChat';

// Define prompt templates
const PROMPT_TEMPLATES = {
    GENERIC: "I am a helpful AI assistant. I'll answer questions, provide information, and assist with various tasks.",
    CODING: "I am a coding assistant. I can help with programming questions, debugging, explaining code concepts, and providing code examples across various languages and frameworks.",
    DND: "I am a creative writing assistant for tabletop role-playing adventures. I can help create characters, design encounters, develop storylines, and describe immersive worlds for your campaign."
};

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
    const [copySnackbar, setCopySnackbar] = useState(false);
    const [promptSelectOpen, setPromptSelectOpen] = useState(false);

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

    const handleCopyMessage = () => {
        if (selectedMessageIndex === null) return;
        const content = localConversation.messages[selectedMessageIndex].content;
        navigator.clipboard.writeText(content);
        setCopySnackbar(true);
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

    // Handle export of conversation
    const handleExportConversation = () => {
        const dataStr = JSON.stringify(localConversation, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `${localConversation.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    // Handle setting system prompt
    const handleSetSystemPrompt = (prompt: string) => {
        // Find the system message or create it if it doesn't exist
        const messages = [...localConversation.messages];
        const systemIndex = messages.findIndex(m => m.role === 'system');

        if (systemIndex >= 0) {
            // Update existing system message
            messages[systemIndex] = { ...messages[systemIndex], content: prompt };
        } else {
            // Add system message at the beginning
            messages.unshift({ role: 'system', content: prompt });
        }

        if (onConversationUpdate) {
            onConversationUpdate({
                ...localConversation,
                messages
            });
        }

        setPromptSelectOpen(false);
    };

    // Helper to get appropriate placeholder text based on conversation template
    const getPlaceholderText = () => {
        const systemMessage = localConversation.messages.find(m => m.role === 'system');
        if (!systemMessage) return "Type a message to start chatting...";

        if (systemMessage.content === PROMPT_TEMPLATES.GENERIC) {
            return "Ask me anything...";
        } else if (systemMessage.content === PROMPT_TEMPLATES.CODING) {
            return "Ask a coding question or describe a programming problem...";
        } else if (systemMessage.content === PROMPT_TEMPLATES.DND) {
            return "Describe your scene, ask for ideas, or request story development...";
        }

        return "Type a message to start chatting...";
    };

    return (
        <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, py: 1 }}>
                <Typography variant="h6">
                    {localConversation.title}
                </Typography>
                <Box>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setPromptSelectOpen(true)}
                        sx={{ mr: 1 }}
                    >
                        Set Template
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={handleExportConversation}
                        sx={{ mr: 1 }}
                    >
                        Export Conversation
                    </Button>
                </Box>
            </Box>

            {/* Template selection dialog */}
            <Dialog open={promptSelectOpen} onClose={() => setPromptSelectOpen(false)}>
                <DialogTitle>Select Conversation Template</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Choose a template to set the AI's behavior for this conversation:
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Button
                            variant="outlined"
                            onClick={() => handleSetSystemPrompt(PROMPT_TEMPLATES.GENERIC)}
                            sx={{ justifyContent: 'flex-start', textAlign: 'left', py: 2 }}
                        >
                            <Box>
                                <Typography variant="subtitle1">Generic Assistant</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    General-purpose AI assistant for answering questions and providing information
                                </Typography>
                            </Box>
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => handleSetSystemPrompt(PROMPT_TEMPLATES.CODING)}
                            sx={{ justifyContent: 'flex-start', textAlign: 'left', py: 2 }}
                        >
                            <Box>
                                <Typography variant="subtitle1">Coding Assistant</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Specialized in programming help, code examples, and technical explanations
                                </Typography>
                            </Box>
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => handleSetSystemPrompt(PROMPT_TEMPLATES.DND)}
                            sx={{ justifyContent: 'flex-start', textAlign: 'left', py: 2 }}
                        >
                            <Box>
                                <Typography variant="subtitle1">TTRPG Writing Assistant</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Helps create characters, storylines, and worlds for tabletop role-playing games
                                </Typography>
                            </Box>
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPromptSelectOpen(false)}>Cancel</Button>
                </DialogActions>
            </Dialog>

            {/* Messages area */}
            <Paper
                elevation={3}
                sx={{
                    flexGrow: 1,
                    p: 2,
                    mb: 2,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
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
                            <Box className="message-content">
                                <Markdown options={{
                                    overrides: {
                                        a: {
                                            props: {
                                                target: '_blank',
                                                rel: 'noopener noreferrer'
                                            }
                                        }
                                    }
                                }}>
                                    {message.content}
                                </Markdown>
                            </Box>

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
                <MenuItem onClick={handleCopyMessage}>
                    <ContentCopyIcon fontSize="small" sx={{ mr: 1 }} />
                    Copy Content
                </MenuItem>
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

            {/* Edit message dialog - made bigger */}
            <Dialog
                open={editingMessage !== null}
                onClose={() => setEditingMessage(null)}
                maxWidth="md"
                fullWidth
            >
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
                        minRows={10}
                        maxRows={20}
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

            {/* Copy confirmation snackbar */}
            <Snackbar
                open={copySnackbar}
                autoHideDuration={3000}
                onClose={() => setCopySnackbar(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="success" onClose={() => setCopySnackbar(false)}>
                    Message copied to clipboard!
                </Alert>
            </Snackbar>

            {/* Input area */}
            <Box component="form" onSubmit={handleSendMessage} sx={{ display: 'flex', minHeight: '100px' }}>
                <TextField
                    fullWidth
                    placeholder={getPlaceholderText()}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    multiline
                    minRows={3}
                    maxRows={6}
                    disabled={loading}
                    sx={{ mr: 1 }}
                />
                <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    disabled={loading || !input.trim()}
                    endIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                    sx={{ alignSelf: 'flex-start' }}
                >
                    Send
                </Button>
            </Box>
        </Box>
    );
};

export default ChatPanel;
