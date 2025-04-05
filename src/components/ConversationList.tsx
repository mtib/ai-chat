import React, { useState } from 'react';
import { List, ListItem, ListItemButton, ListItemText, Typography, Box, Menu, MenuItem, IconButton } from '@mui/material';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ConversationSettings from './ConversationSettings';
import { Conversation } from '../types';

interface ConversationListProps {
    conversations: Conversation[];
    activeConversation: Conversation | null;
    onSelect?: (conversation: Conversation) => void;
    onUpdate?: (conversation: Conversation) => void;
    onDelete?: (conversationId: string) => Promise<Conversation[]>;
}

const ConversationList: React.FC<ConversationListProps> = ({
    conversations,
    activeConversation,
    onSelect,
    onUpdate,
    onDelete
}) => {
    if (conversations.length === 0) {
        return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    No conversations yet
                </Typography>
            </Box>
        );
    }

    return (
        <List sx={{ width: '100%' }}>
            {conversations.map((conversation) => (
                <ListItem
                    disablePadding
                    key={conversation.id}
                    sx={{ mb: 0.5 }}
                    secondaryAction={
                        onUpdate && onDelete ? (
                            <ConversationSettings
                                conversation={conversation}
                                onConversationUpdate={onUpdate}
                                onConversationDelete={onDelete}
                            />
                        ) : undefined
                    }
                >
                    <ListItemButton
                        selected={activeConversation ? activeConversation.id === conversation.id : false}
                        onClick={() => onSelect && onSelect(conversation)}
                        sx={{
                            borderRadius: 1,
                            '&.Mui-selected': {
                                backgroundColor: 'primary.dark',
                            },
                            pr: 6, // Make space for the settings button
                        }}
                    >
                        <AutoStoriesIcon sx={{ mr: 1, fontSize: 20, color: 'primary.light' }} />
                        <ListItemText
                            primary={conversation.title}
                            secondary={`${conversation.messages.length} messages`}
                            primaryTypographyProps={{
                                noWrap: true,
                                fontSize: '0.9rem',
                                fontWeight: activeConversation && activeConversation.id === conversation.id ? 'bold' : 'normal'
                            }}
                            secondaryTypographyProps={{
                                noWrap: true,
                                fontSize: '0.75rem'
                            }}
                        />
                    </ListItemButton>
                </ListItem>
            ))}
        </List>
    );
};

export default ConversationList;
