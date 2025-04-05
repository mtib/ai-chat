import React, { useState } from 'react';
import {
    IconButton,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { updateConversationTitle, deleteConversation } from '../utils/fileUtils';
import { Conversation } from '../types';

interface ConversationSettingsProps {
    conversation: Conversation;
    onConversationUpdate: (conversation: Conversation) => void;
    onConversationDelete: (conversationId: string) => Promise<Conversation[]>;
}

const ConversationSettings: React.FC<ConversationSettingsProps> = ({
    conversation,
    onConversationUpdate,
    onConversationDelete
}) => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [titleDialogOpen, setTitleDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [newTitle, setNewTitle] = useState(conversation?.title || '');

    const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleEditClick = () => {
        setNewTitle(conversation.title);
        setTitleDialogOpen(true);
        handleMenuClose();
    };

    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
        handleMenuClose();
    };

    const handleTitleSave = async () => {
        if (newTitle.trim() && newTitle !== conversation.title) {
            const updatedConversation = await updateConversationTitle(conversation.id, newTitle);
            onConversationUpdate(updatedConversation);
        }
        setTitleDialogOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleTitleSave();
        }
    };

    const handleDeleteConfirm = async () => {
        const updatedConversations = await onConversationDelete(conversation.id);
        setDeleteDialogOpen(false);
    };

    return (
        <>
            <IconButton size="small" onClick={handleMenuOpen}>
                <MoreVertIcon fontSize="small" />
            </IconButton>

            {/* Settings Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handleEditClick}>
                    <ListItemIcon>
                        <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Edit Title</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleDeleteClick}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Delete Conversation</ListItemText>
                </MenuItem>
            </Menu>

            {/* Edit Title Dialog */}
            <Dialog open={titleDialogOpen} onClose={() => setTitleDialogOpen(false)}>
                <DialogTitle>Edit Conversation Title</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Title"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTitleDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleTitleSave} variant="contained" color="primary">Save</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Delete Conversation</DialogTitle>
                <DialogContent>
                    Are you sure you want to delete "{conversation.title}"? This action cannot be undone.
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} variant="contained" color="error">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ConversationSettings;
