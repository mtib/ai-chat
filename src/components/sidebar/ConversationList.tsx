import React, { useState } from 'react';
import { List, ListItem, Button, Box, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useConversationContext } from '../../contexts/ConversationContext';
import NewConversationDialog from './NewConversationDialog';
import ConversationItem from './ConversationItem';

const ConversationList: React.FC = () => {
    const {
        activeConversation,
        filteredConversations,
        setActiveConversation,
        createConversation,
        deleteConversation,
        updateConversationTitle
    } = useConversationContext();

    const [dialogOpen, setDialogOpen] = useState(false);

    const handleNewConversation = (conversation: any) => {
        createConversation(conversation);
        setDialogOpen(false);
    };

    return (
        <>
            <List sx={{ py: 0 }}>
                <ListItem sx={{ py: 0 }}>
                    <Button
                        fullWidth
                        startIcon={<AddIcon />}
                        onClick={() => setDialogOpen(true)}
                        sx={{ justifyContent: 'flex-start' }}
                    >
                        New Conversation
                    </Button>
                </ListItem>

                {filteredConversations.length > 0 ? (
                    filteredConversations.map((conversation) => (
                        <ConversationItem
                            key={conversation.id}
                            conversation={conversation}
                            isActive={activeConversation?.id === conversation.id}
                            onClick={() => setActiveConversation(conversation)}
                            onRename={async (id, newTitle) => {
                                await updateConversationTitle(id, newTitle);
                            }}
                            onDelete={async (id) => {
                                await deleteConversation(id);
                            }}
                        />
                    ))
                ) : (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            No conversations found
                        </Typography>
                    </Box>
                )}
            </List>

            <NewConversationDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onCreate={handleNewConversation}
            />
        </>
    );
};

export default ConversationList;
