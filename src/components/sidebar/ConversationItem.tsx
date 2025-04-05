// filepath: /Users/mtib/Code/dnd-writer/src/components/sidebar/ConversationItem.tsx
import React, { useState } from 'react';
import {
    ListItem,
    ListItemButton,
    ListItemText,
    IconButton,
    TextField,
    Box,
    Tooltip,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Conversation } from '../../types';

interface ConversationItemProps {
    conversation: Conversation;
    isActive: boolean;
    onClick: () => void;
    onRename: (id: string, newTitle: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
    conversation,
    isActive,
    onClick,
    onRename,
    onDelete,
}) => {
    const [isRenaming, setIsRenaming] = useState(false);
    const [newTitle, setNewTitle] = useState(conversation.title);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const open = Boolean(anchorEl);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation(); // Prevent triggering the list item click
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = (event?: React.MouseEvent) => {
        if (event) event.stopPropagation();
        setAnchorEl(null);
    };

    const handleRenameClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        handleMenuClose();
        setNewTitle(conversation.title);
        setIsRenaming(true);
    };

    const handleDeleteClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        handleMenuClose();
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            await onDelete(conversation.id);
        } catch (error) {
            console.error('Error deleting conversation:', error);
        }
        setDeleteDialogOpen(false);
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
    };

    const handleRenameSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        event.stopPropagation();

        if (newTitle.trim() && newTitle !== conversation.title) {
            try {
                await onRename(conversation.id, newTitle.trim());
            } catch (error) {
                console.error('Error renaming conversation:', error);
                alert('Failed to rename conversation');
            }
        }

        setIsRenaming(false);
    };

    const handleRenameCancel = (event: React.MouseEvent) => {
        event.stopPropagation();
        setIsRenaming(false);
    };

    if (isRenaming) {
        return (
            <ListItem disablePadding>
                <Box
                    component="form"
                    onSubmit={handleRenameSubmit}
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                        display: 'flex',
                        width: '100%',
                        p: 1,
                        bgcolor: isActive ? 'action.selected' : 'transparent',
                    }}
                >
                    <TextField
                        size="small"
                        autoFocus
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        fullWidth
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                                handleRenameCancel(e as unknown as React.MouseEvent);
                            }
                        }}
                    />
                    <Box sx={{ display: 'flex', ml: 1 }}>
                        <IconButton size="small" onClick={handleRenameSubmit} type="submit">
                            ✓
                        </IconButton>
                        <IconButton size="small" onClick={handleRenameCancel}>
                            ✗
                        </IconButton>
                    </Box>
                </Box>
            </ListItem>
        );
    }

    return (
        <>
            <ListItem disablePadding>
                <ListItemButton
                    selected={isActive}
                    onClick={onClick}
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        py: 0.5
                    }}
                >
                    <ListItemText
                        primary={conversation.title}
                        primaryTypographyProps={{
                            noWrap: true,
                            fontFamily: 'Sono',
                            fontSize: '0.9rem'
                        }}
                    />
                    <Tooltip title="Options">
                        <IconButton
                            size="small"
                            edge="end"
                            onClick={handleMenuOpen}
                            sx={{ ml: 1, opacity: anchorEl ? 1 : 0.4 }}
                        >
                            <MoreVertIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </ListItemButton>
                <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleMenuClose}
                    onClick={(e) => e.stopPropagation()}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                    <MenuItem onClick={handleRenameClick}>Rename</MenuItem>
                    <MenuItem onClick={handleDeleteClick}>Delete</MenuItem>
                </Menu>
            </ListItem>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
                <DialogTitle>Delete Conversation</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete "{conversation.title}"? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ConversationItem;
