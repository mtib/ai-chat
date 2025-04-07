import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    Stepper,
    Step,
    StepLabel,
    CircularProgress
} from '@mui/material';
import { Conversation, ServerAssistantConfig } from '../../types';
import { fetchAssistantConfig } from '../../utils/assistantServerUtils';
import ServerAssistantConfigComponent from './ServerAssistantConfig';

// Define prompt templates that will be available
const PROMPT_TEMPLATES = {
    GENERIC: "I am a helpful AI assistant. I'll answer questions, provide information, and assist with various tasks.",
    CODING: "I am a coding assistant. I can help with programming questions, debugging, explaining code concepts, and providing code examples across various languages and frameworks.",
    CREATIVE: "I am a creative conversation assistant. I can help brainstorm ideas, develop concepts, and engage in imaginative discussions across various topics.",
    SERVER_ASSISTANT: "server-assistant" // Special value to indicate server assistant
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
    const [activeStep, setActiveStep] = useState(0);
    const [serverAssistant, setServerAssistant] = useState<ServerAssistantConfig | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCreate = async () => {
        if (selectedTemplate === PROMPT_TEMPLATES.SERVER_ASSISTANT && !serverAssistant) {
            setActiveStep(1);
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            let systemPrompt = selectedTemplate;
            let assistantConfig = serverAssistant;

            // If using server assistant, fetch the system prompt from server
            if (selectedTemplate === PROMPT_TEMPLATES.SERVER_ASSISTANT && serverAssistant) {
                try {
                    const config = await fetchAssistantConfig(serverAssistant.baseUrl, serverAssistant.token);
                    systemPrompt = config.prompt;

                    // Update server assistant config with additional information
                    assistantConfig = {
                        ...serverAssistant,
                        description: config.description,
                        shortDescription: config.short_description,
                        embeddingModel: config.embedding
                    };
                } catch (err) {
                    console.error('Error fetching assistant config:', err);
                    setError('Failed to fetch system prompt from server assistant.');
                    setIsLoading(false);
                    return;
                }
            }

            const newConversation: Conversation = {
                id: Date.now().toString(),
                title: title.trim() || 'New Conversation',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                messages: [],
                ...(assistantConfig ? { serverAssistant: assistantConfig } : {})
            };

            // Add system prompt if a template was selected
            if (systemPrompt && systemPrompt !== PROMPT_TEMPLATES.SERVER_ASSISTANT) {
                newConversation.messages.push({
                    role: 'system',
                    content: systemPrompt
                });
            }

            onCreate(newConversation);
            handleClose();
        } catch (err) {
            console.error('Error creating conversation:', err);
            setError('Failed to create conversation.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setTitle('');
        setSelectedTemplate(PROMPT_TEMPLATES.GENERIC);
        setActiveStep(0);
        setServerAssistant(null);
        setIsLoading(false);
        setError('');
        onClose();
    };

    const getTemplateButtonVariant = (template: string) => {
        return selectedTemplate === template ? "contained" : "outlined";
    };

    const handleServerAssistantConfigured = (config: ServerAssistantConfig) => {
        setServerAssistant(config);
        setActiveStep(0); // Go back to first step
        setSelectedTemplate(PROMPT_TEMPLATES.SERVER_ASSISTANT);
    };

    const handleCancel = () => {
        if (activeStep > 0) {
            setActiveStep(0);
        } else {
            handleClose();
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Create New Conversation</DialogTitle>

            <DialogContent>
                <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
                    <Step>
                        <StepLabel>Choose Template</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel>Configure</StepLabel>
                    </Step>
                </Stepper>

                {activeStep === 0 ? (
                    <>
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

                        {error && <Typography color="error" sx={{ mt: 1, mb: 1 }}>{error}</Typography>}

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

                            <Button
                                variant={getTemplateButtonVariant(PROMPT_TEMPLATES.SERVER_ASSISTANT)}
                                onClick={() => {
                                    if (!serverAssistant) {
                                        setActiveStep(1);
                                    } else {
                                        setSelectedTemplate(PROMPT_TEMPLATES.SERVER_ASSISTANT);
                                    }
                                }}
                                sx={{ justifyContent: 'flex-start', textAlign: 'left', py: 1.5 }}
                            >
                                <Box>
                                    <Typography variant="subtitle2" fontFamily="Sono">Server Assistant</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {serverAssistant
                                            ? `Connected to ${serverAssistant.baseUrl}`
                                            : 'Connect to your custom assistant server with its own knowledge base'}
                                    </Typography>
                                </Box>
                            </Button>
                        </Box>
                    </>
                ) : (
                    <ServerAssistantConfigComponent
                        onConfigured={handleServerAssistantConfigured}
                        onCancel={() => setActiveStep(0)}
                    />
                )}
            </DialogContent>

            {activeStep === 0 && (
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button
                        onClick={handleCreate}
                        variant="contained"
                        color="primary"
                        disabled={isLoading}
                    >
                        {isLoading ? <CircularProgress size={24} /> : 'Create'}
                    </Button>
                </DialogActions>
            )}
        </Dialog>
    );
};

export default NewConversationDialog;
