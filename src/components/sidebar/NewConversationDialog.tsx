import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography
} from '@mui/material';
import { Conversation } from '../../types';

// Define prompt templates that will be available
const PROMPT_TEMPLATES = {
    GENERIC: "I am a helpful AI assistant. I'll answer questions, provide information, and assist with various tasks.",
    CODING: "I am a coding assistant. I can help with programming questions, debugging, explaining code concepts, and providing code examples across various languages and frameworks.",
    CREATIVE: "I am a creative conversation assistant. I can help brainstorm ideas, develop concepts, and engage in imaginative discussions across various topics."
};

interface NewConversationDialogProps {
    open: boolean;
    onClose: () => void;
    onCreate: (conversation: Conversation) => void;
}

const NewConversationDialog: React.FC<NewConversationDialogProps> = ({
    open,
    onClose,
    onCreate
}) => {
    const [title, setTitle] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState(PROMPT_TEMPLATES.GENERIC);

    const handleCreate = () => {
        const newConversation: Conversation = {
            id: Date.now().toString(),
            title: title.trim() || 'New Conversation',
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

        onCreate(newConversation);
        handleClose();
    };

    const handleClose = () => {
        setTitle('');
        setSelectedTemplate(PROMPT_TEMPLATES.GENERIC);
        onClose();
    };

    const getTemplateButtonVariant = (template: string) => {
        return selectedTemplate === template ? "contained" : "outlined";
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Create New Conversation</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    label="Title"
                    fullWidth
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    variant="outlined"
                    placeholder="Enter conversation title"
                    sx={{ mb: 3 }}
                />

                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Choose a Template:
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button
                        variant={getTemplateButtonVariant(PROMPT_TEMPLATES.GENERIC)}
                        onClick={() => setSelectedTemplate(PROMPT_TEMPLATES.GENERIC)}
                        sx={{ justifyContent: 'flex-start', textAlign: 'left', py: 1.5 }}
                    >
                        <Box>
                            <Typography variant="subtitle2" fontFamily="Sono">Generic Assistant</Typography>
                            <Typography variant="body2" color="text.secondary">
                                General-purpose AI assistant for answering questions and providing information
                            </Typography>
                        </Box>
                    </Button>

                    <Button
                        variant={getTemplateButtonVariant(PROMPT_TEMPLATES.CODING)}
                        onClick={() => setSelectedTemplate(PROMPT_TEMPLATES.CODING)}
                        sx={{ justifyContent: 'flex-start', textAlign: 'left', py: 1.5 }}
                    >
                        <Box>
                            <Typography variant="subtitle2" fontFamily="Sono">Coding Assistant</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Specialized in programming help, code examples, and technical explanations
                            </Typography>
                        </Box>
                    </Button>

                    <Button
                        variant={getTemplateButtonVariant(PROMPT_TEMPLATES.CREATIVE)}
                        onClick={() => setSelectedTemplate(PROMPT_TEMPLATES.CREATIVE)}
                        sx={{ justifyContent: 'flex-start', textAlign: 'left', py: 1.5 }}
                    >
                        <Box>
                            <Typography variant="subtitle2" fontFamily="Sono">Creative Assistant</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Helps with brainstorming, creative discussions, and developing ideas
                            </Typography>
                        </Box>
                    </Button>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button onClick={handleCreate} variant="contained" color="primary">Create</Button>
            </DialogActions>
        </Dialog>
    );
};

export default NewConversationDialog;
