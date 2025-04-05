import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Drawer, AppBar, Toolbar, Typography, Divider, TextField, IconButton } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ChatPanel from './components/ChatPanel';
import ConversationList from './components/ConversationList';
import { useConversations } from './hooks/useConversations';
import { theme } from './theme/theme';

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

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ display: 'flex', height: '100vh' }}>
                <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                    <Toolbar>
                        <ChatIcon sx={{ mr: 2 }} />
                        <Typography variant="h6" noWrap component="div">
                            Story Crafter AI
                        </Typography>
                    </Toolbar>
                </AppBar>
                <Drawer
                    variant="permanent"
                    sx={{
                        width: drawerWidth,
                        flexShrink: 0,
                        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
                    }}
                >
                    <Toolbar />
                    <Box sx={{ overflow: 'auto', p: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search conversations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} />,
                                }}
                                sx={{ mr: 1 }}
                            />
                            <IconButton color="primary" onClick={createConversation}>
                                <AddIcon />
                            </IconButton>
                        </Box>
                        <Divider />
                        <ConversationList
                            conversations={filteredConversations}
                            activeConversation={activeConversation}
                            onSelect={setActiveConversation}
                            onUpdate={updateConversation}
                            onDelete={deleteConversation}
                        />
                    </Box>
                </Drawer>
                <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                    <Toolbar />
                    {activeConversation ? (
                        <ChatPanel
                            conversation={activeConversation}
                            onConversationUpdate={updateConversation}
                        />
                    ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
                            <Typography variant="h6" color="text.secondary">
                                Create a new conversation or select an existing one
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>
        </ThemeProvider>
    );
}

export default App;
