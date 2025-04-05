import React, { useState } from 'react';
import { Box, List, ListItem, ListItemText, Typography, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider, ListItemButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Conversation } from '../types';

// Define prompt templates - keeping consistent with ChatPanel
const PROMPT_TEMPLATES = {
    GENERIC: "I am a helpful AI assistant. I'll answer questions, provide information, and assist with various tasks.",
    CODING: "I am a coding assistant. I can help with programming questions, debugging, explaining code concepts, and providing code examples across various languages and frameworks.",
    DND: "I am a creative writing assistant for tabletop role-playing adventures. I can help create characters, design encounters, develop storylines, and describe immersive worlds for your campaign."
};

interface ConversationListProps {
    conversations: Conversation[];
    selectedConversation?: Conversation;
    onSelect: (conversation: Conversation) => void;
    onNew?: (conversation: Conversation) => void;
    onDelete: (id: string) => void;
    onUpdate?: (conversation: Conversation) => void;
    activeConversation?: Conversation | null;
}

const ConversationList: React.FC<ConversationListProps> = ({
    conversations,
    selectedConversation,
    activeConversation,
    onSelect,
    onNew,
    onDelete,
    onUpdate
}) => {
    const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState(PROMPT_TEMPLATES.GENERIC);

    // Add states for edit dialog
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editingConversation, setEditingConversation] = useState<Conversation | null>(null);

    // Add states for delete confirmation dialog
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

    const handleClose = () => {
        setIsNewDialogOpen(false);
        setNewTitle('');
        setSelectedTemplate(PROMPT_TEMPLATES.GENERIC);
    };

    const handleCreate = () => {
        const newConversation: Conversation = {
            id: Date.now().toString(),
            title: newTitle || 'New Conversation',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: []
        };

        // Add system prompt if a template was selected
        if (selectedTemplate) {
            newConversation.messages.push({
                role: 'system',
                content: selectedTemplate
            });
        }

        if (onNew) {
            onNew(newConversation);
        } else if (onUpdate) {
            // Fallback to onUpdate if onNew is not provided
            onUpdate(newConversation);
        }
        handleClose();
    };

    const handleEditClick = (e: React.MouseEvent, conversation: Conversation) => {
        e.stopPropagation(); // Prevent conversation selection
        setEditingConversation(conversation);
        setEditTitle(conversation.title);
        setIsEditDialogOpen(true);
    };

    const handleEditClose = () => {
        setIsEditDialogOpen(false);
        setEditTitle('');
        setEditingConversation(null);
    };

    const handleSaveEdit = () => {
        if (!editingConversation || !onUpdate) return;

        const updatedConversation = {
            ...editingConversation,
            title: editTitle || editingConversation.title,
            updatedAt: new Date().toISOString()
        };

        onUpdate(updatedConversation);
        handleEditClose();
    };

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent conversation selection
        setConversationToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (conversationToDelete) {
            onDelete(conversationToDelete);
        }
        setIsDeleteDialogOpen(false);
        setConversationToDelete(null);
    };

    const handleDeleteCancel = () => {
        setIsDeleteDialogOpen(false);
        setConversationToDelete(null);
    };

    return (
        <Box sx={{ width: '100%', maxWidth: 600, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
                <Typography variant="h6">Conversations</Typography>
                <IconButton edge="end" onClick={() => setIsNewDialogOpen(true)}>
                    <AddIcon />
                </IconButton>
            </Box>
            <Divider />
            <List>
                {conversations.map((conversation) => (
                    <ListItem
                        key={conversation.id}
                        disablePadding
                        secondaryAction={
                            <Box>
                                <IconButton edge="end" onClick={(e) => handleEditClick(e, conversation)}>
                                    <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton edge="end" onClick={(e) => handleDeleteClick(e, conversation.id)}>
                                    <DeleteIcon />
                                </IconButton>
                            </Box>
                        }
                    >
                        <ListItemButton
                            selected={activeConversation?.id === conversation.id || selectedConversation?.id === conversation.id}
                            onClick={() => onSelect(conversation)}
                            sx={{ cursor: 'pointer' }}
                        >
                            <ListItemText
                                primary={conversation.title}
                                secondary={new Date(conversation.createdAt).toLocaleDateString()}
                            />
                        </ListItemButton>
                    </ListItem>
                ))}
                {conversations.length === 0 && (
                    <ListItem>
                        <ListItemText primary="No conversations yet" secondary="Create a new one to get started" />
                    </ListItem>
                )}
            </List>

            {/* New conversation dialog with template selection */}
            <Dialog open={isNewDialogOpen} onClose={handleClose} fullWidth maxWidth="sm">
                <DialogTitle>Create New Conversation</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Title"
                        fullWidth
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        variant="outlined"
                    />

                    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                        Select a Template (Optional)
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                        <Button
                            variant={selectedTemplate === PROMPT_TEMPLATES.GENERIC ? "contained" : "outlined"}
                            onClick={() => setSelectedTemplate(PROMPT_TEMPLATES.GENERIC)}
                            sx={{ justifyContent: 'flex-start', textAlign: 'left', py: 1.5 }}
                        >
                            <Box>
                                <Typography variant="subtitle2">Generic Assistant</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                    General-purpose AI assistant
                                </Typography>
                            </Box>
                        </Button>

                        <Button
                            variant={selectedTemplate === PROMPT_TEMPLATES.CODING ? "contained" : "outlined"}
                            onClick={() => setSelectedTemplate(PROMPT_TEMPLATES.CODING)}
                            sx={{ justifyContent: 'flex-start', textAlign: 'left', py: 1.5 }}
                        >
                            <Box>
                                <Typography variant="subtitle2">Coding Assistant</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                    Specialized in programming help
                                </Typography>
                            </Box>
                        </Button>

                        <Button
                            variant={selectedTemplate === PROMPT_TEMPLATES.DND ? "contained" : "outlined"}
                            onClick={() => setSelectedTemplate(PROMPT_TEMPLATES.DND)}
                            sx={{ justifyContent: 'flex-start', textAlign: 'left', py: 1.5 }}
                        >
                            <Box>
                                <Typography variant="subtitle2">TTRPG Writing Assistant</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                    For tabletop role-playing game content
                                </Typography>
                            </Box>
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleCreate} variant="contained">Create</Button>
                </DialogActions>
            </Dialog>

            {/* Edit conversation dialog */}
            <Dialog open={isEditDialogOpen} onClose={handleEditClose} fullWidth maxWidth="sm">
                <DialogTitle>Edit Conversation</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Title"
                        fullWidth
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        variant="outlined"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleEditClose}>Cancel</Button>
                    <Button onClick={handleSaveEdit} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>

            {/* Delete confirmation dialog */}
            <Dialog open={isDeleteDialogOpen} onClose={handleDeleteCancel}>
                <DialogTitle>Delete Conversation</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this conversation? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ConversationList;
