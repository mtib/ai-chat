import React, { useRef } from 'react';
import { Box, TextField, Button, Divider, Tooltip, Stack } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import UploadIcon from '@mui/icons-material/Upload';
import { useConversationContext } from '../../contexts/ConversationContext';
import ConversationList from './ConversationList';
import { Conversation } from '../../types';
import { saveConversationToFile } from '../../utils/fileUtils';
import ApiKeyModal from '../ApiKeyModal';
import StorageServerModal from '../StorageServerModal';

interface SidebarProps {
    onItemClick?: () => void; // Optional callback for when an item is clicked
}

const Sidebar: React.FC<SidebarProps> = ({ onItemClick }) => {
    const {
        activeConversation,
        filteredConversations,
        searchQuery,
        setSearchQuery,
        setActiveConversation,
        createConversation,
        deleteConversation,
        updateConversationTitle
    } = useConversationContext();

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const content = await file.text();
            const importedConversation = JSON.parse(content) as Conversation;

            // Validate the imported conversation format
            if (!importedConversation.id ||
                !importedConversation.title ||
                !Array.isArray(importedConversation.messages)) {
                throw new Error('Invalid conversation file format');
            }

            // Save the imported conversation
            await saveConversationToFile(importedConversation);

            // Force reload of conversations
            window.location.reload();
        } catch (error) {
            console.error('Error importing conversation:', error);
            alert('Failed to import conversation. Please check the file format.');
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <>
            <Stack direction="row" alignItems="center" sx={{ mb: 1, px: 1 }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} />,
                    }}
                />
            </Stack>

            <Stack direction="row" justifyContent="center" sx={{ mb: 1, px: 1 }}>
                <Tooltip title="Import conversation from file">
                    <Button
                        startIcon={<UploadIcon />}
                        variant="outlined"
                        size="small"
                        onClick={handleImportClick}
                        fullWidth
                    >
                        Import
                    </Button>
                </Tooltip>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    accept=".json"
                />
            </Stack>

            <Divider />
            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                <ConversationList onItemClick={onItemClick} />
            </Box>
            <Stack direction="column" sx={{ px: 1 }}>
                <StorageServerModal />
                <ApiKeyModal />
            </Stack>
        </>
    );
};

export default Sidebar;
