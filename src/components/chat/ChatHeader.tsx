import React, { useState } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography as MuiTypography, Button as MuiButton, Box as MuiBox } from '@mui/material';
import { Conversation } from '../../types';

// Define prompt templates that will be available
const PROMPT_TEMPLATES = {
    GENERIC: "I am a helpful AI assistant. I'll answer questions, provide information, and assist with various tasks.",
    CODING: "I am a coding assistant. I can help with programming questions, debugging, explaining code concepts, and providing code examples across various languages and frameworks.",
    CREATIVE: "I am a creative conversation assistant. I can help brainstorm ideas, develop concepts, and engage in imaginative discussions across various topics."
};

interface ChatHeaderProps {
    conversation: Conversation;
    onConversationUpdate: (conversation: Conversation) => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ conversation, onConversationUpdate }) => {
    const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

    const handleExportClick = () => {
        try {
            const dataStr = JSON.stringify(conversation, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

            const exportFileName = `${conversation.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;

            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileName);
            linkElement.click();
        } catch (error) {
            console.error('Error exporting conversation:', error);
            alert('Failed to export conversation');
        }
    };

    const handleSetPromptTemplate = (templateContent: string) => {
        const messages = [...conversation.messages];
        const systemMessageIndex = messages.findIndex(m => m.role === 'system');

        if (systemMessageIndex >= 0) {
            // Update existing system message
            messages[systemMessageIndex] = { ...messages[systemMessageIndex], content: templateContent };
        } else {
            // Add new system message at the beginning
            messages.unshift({ role: 'system', content: templateContent });
        }

        onConversationUpdate({
            ...conversation,
            messages
        });

        setIsTemplateDialogOpen(false);
    };

    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, py: 1 }}>
            <Typography variant="h6" fontFamily="Sono">
                {conversation.title}
            </Typography>

            <Box>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setIsTemplateDialogOpen(true)}
                    sx={{ mr: 1 }}
                >
                    Set Template
                </Button>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={handleExportClick}
                >
                    Export
                </Button>
            </Box>

            {/* Template Selection Dialog */}
            <Dialog open={isTemplateDialogOpen} onClose={() => setIsTemplateDialogOpen(false)}>
                <DialogTitle>Select Conversation Template</DialogTitle>
                <DialogContent>
                    <MuiTypography variant="body2" sx={{ mb: 2 }}>
                        Choose a template to set the AI's behavior for this conversation:
                    </MuiTypography>

                    <MuiBox sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={() => handleSetPromptTemplate(PROMPT_TEMPLATES.GENERIC)}
                            sx={{ justifyContent: 'flex-start', textAlign: 'left', py: 2 }}
                        >
                            <MuiBox>
                                <MuiTypography variant="subtitle1" fontFamily="Sono">Generic Assistant</MuiTypography>
                                <MuiTypography variant="body2" color="text.secondary">
                                    General-purpose AI assistant for answering questions and providing information
                                </MuiTypography>
                            </MuiBox>
                        </Button>

                        <Button
                            variant="outlined"
                            onClick={() => handleSetPromptTemplate(PROMPT_TEMPLATES.CODING)}
                            sx={{ justifyContent: 'flex-start', textAlign: 'left', py: 2 }}
                        >
                            <MuiBox>
                                <MuiTypography variant="subtitle1" fontFamily="Sono">Coding Assistant</MuiTypography>
                                <MuiTypography variant="body2" color="text.secondary">
                                    Specialized in programming help, code examples, and technical explanations
                                </MuiTypography>
                            </MuiBox>
                        </Button>

                        <Button
                            variant="outlined"
                            onClick={() => handleSetPromptTemplate(PROMPT_TEMPLATES.CREATIVE)}
                            sx={{ justifyContent: 'flex-start', textAlign: 'left', py: 2 }}
                        >
                            <MuiBox>
                                <MuiTypography variant="subtitle1" fontFamily="Sono">Creative Assistant</MuiTypography>
                                <MuiTypography variant="body2" color="text.secondary">
                                    Helps with brainstorming, creative discussions, and developing ideas
                                </MuiTypography>
                            </MuiBox>
                        </Button>
                    </MuiBox>
                </DialogContent>
                <DialogActions>
                    <MuiButton onClick={() => setIsTemplateDialogOpen(false)}>Cancel</MuiButton>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ChatHeader;
