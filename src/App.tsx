import React, { useRef } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Drawer, AppBar, Toolbar, Typography, Divider, TextField, Button, Tooltip } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import SearchIcon from '@mui/icons-material/Search';
import UploadIcon from '@mui/icons-material/Upload';
import ChatPanel from './components/ChatPanel';
import ConversationList from './components/ConversationList';
import ApiKeyModal from './components/ApiKeyModal';
import { useConversations } from './hooks/useConversations';
import { theme } from './theme/theme';
import { saveConversationToFile } from './utils/fileUtils';
import { Conversation } from './types';

const drawerWidth = 240;

function App() {
    const {
        activeConversation,
        filteredConversations,
        searchQuery,
        setActiveConversation,
        setSearchQuery,
        createConversation,
        updateConversation,
        deleteConversation
    } = useConversations();

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
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
                <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                    <Toolbar>
                        <ChatIcon sx={{ mr: 2 }} />
                        <Typography variant="h6" noWrap component="div">
                            Conversation AI
                        </Typography>
                    </Toolbar>
                </AppBar>
                <Drawer
                    variant="permanent"
                    sx={{
                        width: drawerWidth,
                        flexShrink: 0,
                        [`& .MuiDrawer-paper`]: {
                            width: drawerWidth,
                            boxSizing: 'border-box',
                            height: '100%',
                            overflow: 'hidden',
                        },
                    }}
                >
                    <Toolbar />
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: 'calc(100% - 64px)', // height minus toolbar
                        overflow: 'hidden'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, px: 1 }}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search conversations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} />,
                                }}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1, px: 1 }}>
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
                        </Box>

                        <Divider />
                        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                            <ConversationList
                                conversations={filteredConversations}
                                selectedConversation={activeConversation || undefined}
                                activeConversation={activeConversation}
                                onSelect={setActiveConversation}
                                onNew={createConversation}
                                onDelete={deleteConversation}
                                onUpdate={updateConversation}
                            />
                        </Box>
                    </Box>
                </Drawer>
                <Box component="main" sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100vh',
                    overflow: 'hidden'
                }}>
                    <Toolbar /> {/* This creates space for the AppBar */}
                    <Box sx={{
                        p: 3,
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                        {activeConversation ? (
                            <ChatPanel
                                conversation={activeConversation}
                                onConversationUpdate={updateConversation}
                            />
                        ) : (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                <Typography variant="h6" color="text.secondary">
                                    Create a new conversation or select an existing one
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
                <ApiKeyModal />
            </Box>
        </ThemeProvider>
    );
}

export default App;
