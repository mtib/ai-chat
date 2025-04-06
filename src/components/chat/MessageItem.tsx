import React, { useState } from 'react';
import { Box, Paper, Avatar, IconButton, Menu, MenuItem, ListItemIcon, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SettingsIcon from '@mui/icons-material/Settings';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { Message } from '../../types';
import Markdown from 'markdown-to-jsx';

interface MessageItemProps {
    message: Message;
    index: number;
    onEdit: (index: number, content: string) => void;
    onDelete: (index: number) => void;
    onRetry: (index: number) => void;
    onToggleStar: (index: number) => void;
    isEditing: boolean;
    editContent: string;
    setEditingMessage: React.Dispatch<React.SetStateAction<{ index: number, content: string; } | null>>;
}

const MessageItem: React.FC<MessageItemProps> = ({
    message,
    index,
    onEdit,
    onDelete,
    onRetry,
    onToggleStar,
    isEditing,
    editContent,
    setEditingMessage
}) => {
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [showCopySuccess, setShowCopySuccess] = useState(false);

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setMenuAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setMenuAnchorEl(null);
    };

    const handleEditClick = () => {
        setEditingMessage({ index, content: message.content });
        handleCloseMenu();
    };

    const handleDeleteClick = () => {
        onDelete(index);
        handleCloseMenu();
    };

    const handleRetryClick = () => {
        onRetry(index);
        handleCloseMenu();
    };

    const handleCopyClick = async () => {
        await navigator.clipboard.writeText(message.content);
        setShowCopySuccess(true);
        setTimeout(() => setShowCopySuccess(false), 2000);
        handleCloseMenu();
    };

    const handleStarClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleStar(index);
    };

    const handleEditMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditingMessage(prev => prev ? { ...prev, content: e.target.value } : null);
    };

    const handleSaveEdit = () => {
        onEdit(index, editContent);
        setEditingMessage(null);
    };

    const handleEditKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            handleSaveEdit();
        } else if (e.key === 'Escape') {
            setEditingMessage(null);
        }
    };

    const getAvatarContent = () => {
        switch (message.role) {
            case 'user':
                return <PersonIcon />;
            case 'assistant':
                return <SmartToyIcon />;
            case 'system':
                return <SettingsIcon />;
            default:
                return <PersonIcon />;
        }
    };

    const getAvatarColor = () => {
        switch (message.role) {
            case 'user':
                return 'primary.main';
            case 'assistant':
                return 'secondary.main';
            case 'system':
                return 'info.main';
            default:
                return 'primary.main';
        }
    };

    const getPaperBackgroundColor = () => {
        switch (message.role) {
            case 'user':
                return 'primary.dark';
            case 'assistant':
                return '#1E0C30'; // Darker background for assistant messages
            case 'system':
                return '#1E1236'; // Darker background for system messages
            default:
                return 'background.paper';
        }
    };

    return (
        <>
            <Box
                sx={{
                    display: 'flex',
                    mb: 2,
                    flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                    alignItems: 'flex-start'
                }}
            >
                <Avatar
                    sx={{
                        bgcolor: getAvatarColor(),
                        mr: message.role === 'user' ? 0 : 1,
                        ml: message.role === 'user' ? 1 : 0,
                        display: { xs: 'none', sm: 'flex' } // Hide avatar on small screens
                    }}
                >
                    {getAvatarContent()}
                </Avatar>

                <Paper
                    elevation={1}
                    sx={{
                        px: 1.5,
                        pt: 0.5,
                        maxWidth: { xs: '85%', sm: '75%', md: '70%' }, // More space on mobile
                        bgcolor: getPaperBackgroundColor(),
                        borderRadius: 2,
                        borderLeft: message.starred ? '3px solid gold' : 'none'
                    }}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        {/* Action buttons and system instruction in same row */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            {message.role === 'system' ? (
                                <Typography variant="caption" fontWeight="medium" color="info.light">
                                    SYSTEM
                                </Typography>
                            ) : (
                                <Typography
                                    variant="caption"
                                    fontWeight="medium"
                                    sx={{
                                        display: { xs: 'inline', sm: 'none' },
                                        color: message.role === 'user' ? 'primary.light' : 'secondary.light'
                                    }}
                                >
                                    {message.role === 'user' ? 'YOU' : 'AI'}
                                </Typography>
                            )}
                            <Box sx={{ display: 'flex' }}>
                                {message.role !== 'system' && (
                                    <IconButton size="small" onClick={handleStarClick} sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}>
                                        {message.starred ?
                                            <StarIcon fontSize="small" sx={{ color: 'gold' }} /> :
                                            <StarBorderIcon fontSize="small" />
                                        }
                                    </IconButton>
                                )}
                                <IconButton size="small" onClick={handleOpenMenu} sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}>
                                    <MoreVertIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </Box>

                        {/* Message content */}
                        <Box sx={{
                            fontFamily: 'Sono',
                            '& > *:first-child': { pt: 0, mt: 0 },
                            '& > * > *:first-child': { pt: 0, mt: 0 },
                            fontSize: { xs: '0.9rem', sm: '1rem' } // Slightly smaller font on mobile
                        }}>
                            <Markdown options={{
                                forceBlock: true,
                                overrides: {
                                    pre: {
                                        component: ({ children, ...props }) => {
                                            return (
                                                <Box
                                                    component="pre"
                                                    sx={{
                                                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                                        p: 1,
                                                        borderRadius: 1,
                                                        overflowX: 'auto',
                                                        mb: 1,
                                                        mt: 1,
                                                        '& code': {
                                                            fontFamily: 'Sono',
                                                            fontVariationSettings: "'MONO' 1",
                                                            backgroundColor: 'transparent',
                                                            p: 0
                                                        },
                                                    }}
                                                    {...props}
                                                >
                                                    {children}
                                                </Box>
                                            );
                                        }
                                    },
                                    code: {
                                        component: ({ children, className }) => {
                                            const isInline = !className?.includes('language-');
                                            return (
                                                <Box
                                                    component="code"
                                                    sx={{
                                                        fontFamily: 'Sono',
                                                        fontVariationSettings: "'MONO' 1",
                                                        backgroundColor: isInline ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
                                                        px: isInline ? 0.5 : 0,
                                                        py: isInline ? 0.2 : 0,
                                                        borderRadius: isInline ? 1 : 0,
                                                        display: 'inline',
                                                        fontSize: '0.875rem',
                                                    }}
                                                >
                                                    {children}
                                                </Box>
                                            );
                                        }
                                    },
                                    img: {
                                        component: ({ src, alt }) => (
                                            <img
                                                src={src}
                                                alt={alt}
                                                style={{
                                                    maxWidth: '100%',
                                                    borderRadius: 8,
                                                    marginTop: 8,
                                                    marginBottom: 8,
                                                }}
                                            />
                                        )
                                    },
                                }
                            }}>
                                {message.content}
                            </Markdown>
                        </Box>
                    </Box>
                </Paper>
            </Box>

            {/* Message actions menu */}
            <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleCloseMenu}
            >
                <MenuItem onClick={handleCopyClick}>
                    <ListItemIcon>
                        <ContentCopyIcon fontSize="small" />
                    </ListItemIcon>
                    Copy Content
                </MenuItem>
                <MenuItem onClick={handleEditClick}>
                    <ListItemIcon>
                        <EditIcon fontSize="small" />
                    </ListItemIcon>
                    Edit
                </MenuItem>
                <MenuItem onClick={handleDeleteClick}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" />
                    </ListItemIcon>
                    Delete
                </MenuItem>
                {message.role === 'assistant' && (
                    <MenuItem onClick={handleRetryClick}>
                        <ListItemIcon>
                            <RestartAltIcon fontSize="small" />
                        </ListItemIcon>
                        Retry
                    </MenuItem>
                )}
            </Menu>

            {/* Edit message dialog */}
            <Dialog
                open={isEditing}
                onClose={() => setEditingMessage(null)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Edit Message
                    {message.role === 'assistant' && (
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
                        value={editContent}
                        onChange={handleEditMessageChange}
                        variant="outlined"
                        margin="dense"
                        onKeyDown={handleEditKeyDown}
                        helperText="Press Ctrl+Enter to save"
                        InputProps={{
                            sx: {
                                fontFamily: 'Sono',
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditingMessage(null)}>Cancel</Button>
                    <Button onClick={handleSaveEdit} color="primary" variant="contained">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default MessageItem;
